# Issue search API

`GET /api/issues` and `GET /api/issues/mine` require the existing authentication cookie and a `workspaceId`. Both now return `{ items, page, limit, total, totalPages }` instead of an array. My Issues always intersects filters with the authenticated user's assignments.

Optional query parameters:

| Parameter | Accepted values | Default |
| --- | --- | --- |
| search | Literal, case-insensitive title substring, trimmed, up to 200 characters | No search |
| projectId | Positive project ID in the workspace | All projects |
| assigneeId | Positive user ID or `unassigned` | Any assignee |
| status | BACKLOG, TODO, IN_PROGRESS, DONE | All statuses |
| priority | NONE, LOW, MEDIUM, HIGH, URGENT | All priorities |
| sort | createdAt, updatedAt | createdAt |
| order | asc, desc | desc |
| page | Positive integer; offset must fit a PostgreSQL integer | 1 |
| limit | Integer from 1 through 100 | 20 |

All filters combine with AND. Unknown, repeated, nested, malformed, or out-of-range parameters return 400. A project outside the selected workspace returns 404; inaccessible workspaces return 403. An assignee with no matching issues returns zero results, without disclosing membership.

Counts and page contents are queried in one repeatable-read transaction. The issue ID breaks timestamp ties for deterministic ordering. An empty collection has `totalPages: 0`; pages beyond the last page return empty items with the requested page number. Separate page requests reflect live changes, so intervening edits can shift offset-based pages.

`updatedAt` tracks changes to issue properties, including assignment and project moves. Comments have their own timestamps and do not change issue ordering. The migration backfills existing issues from the latest recorded issue activity or their creation time, and installs PostgreSQL's `pg_trgm` extension for indexed title searches. The database migration role needs permission to install that extension.

The frontend preserves controls in URL query parameters, debounces title input by 300 ms, and resets the page when a filter, sort, or page size changes. Creating an issue reloads the server page so results continue to obey all active filters.

Validation: `npm test` in server runs database-backed API and migration tests against disposable records and transaction-local migration schemas. Run it only against a development/test database.
