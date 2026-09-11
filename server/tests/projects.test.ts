import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { createAuthToken } from "../src/lib/jwt.js";

test("project migration preserves existing issues and enforces workspace integrity", async () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const connection = await pool.connect();
    try {
        await connection.query("BEGIN");
        // Transaction-local schema: no changes to application tables, rolled back even on failure.
        await connection.query('CREATE SCHEMA "devtrack_m6_migration_test"');
        await connection.query('SET LOCAL search_path TO "devtrack_m6_migration_test"');
        for (const migration of ["20260827101804_init", "20260829203542_add_user_model", "20260910075304_add_issue_assignee", "20260911090000_add_workspaces"]) {
            await connection.query(await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8"));
        }
        await connection.query(`INSERT INTO "Workspace" ("name", "updatedAt") VALUES ('A', NOW()), ('B', NOW());
            INSERT INTO "User" ("name", "email", "passwordHash", "updatedAt") VALUES ('User', 'migration@example.test', 'unused', NOW());
            INSERT INTO "Issue" ("title", "workspaceId", "assigneeId") VALUES ('Keep me', 1, 1), ('Keep me too', 2, NULL);`);
        const before = (await connection.query('SELECT * FROM "Issue" ORDER BY "id"')).rows;
        await connection.query(await readFile("prisma/migrations/20260911160000_add_projects/migration.sql", "utf8"));
        const after = (await connection.query('SELECT * FROM "Issue" ORDER BY "id"')).rows;
        assert.deepEqual(after.map(({ projectId, ...issue }) => issue), before);
        assert.equal(new Set(after.map(issue => issue.projectId)).size, 2);
        await connection.query("SAVEPOINT integrity");
        await assert.rejects(connection.query('UPDATE "Issue" SET "projectId" = $1 WHERE "id" = $2', [after[1].projectId, after[0].id]), { code: "23503" });
        await connection.query("ROLLBACK TO SAVEPOINT integrity");
        await connection.query('DELETE FROM "Workspace" WHERE "id" = 1');
        assert.equal((await connection.query('SELECT * FROM "Issue"')).rowCount, 1);
    } finally {
        await connection.query("ROLLBACK");
        connection.release();
        await pool.end();
    }
});

