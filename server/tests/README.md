# Milestone 6 validation

Run from `server` with PostgreSQL available and `DATABASE_URL` / `JWT_SECRET`
configured (the existing `.env` is loaded automatically):

```sh
npx prisma generate --config prisma7.config.ts
npx prisma migrate deploy --config prisma7.config.ts
npm run typecheck
npm test
```

Use a local development or test database. The API test starts Express on an
ephemeral loopback port, creates uniquely named test users and workspaces, and
removes those records in `finally`. It exercises authenticated owner, member,
outsider, and anonymous requests, project CRUD, input validation, duplicate names,
project filtering, assignment, issue moves, deletion protection, and workspace
isolation (including direct database constraint enforcement).

The migration test runs the migration history in a transaction-local schema,
seeds legacy issues, and checks that the new migration preserves their fields.
It also verifies cross-workspace project references fail and workspace deletion
still cascades. The entire transaction is rolled back.

Projects belong to a workspace and are visible to all its members. Owners manage
projects; members manage issues. New issues require `projectId`. Existing issues
are backfilled into a `General` project in their workspace. Project names are
unique within a workspace (case-sensitive), and projects with issues cannot be
deleted until those issues are moved or deleted.

Frontend checks: run `npm run build` and `npm run lint` from `client`.
Browser smoke workflow: sign in, create two projects, open a project, create and
assign an issue, move it to the other project, and verify its new project in
My Issues. Switching workspace clears the project filter and page state.
