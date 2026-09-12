import { prisma } from "../lib/prisma.js";
import type { ActivityType, Prisma } from "../generated/prisma/client.js";
import type { IssueScope } from "./issue-scope.service.js";

export function recordActivity(
    tx: Prisma.TransactionClient,
    issueId: number,
    actorId: number,
    type: ActivityType,
    oldValue: string | null,
    newValue: string | null,
) {
    return tx.activity.create({ data: { issueId, actorId, type, oldValue, newValue, createdAt: new Date() } });
}

export function getActivity(scope: IssueScope) {
    return prisma.activity.findMany({
        where: { issue: scope },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
            id: true, type: true, oldValue: true, newValue: true, createdAt: true,
            actor: { select: { id: true, name: true } },
        },
    });
}
