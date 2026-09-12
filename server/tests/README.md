# Milestones 6–7 validation

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

Milestone 7 adds `collaboration.test.ts`: author-only comment edits/deletes,
membership revocation, wrong-issue/project/workspace rejection, input validation,
chronological comments, safe author/actor projections, atomic activity recording,
no-op edits, concurrent title edits, project moves, and cascade cleanup. Migration
checks preserve old issue fields and default status/priority to `BACKLOG`/`NONE`.

New collaboration endpoints require both `workspaceId` and `projectId` in the query:

- `GET/POST /api/issues/:id/comments`
- `PATCH/DELETE /api/issues/:id/comments/:commentId`
- `GET /api/issues/:id/activity`
- `PATCH /api/issues/:id/workflow` with `status` and/or `priority`

Comments accept trimmed plain text of 1–5000 characters. A non-author receives
404 for an edit/delete, including workspace owners. Activity is read-only and
records issue creation, title, assignee, status, priority, and project changes in
the same transaction as the change. Older issues do not receive invented history.
Comments and history follow their issue when it moves to another project.

Basic status/priority fields are introduced in Milestone 7 to make the roadmap's
activity events functional. Search/filtering and the Kanban board remain in
Milestones 8 and 9. Status values are `BACKLOG`, `TODO`, `IN_PROGRESS`, `DONE`;
priority values are `NONE`, `LOW`, `MEDIUM`, `HIGH`, `URGENT`.

Browser smoke workflow: open an issue link, post/edit/delete a comment, change
title/assignee/status/priority, and verify activity after refresh. Check that
another member can comment but cannot edit/delete the author's comment.
