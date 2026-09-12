import { prisma } from "../lib/prisma.js";
import { withIssueLock, type IssueScope } from "./issue-scope.service.js";

const commentSelect = {
    id: true, content: true, createdAt: true, updatedAt: true,
    author: { select: { id: true, name: true } },
} as const;

export function getComments(scope: IssueScope) {
    return prisma.comment.findMany({
        where: { issue: scope },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: commentSelect,
    });
}

export function createComment(scope: IssueScope, authorId: number, content: string) {
    return withIssueLock(scope, tx => tx.comment.create({
        data: { issueId: scope.id, authorId, content, createdAt: new Date() }, select: commentSelect,
    }));
}

export function editComment(scope: IssueScope, id: number, authorId: number, content: string) {
    return withIssueLock(scope, tx => tx.comment.update({
        where: { id, issueId: scope.id, authorId, issue: scope },
        data: { content }, select: commentSelect,
    }));
}

export function deleteComment(scope: IssueScope, id: number, authorId: number) {
    return withIssueLock(scope, tx => tx.comment.delete({
        where: { id, issueId: scope.id, authorId, issue: scope }, select: { id: true },
    }));
}
