import { prisma } from "../lib/prisma.js";

const projectSelect = {
    id: true,
    name: true,
    workspaceId: true,
    createdAt: true,
    updatedAt: true,
    _count: { select: { issues: true } },
} as const;

export function getProjects(workspaceId: number) {
    return prisma.project.findMany({
        where: { workspaceId },
        select: projectSelect,
        orderBy: { name: "asc" },
    });
}

export function getProjectById(id: number, workspaceId: number) {
    return prisma.project.findUnique({ where: { id, workspaceId }, select: projectSelect });
}

export function createProject(name: string, workspaceId: number) {
    return prisma.project.create({ data: { name, workspaceId }, select: projectSelect });
}

export function renameProject(id: number, name: string, workspaceId: number) {
    return prisma.project.update({
        where: { id, workspaceId },
        data: { name },
        select: projectSelect,
    });
}

export function deleteProject(id: number, workspaceId: number) {
    // The foreign key atomically prevents deleting a project that still has issues.
    return prisma.project.delete({ where: { id, workspaceId } });
}
