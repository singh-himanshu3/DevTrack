BEGIN;
CREATE TYPE "IssueStatus" AS ENUM ('BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE');
CREATE TYPE "IssuePriority" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "ActivityType" AS ENUM ('ISSUE_CREATED', 'TITLE_CHANGED', 'ASSIGNEE_CHANGED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'PROJECT_CHANGED');
ALTER TABLE "Issue" ADD COLUMN "status" "IssueStatus" NOT NULL DEFAULT 'BACKLOG',
ADD COLUMN "priority" "IssuePriority" NOT NULL DEFAULT 'NONE';

CREATE TABLE "Comment" (
    "id" SERIAL PRIMARY KEY,
    "issueId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" VARCHAR(5000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Comment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Comment_issueId_createdAt_id_idx" ON "Comment"("issueId", "createdAt", "id");
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

CREATE TABLE "Activity" (
    "id" SERIAL PRIMARY KEY,
    "issueId" INTEGER NOT NULL,
    "actorId" INTEGER,
    "type" "ActivityType" NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Activity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Activity_issueId_createdAt_id_idx" ON "Activity"("issueId", "createdAt", "id");
CREATE INDEX "Activity_actorId_idx" ON "Activity"("actorId");
COMMIT;
