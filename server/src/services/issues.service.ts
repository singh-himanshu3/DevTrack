import { prisma } from "../lib/prisma.js";
import type { ActivityType, IssuePriority, IssueStatus, Prisma } from "../generated/prisma/client.js";
import { recordActivity } from "./activity.service.js";
import { withIssueLock, type IssueScope } from "./issue-scope.service.js";

const issueSelect = {
    id: true, title: true, status: true, priority: true, createdAt: true,
    workspaceId: true, projectId: true,
    project: { select: { id: true, name: true } },
    assigneeId: true,
    assignee: { select: { id: true, name: true, email: true } },
} as const;

export async function createIssue(title: string, workspaceId: number, projectId: number, actorId: number) {
    return prisma.$transaction(async tx => {
        const issue = await tx.issue.create({ data: { title, workspaceId, projectId }, select: issueSelect });
        await recordActivity(tx, issue.id, actorId, "ISSUE_CREATED", null, title);
        return issue;
    });
}

export function getIssues(workspaceId: number, projectId?: number) {
    return prisma.issue.findMany({
        where: { workspaceId, ...(projectId === undefined ? {} : { projectId }) },
        orderBy: { createdAt: "desc" }, select: issueSelect,
    });
}

export function getMyIssues(userId: number, workspaceId: number) {
    return prisma.issue.findMany({
        where: { assigneeId: userId, workspaceId },
        orderBy: { createdAt: "desc" }, select: issueSelect,
    });
}

export function getIssueById(id: number, workspaceId: number, projectId?: number) {
    return prisma.issue.findFirst({
        where: { id, workspaceId, ...(projectId === undefined ? {} : { projectId }) }, select: issueSelect,
    });
}

type IssueRecord = Prisma.IssueGetPayload<{ select: typeof issueSelect }>;
async function saveChange(
    tx: Prisma.TransactionClient, issue: IssueRecord, actorId: number,
    type: ActivityType, oldValue: string | null, newValue: string | null,
    data: Prisma.IssueUncheckedUpdateInput,
) {
    const updated = await tx.issue.update({ where: { id: issue.id, workspaceId: issue.workspaceId }, data, select: issueSelect });
    await recordActivity(tx, issue.id, actorId, type, oldValue, newValue);
    return updated;
}

export function updateIssueTitle(scope: IssueScope, title: string, actorId: number) {
    return withIssueLock(scope, async tx => {
        const issue = await tx.issue.findUniqueOrThrow({ where: scope, select: issueSelect });
        if (issue.title === title) return issue;
        return saveChange(tx, issue, actorId, "TITLE_CHANGED", issue.title, title, { title });
    });
}

export async function updateIssueAssignee(scope: IssueScope, assigneeId: number | null, actorId: number) {
    const result = await withIssueLock(scope, async tx => {
        const issue = await tx.issue.findUniqueOrThrow({ where: scope, select: issueSelect });
        const member = assigneeId === null ? null : await tx.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId: scope.workspaceId, userId: assigneeId } },
            select: { user: { select: { name: true } } },
        });
        if (assigneeId !== null && member === null) return { kind: "assignee_not_member" } as const;
        if (issue.assigneeId === assigneeId) return { kind: "updated", issue } as const;
        const updated = await saveChange(tx, issue, actorId, "ASSIGNEE_CHANGED",
            issue.assignee?.name ?? null, member?.user.name ?? null, { assigneeId });
        return { kind: "updated", issue: updated } as const;
    });
    return result ?? { kind: "issue_not_found" } as const;
}

export function deleteIssue(scope: IssueScope) {
    return withIssueLock(scope, tx => tx.issue.delete({ where: scope }));
}

export function updateIssueProject(scope: IssueScope, projectId: number, actorId: number) {
    return withIssueLock(scope, async tx => {
        const issue = await tx.issue.findUniqueOrThrow({ where: scope, select: issueSelect });
        if (issue.projectId === projectId) return issue;
        const project = await tx.project.findUniqueOrThrow({ where: { id: projectId, workspaceId: scope.workspaceId }, select: { name: true } });
        return saveChange(tx, issue, actorId, "PROJECT_CHANGED", issue.project.name, project.name, { projectId });
    });
}

export function updateIssueWorkflow(scope: IssueScope, actorId: number, change: { status?: IssueStatus; priority?: IssuePriority }) {
    return withIssueLock(scope, async tx => {
        let issue = await tx.issue.findUniqueOrThrow({ where: scope, select: issueSelect });
        if (change.status !== undefined && issue.status !== change.status) {
            issue = await saveChange(tx, issue, actorId, "STATUS_CHANGED", issue.status, change.status, { status: change.status });
        }
        if (change.priority !== undefined && issue.priority !== change.priority) {
            issue = await saveChange(tx, issue, actorId, "PRIORITY_CHANGED", issue.priority, change.priority, { priority: change.priority });
        }
        return issue;
    });
}