test("project and issue API: roles, validation, filtering, moves and tenant isolation", async () => {
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>(resolve => server.once("listening", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}/api`;
    const users: number[] = [];
    const workspaces: number[] = [];
    async function request(path: string, status: number, user?: number, method = "GET", body?: unknown) {
        const response = await fetch(base + path, {
            method, headers: { "Content-Type": "application/json", ...(user ? { Cookie: `devtrack_token=${createAuthToken(user)}` } : {}) },
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        const result = response.status === 204 ? null : await response.json();
        assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(result)}`);
        return result;
    }
    try {
        for (const role of ["owner", "member", "outsider"]) {
            const user = await prisma.user.create({ data: { name: role, email: `m6-${role}-${crypto.randomUUID()}@example.test`, passwordHash: "unused" } });
            users.push(user.id);
        }
        const [owner, member, outsider] = users as [number, number, number];
        for (const name of ["A", "B"]) {
            const workspace = await prisma.workspace.create({ data: { name, memberships: { create: [{ userId: owner, role: "OWNER" }, { userId: member }] } } });
            workspaces.push(workspace.id);
        }
        const [a, b] = workspaces as [number, number];
        const projects = (workspace = a, path = "") => `/projects${path}?workspaceId=${workspace}`;
        const issues = (workspace = a, path = "") => `/issues${path}?workspaceId=${workspace}`;
        await request(projects(), 401);
        await request(projects(), 403, outsider);
        await request("/projects", 400, owner);
        await request("/projects?workspaceId=2147483648", 400, owner);
        await request(projects(), 403, member, "POST", { name: "Denied" });
        for (const body of [null, {}, { name: " " }, { name: 1 }, { name: "x".repeat(81) }]) {
            await request(projects(), 400, owner, "POST", body);
        }
        const p = await request(projects(), 201, owner, "POST", { name: " Alpha " });
        assert.equal(p.name, "Alpha");
        const q = await request(projects(), 201, owner, "POST", { name: "Beta" });
        const foreign = await request(projects(b), 201, owner, "POST", { name: "Alpha" });
        await request(projects(), 409, owner, "POST", { name: "Alpha" });
        assert.deepEqual((await request(projects(), 200, member)).map((item: { id: number }) => item.id), [p.id, q.id]);
        await request(projects(a, `/${p.id}`), 403, member, "PATCH", { name: "No" });
        await request(projects(a, `/${p.id}`), 403, member, "DELETE");
        await request(projects(b, `/${p.id}`), 404, owner, "PATCH", { name: "No" });
        await request(projects(b, `/${p.id}`), 404, owner, "DELETE");
        await request(projects(a, "/1e2"), 400, owner, "DELETE");
        await request(projects(a, `/${p.id}`), 409, owner, "PATCH", { name: "Beta" });
        await request(projects(a, `/${p.id}`), 200, owner, "PATCH", { name: "Renamed" });
        await request(issues(), 400, owner, "POST", { title: "Missing project" });
        await request(issues(), 400, owner, "POST", null);
        await request(issues(), 404, owner, "POST", { title: "Wrong workspace", projectId: foreign.id });
        const issue = await request(issues(), 201, member, "POST", { title: "Task", projectId: p.id });
        assert.equal(issue.project.name, "Renamed");
        await request(issues(a, `/${issue.id}/assignee`), 200, owner, "PATCH", { assigneeId: member });
        await request(issues(a, `/${issue.id}/assignee`), 400, owner, "PATCH", { assigneeId: outsider });
        assert.equal((await request(issues(a, "/mine"), 200, member))[0].projectId, p.id);
        assert.equal((await request(issues() + `&projectId=${p.id}`, 200, member)).length, 1);
        assert.equal((await request(issues() + `&projectId=${q.id}`, 200, member)).length, 0);
        await request(issues() + `&projectId=${foreign.id}`, 404, owner);
        await request(issues() + "&projectId=0", 400, owner);
        await request(issues() + `&projectId=${p.id}`, 403, outsider);
        await request(issues(b, `/${issue.id}`), 404, owner);
        await request(issues(b, `/${issue.id}`), 404, owner, "PATCH", { title: "No" });
        await request(issues(b, `/${issue.id}`), 404, owner, "DELETE");
        await request(issues(b, `/${issue.id}/project`), 404, owner, "PATCH", { projectId: foreign.id });
        await request(issues(a, `/${issue.id}/project`), 404, owner, "PATCH", { projectId: foreign.id });
        await request(issues(a, `/${issue.id}/project`), 400, owner, "PATCH", { projectId: null });
        await request(projects(a, `/${p.id}`), 409, owner, "DELETE");
        await assert.rejects(prisma.issue.update({ where: { id: issue.id }, data: { projectId: foreign.id } }), { code: "P2003" });
        const moved = await request(issues(a, `/${issue.id}/project`), 200, member, "PATCH", { projectId: q.id });
        assert.equal(moved.assigneeId, member);
        assert.equal((await request(issues() + `&projectId=${p.id}`, 200, member)).length, 0);
        await request(projects(a, `/${p.id}`), 204, owner, "DELETE");
        await request(issues(a, `/${issue.id}`), 200, member, "PATCH", { title: "Updated" });
        await request(issues(a, `/${issue.id}`), 204, member, "DELETE");
        await request(projects(a, `/${q.id}`), 204, owner, "DELETE");
        await request(`/workspaces/${b}`, 204, owner, "DELETE");
        assert.equal(await prisma.project.count({ where: { workspaceId: b } }), 0);
    } finally {
        await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
        await prisma.workspace.deleteMany({ where: { id: { in: workspaces } } });
        await prisma.user.deleteMany({ where: { id: { in: users } } });
        await prisma.$disconnect();
    }
});
