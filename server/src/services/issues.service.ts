import { prisma } from "../lib/prisma.js";

const issueSelect = {
    id: true,
    title: true,
    createdAt: true,
    workspaceId: true,
    assigneeId: true,
    assignee: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
} as const;

export async function createIssue(title: string, workspaceId: number) {
    return prisma.issue.create({
        data: { title, workspaceId },
        select: issueSelect,
    });
}

export async function getIssues(workspaceId: number) {
    return prisma.issue.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
        select: issueSelect,
    });
}

export async function getMyIssues(userId: number, workspaceId: number) {
    return prisma.issue.findMany({
        where: { assigneeId: userId, workspaceId },
        orderBy: { createdAt: "desc" },
        select: issueSelect,
    });
}

export async function getIssueById(id: number, workspaceId: number) {
    return prisma.issue.findFirst({
        where: { id, workspaceId },
        select: issueSelect,
    });
}

export async function updateIssueTitle(id: number, title: string, workspaceId: number) {
    const existingIssue = await getIssueById(id, workspaceId);
    if (existingIssue === null) {
        return null;
    }

    return prisma.issue.update({
        where: { id },
        data: { title },
        select: issueSelect,
    });
}

export async function updateIssueAssignee(
    id: number,
    assigneeId: number | null,
    workspaceId: number,
) {
    const existingIssue = await prisma.issue.findFirst({
        where: { id, workspaceId },
        select: { id: true },
    });

    if (existingIssue === null) {
        return { kind: "issue_not_found" } as const;
    }

    if (assigneeId !== null) {
        const existingMember = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: assigneeId,
                },
            },
            select: { userId: true },
        });

        if (existingMember === null) {
            return { kind: "assignee_not_member" } as const;
        }
    }

    const issue = await prisma.issue.update({
        where: { id },
        data: { assigneeId },
        select: issueSelect,
    });

    return { kind: "updated", issue } as const;
}

export async function deleteIssue(id: number, workspaceId: number) {
    const existingIssue = await getIssueById(id, workspaceId);
    if (existingIssue === null) {
        return null;
    }

    return prisma.issue.delete({
        where: { id },
    });
}
