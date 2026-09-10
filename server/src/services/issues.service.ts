import { prisma } from "../lib/prisma.js";

const issueSelect = {
    id: true,
    title: true,
    createdAt: true,
    assigneeId: true,
    assignee: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
} as const;

export async function createIssue(title: string) {
    return prisma.issue.create({
        data: { title },
        select: issueSelect,
    });
}

export async function getIssues() {
    return prisma.issue.findMany({
        orderBy: { createdAt: "desc" },
        select: issueSelect,
    });
}

export async function getMyIssues(userId: number) {
    return prisma.issue.findMany({
        where: { assigneeId: userId },
        orderBy: { createdAt: "desc" },
        select: issueSelect,
    });
}

export async function getIssueById(id: number) {
    return prisma.issue.findUnique({
        where: { id },
        select: issueSelect,
    });
}

export async function updateIssueTitle(id: number, title: string) {
    const existingIssue = await getIssueById(id);
    if (existingIssue === null) {
        return null;
    }

    return prisma.issue.update({
        where: { id },
        data: { title },
        select: issueSelect,
    });
}

export async function updateIssueAssignee(id: number, assigneeId: number | null) {
    const existingIssue = await prisma.issue.findUnique({
        where: { id },
        select: { id: true },
    });

    if (existingIssue === null) {
        return { kind: "issue_not_found" } as const;
    }

    if (assigneeId !== null) {
        const existingUser = await prisma.user.findUnique({
            where: { id: assigneeId },
            select: { id: true },
        });

        if (existingUser === null) {
            return { kind: "user_not_found" } as const;
        }
    }

    const issue = await prisma.issue.update({
        where: { id },
        data: { assigneeId },
        select: issueSelect,
    });

    return { kind: "updated", issue } as const;
}

export async function deleteIssue(id: number) {
    const existingIssue = await getIssueById(id);
    if (existingIssue === null) {
        return null;
    }

    return prisma.issue.delete({
        where: { id },
    });
}
