ALTER TABLE "Issue" ADD COLUMN "updatedAt" TIMESTAMP(3);
-- Preserve the most recent recorded issue change; legacy issues retain their creation date.
UPDATE "Issue" i SET "updatedAt" = GREATEST(i."createdAt", COALESCE((SELECT MAX(a."createdAt") FROM "Activity" a WHERE a."issueId" = i.id), i."createdAt"));
ALTER TABLE "Issue" ALTER COLUMN "updatedAt" SET NOT NULL, ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX "Issue_workspaceId_updatedAt_id_idx" ON "Issue"("workspaceId", "updatedAt", "id");
CREATE INDEX "Issue_workspaceId_status_priority_idx" ON "Issue"("workspaceId", "status", "priority");
CREATE INDEX "Issue_projectId_workspaceId_updatedAt_id_idx" ON "Issue"("projectId", "workspaceId", "updatedAt", "id");
CREATE INDEX "Issue_workspaceId_assigneeId_updatedAt_id_idx" ON "Issue"("workspaceId", "assigneeId", "updatedAt", "id");
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "Issue_title_idx" ON "Issue" USING GIN ("title" gin_trgm_ops);
