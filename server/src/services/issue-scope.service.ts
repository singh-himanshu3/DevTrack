import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

export interface IssueScope {
    id: number;
    workspaceId: number;
    projectId?: number;
}

// Serialize edits on the issue so activity captures the actual preceding value.
// Comment mutations take the same lock so a project move cannot race their scope check.
export function withIssueLock<T>(scope: IssueScope, action: (tx: Prisma.TransactionClient) => Promise<T>) {
    return prisma.$transaction(async tx => {
        const rows = await tx.$queryRaw<{ id: number }[]>(Prisma.sql`
            SELECT "id" FROM "Issue"
            WHERE "id" = ${scope.id} AND "workspaceId" = ${scope.workspaceId}
            ${scope.projectId === undefined ? Prisma.empty : Prisma.sql`AND "projectId" = ${scope.projectId}`}
            FOR UPDATE
        `);
        if (rows.length === 0) return null;
        return action(tx);
    });
}
