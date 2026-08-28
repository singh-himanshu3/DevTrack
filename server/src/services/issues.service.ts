import { prisma } from "../lib/prisma.js";

export async function createIssue(title: string) {
    return prisma.issue.create({
        data: {
            title
        },
    });
}

export async function getIssues() {
    return prisma.issue.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });
}