-- CreateEnum
CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateTable
CREATE TABLE "Workspace" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "workspaceId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("workspaceId", "userId")
);

-- Add the workspace column as nullable while existing rows are backfilled.
ALTER TABLE "Issue" ADD COLUMN "workspaceId" INTEGER;

-- Preserve the existing project data in one shared workspace.
INSERT INTO "Workspace" ("name", "updatedAt")
SELECT 'DevTrack Workspace', CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "User") OR EXISTS (SELECT 1 FROM "Issue");

-- Make the oldest existing user the owner and every other existing user a member.
WITH first_user AS (
    SELECT MIN("id") AS "id" FROM "User"
)
INSERT INTO "WorkspaceMember" ("workspaceId", "userId", "role")
SELECT
    workspace."id",
    app_user."id",
    CASE
        WHEN app_user."id" = first_user."id" THEN 'OWNER'::"WorkspaceRole"
        ELSE 'MEMBER'::"WorkspaceRole"
    END
FROM "Workspace" AS workspace
CROSS JOIN "User" AS app_user
CROSS JOIN first_user;

UPDATE "Issue"
SET "workspaceId" = (SELECT "id" FROM "Workspace" ORDER BY "id" LIMIT 1);

ALTER TABLE "Issue" ALTER COLUMN "workspaceId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");
CREATE INDEX "Issue_workspaceId_createdAt_idx" ON "Issue"("workspaceId", "createdAt");
CREATE INDEX "Issue_workspaceId_assigneeId_createdAt_idx" ON "Issue"("workspaceId", "assigneeId", "createdAt");

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
