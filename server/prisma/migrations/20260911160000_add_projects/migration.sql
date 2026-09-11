CREATE TABLE "Project" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(80) NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Project_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Project_id_workspaceId_key" ON "Project"("id", "workspaceId");
CREATE UNIQUE INDEX "Project_workspaceId_name_key" ON "Project"("workspaceId", "name");
ALTER TABLE "Issue" ADD COLUMN "projectId" INTEGER;
-- Preserve every existing issue and its workspace/assignee.
INSERT INTO "Project" ("name", "workspaceId", "updatedAt")
SELECT 'General', "id", CURRENT_TIMESTAMP FROM "Workspace";
UPDATE "Issue" SET "projectId" = "Project"."id" FROM "Project"
WHERE "Issue"."workspaceId" = "Project"."workspaceId";
ALTER TABLE "Issue" ALTER COLUMN "projectId" SET NOT NULL;
CREATE INDEX "Issue_projectId_workspaceId_createdAt_idx" ON "Issue"("projectId", "workspaceId", "createdAt");
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_projectId_workspaceId_fkey"
FOREIGN KEY ("projectId", "workspaceId") REFERENCES "Project"("id", "workspaceId") ON DELETE NO ACTION ON UPDATE NO ACTION;
