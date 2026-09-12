import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { createAuthToken } from "../src/lib/jwt.js";
import { createIssue, updateIssueTitle } from "../src/services/issues.service.js";

test("collaboration migration preserves legacy issues and supplies workflow defaults", async () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = await pool.connect();
    try {
        await db.query("BEGIN");
        await db.query('CREATE SCHEMA "devtrack_m7_migration_test"');
        await db.query('SET LOCAL search_path TO "devtrack_m7_migration_test"');
        for (const name of ["20260827101804_init", "20260829203542_add_user_model", "20260910075304_add_issue_assignee", "20260911090000_add_workspaces", "20260911160000_add_projects"]) {
            await db.query(await readFile(`prisma/migrations/${name}/migration.sql`, "utf8"));
        }
        await db.query(`INSERT INTO "Workspace" ("name", "updatedAt") VALUES ('Legacy', NOW());
            INSERT INTO "Project" ("name", "workspaceId", "updatedAt") VALUES ('Legacy', 1, NOW());
            INSERT INTO "Issue" ("title", "workspaceId", "projectId") VALUES ('Keep this', 1, 1);`);
        const before = (await db.query('SELECT * FROM "Issue"')).rows[0];
        // Keep the migration inside this test's outer rollback transaction.
        const migration = await readFile("prisma/migrations/20260912080000_comments_and_activity/migration.sql", "utf8");
        await db.query(migration.replace(/^BEGIN;\s*/, "").replace(/COMMIT;\s*$/, ""));
        const { status, priority, ...after } = (await db.query('SELECT * FROM "Issue"')).rows[0];
        assert.deepEqual(after, before);
        assert.equal(status, "BACKLOG"); assert.equal(priority, "NONE");
        assert.equal((await db.query('SELECT * FROM "Activity"')).rowCount, 0);
    } finally {
        await db.query("ROLLBACK"); db.release(); await pool.end();
    }
});

test("comments and activity enforce membership, authorship, project scope and atomic history", async () => {
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>(resolve => server.once("listening", resolve));
    const address = server.address(); assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}/api/issues`;
    const userIds: number[] = [];
    const workspaceIds: number[] = [];
    async function request(path: string, expected: number, userId?: number, method = "GET", body?: unknown) {
        const response = await fetch(base + path, {
            method, headers: { "Content-Type": "application/json", ...(userId ? { Cookie: `devtrack_token=${createAuthToken(userId)}` } : {}) },
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        const result = response.status === 204 ? null : await response.json();
        assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(result)}`);
        assert.doesNotMatch(JSON.stringify(result), /passwordHash|unused-password|devtrack_token|stack|JWT_SECRET/);
        return result;
    }
    try {
        for (const name of ["Owner", "Author", "Other member", "Outsider"]) {
            const user = await prisma.user.create({ data: { name, email: `${crypto.randomUUID()}@example.test`, passwordHash: "unused-password" } });
            userIds.push(user.id);
        }
        const [owner, author, other, outsider] = userIds as [number, number, number, number];
        for (const name of ["Collaboration A", "Collaboration B"]) {
            const workspace = await prisma.workspace.create({ data: { name, memberships: { create: [
                { userId: owner, role: "OWNER" }, { userId: author }, { userId: other },
            ] } } });
            workspaceIds.push(workspace.id);
        }
        const [workspaceId, foreignWorkspaceId] = workspaceIds as [number, number];
        const project = await prisma.project.create({ data: { name: "A", workspaceId } });
        const secondProject = await prisma.project.create({ data: { name: "B", workspaceId } });
        const foreignProject = await prisma.project.create({ data: { name: "Foreign", workspaceId: foreignWorkspaceId } });
        const issue = await request(`?workspaceId=${workspaceId}`, 201, author, "POST", { title: "Original", projectId: project.id });
        const scope = { id: issue.id as number, workspaceId, projectId: project.id };
        const path = (suffix = "", projectId = project.id, workspace = workspaceId, id = issue.id) => `/${id}${suffix}?workspaceId=${workspace}&projectId=${projectId}`;
        const history = () => request(path("/activity"), 200, author);
        assert.equal(issue.status, "BACKLOG"); assert.equal(issue.priority, "NONE");
        assert.deepEqual((await history()).map((event: { type: string }) => event.type), ["ISSUE_CREATED"]);
        assert.deepEqual(await request(path("/comments"), 200, author), []);
        for (const suffix of ["/comments", "/activity"]) {
            await request(path(suffix), 401);
            await request(path(suffix), 403, outsider);
            await request(path(suffix, secondProject.id), 404, author);
            await request(path(suffix, foreignProject.id, foreignWorkspaceId), 404, author);
            await request(`/${issue.id}${suffix}?workspaceId=${workspaceId}`, 400, author);
            await request(path(suffix) + "&projectId=2", 400, author);
        }
        await request(path("/comments"), 403, outsider, "POST", { content: "No" });
        await request(path("/comments", secondProject.id), 404, author, "POST", { content: "No" });
        for (const content of ["", " \n ", null, 42, {}, "x".repeat(5001)]) {
            await request(path("/comments"), 400, author, "POST", { content });
        }
        await request(path("/comments"), 400, author, "POST", null);
        const comment = await request(path("/comments"), 201, author, "POST", { content: "  First\ncomment  ", authorId: owner });
        assert.equal(comment.content, "First\ncomment");
        assert.deepEqual(comment.author, { id: author, name: "Author" });
        const secondComment = await request(path("/comments"), 201, other, "POST", { content: "<script>alert('x')</script>" });
        const comments = await request(path("/comments"), 200, owner);
        assert.deepEqual(comments.map((item: { id: number }) => item.id), [comment.id, secondComment.id]);
        assert.deepEqual(Object.keys(comments[0].author).sort(), ["id", "name"]);
        for (const method of ["PATCH", "DELETE"]) {
            for (const user of [owner, other]) await request(path(`/comments/${comment.id}`), 404, user, method, { content: "Hijack" });
            await request(path(`/comments/${comment.id}`), 403, outsider, method, { content: "Hijack" });
            await request(path(`/comments/${comment.id}`, secondProject.id), 404, author, method, { content: "Hijack" });
            await request(path(`/comments/${comment.id}`, foreignProject.id, foreignWorkspaceId), 404, author, method, { content: "Hijack" });
        }
        const sibling = await request(`?workspaceId=${workspaceId}`, 201, author, "POST", { title: "Sibling", projectId: project.id });
        await request(path(`/comments/${comment.id}`, project.id, workspaceId, sibling.id), 404, author, "PATCH", { content: "Wrong issue" });
        await request(path(`/comments/${comment.id}`, project.id, workspaceId, sibling.id), 404, author, "DELETE");
        await prisma.workspaceMember.delete({ where: { workspaceId_userId: { workspaceId, userId: author } } });
        await request(path("/comments"), 403, author);
        await request(path("/comments"), 403, author, "POST", { content: "Former member" });
        await request(path(`/comments/${comment.id}`), 403, author, "PATCH", { content: "Former member" });
        await request(path(`/comments/${comment.id}`), 403, author, "DELETE");
        await prisma.workspaceMember.create({ data: { workspaceId, userId: author } });
        await request(path(`/comments/${comment.id}`), 400, author, "PATCH", { content: " " });
        const edited = await request(path(`/comments/${comment.id}`), 200, author, "PATCH", { content: "  Edited  " });
        assert.equal(edited.content, "Edited"); assert.equal(edited.createdAt, comment.createdAt);
        assert.ok(edited.updatedAt >= edited.createdAt);

        await request(path(), 200, author, "PATCH", { title: "Renamed" });
        await request(path(), 200, author, "PATCH", { title: " Renamed " });
        await request(path("/assignee"), 200, author, "PATCH", { assigneeId: other });
        await request(path("/assignee"), 200, author, "PATCH", { assigneeId: other });
        await request(path("/assignee"), 400, author, "PATCH", { assigneeId: outsider });
        await request(path("/workflow"), 200, author, "PATCH", { status: "IN_PROGRESS", priority: "HIGH" });
        await request(path("/workflow"), 200, author, "PATCH", { status: "IN_PROGRESS", priority: "HIGH" });
        for (const body of [null, [], {}, { status: "OPEN" }, { priority: null }, { priority: 1 }, { title: "Injected", status: "DONE" }]) {
            await request(path("/workflow"), 400, author, "PATCH", body);
        }
        await request(path("/workflow"), 403, outsider, "PATCH", { status: "DONE" });
        await request(path("/workflow", secondProject.id), 404, author, "PATCH", { status: "DONE" });
        await request(path("/workflow", foreignProject.id, foreignWorkspaceId), 404, author, "PATCH", { status: "DONE" });
        await request(path("", secondProject.id), 404, author, "PATCH", { title: "Wrong project" });
        await request(path("/assignee", secondProject.id), 404, author, "PATCH", { assigneeId: other });
        const events = await history();
        assert.deepEqual(events.map((event: { type: string }) => event.type), ["ISSUE_CREATED", "TITLE_CHANGED", "ASSIGNEE_CHANGED", "STATUS_CHANGED", "PRIORITY_CHANGED"]);
        assert.deepEqual(events.map((event: { oldValue: string | null; newValue: string | null }) => [event.oldValue, event.newValue]), [
            [null, "Original"], ["Original", "Renamed"], [null, "Other member"], ["BACKLOG", "IN_PROGRESS"], ["NONE", "HIGH"],
        ]);
        assert.deepEqual(Object.keys(events[0].actor).sort(), ["id", "name"]);
        const count = await prisma.issue.count({ where: { workspaceId } });
        await assert.rejects(createIssue("Rollback", workspaceId, project.id, -1), { code: "P2003" });
        assert.equal(await prisma.issue.count({ where: { workspaceId } }), count);
        await assert.rejects(updateIssueTitle(scope, "Rollback", -1), { code: "P2003" });
        assert.equal((await request(path(), 200, author)).title, "Renamed");
        assert.equal((await history()).length, 5);
        await Promise.all([
            request(path(), 200, author, "PATCH", { title: "Concurrent A" }),
            request(path(), 200, other, "PATCH", { title: "Concurrent B" }),
        ]);
        const concurrentEvents = (await history()).slice(-2);
        assert.equal(concurrentEvents[0].oldValue, "Renamed");
        assert.equal(concurrentEvents[1].oldValue, concurrentEvents[0].newValue);
        assert.equal((await request(path(), 200, author)).title, concurrentEvents[1].newValue);

        await request(path("/project"), 200, author, "PATCH", { projectId: secondProject.id });
        await request(path("/comments"), 404, author);
        await request(path(`/comments/${comment.id}`), 404, author, "PATCH", { content: "Stale project" });
        assert.equal((await request(path("/comments", secondProject.id), 200, author)).length, 2);
        assert.equal((await request(path("/activity", secondProject.id), 200, author)).at(-1).type, "PROJECT_CHANGED");
        await request(path(`/comments/${comment.id}`, secondProject.id), 204, author, "DELETE");
        assert.equal((await request(path("/comments", secondProject.id), 200, author)).length, 1);
        await request(path("", secondProject.id), 204, author, "DELETE");
        assert.equal(await prisma.comment.count({ where: { issueId: issue.id } }), 0);
        assert.equal(await prisma.activity.count({ where: { issueId: issue.id } }), 0);
    } finally {
        await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
        await prisma.workspace.deleteMany({ where: { id: { in: workspaceIds } } });
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
        await prisma.$disconnect();
    }
});
