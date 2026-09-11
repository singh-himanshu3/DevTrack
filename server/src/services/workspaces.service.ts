import { prisma } from "../lib/prisma.js";

const workspaceSelect = {
    id: true,
    name: true,
    createdAt: true,
    updatedAt: true,
    _count: {
        select: { memberships: true },
    },
} as const;

const memberSelect = {
    userId: true,
    role: true,
    joinedAt: true,
    user: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
} as const;

export async function getWorkspaceMembership(workspaceId: number, userId: number) {
    return prisma.workspaceMember.findUnique({
        where: {
            workspaceId_userId: { workspaceId, userId },
        },
        select: {
            workspaceId: true,
            userId: true,
            role: true,
        },
    });
}

export async function getWorkspaces(userId: number) {
    const memberships = await prisma.workspaceMember.findMany({
        where: { userId },
        orderBy: { joinedAt: "asc" },
        select: {
            role: true,
            workspace: { select: workspaceSelect },
        },
    });

    return memberships.map(({ role, workspace }) => ({
        id: workspace.id,
        name: workspace.name,
        role,
        memberCount: workspace._count.memberships,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
    }));
}

export async function createWorkspace(userId: number, name: string) {
    const workspace = await prisma.workspace.create({
        data: {
            name,
            memberships: {
                create: {
                    userId,
                    role: "OWNER",
                },
            },
        },
        select: workspaceSelect,
    });

    return {
        id: workspace.id,
        name: workspace.name,
        role: "OWNER" as const,
        memberCount: workspace._count.memberships,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
    };
}

export async function getWorkspaceMembers(workspaceId: number, userId: number) {
    const membership = await getWorkspaceMembership(workspaceId, userId);
    if (membership === null) {
        return null;
    }

    return prisma.workspaceMember.findMany({
        where: { workspaceId },
        orderBy: { user: { name: "asc" } },
        select: memberSelect,
    });
}

export async function addWorkspaceMember(
    workspaceId: number,
    requestingUserId: number,
    email: string,
) {
    const requestingMembership = await getWorkspaceMembership(
        workspaceId,
        requestingUserId,
    );

    if (requestingMembership === null) {
        return { kind: "forbidden" } as const;
    }

    if (requestingMembership.role !== "OWNER") {
        return { kind: "owner_required" } as const;
    }

    const user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
        select: { id: true },
    });

    if (user === null) {
        return { kind: "user_not_found" } as const;
    }

    const existingMembership = await getWorkspaceMembership(workspaceId, user.id);
    if (existingMembership !== null) {
        return { kind: "already_member" } as const;
    }

    const member = await prisma.workspaceMember.create({
        data: {
            workspaceId,
            userId: user.id,
        },
        select: memberSelect,
    });

    return { kind: "added", member } as const;
}

export async function deleteWorkspace(workspaceId: number, requestingUserId: number) {
    const membership = await getWorkspaceMembership(workspaceId, requestingUserId);

    if (membership === null) {
        return { kind: "forbidden" } as const;
    }

    if (membership.role !== "OWNER") {
        return { kind: "owner_required" } as const;
    }

    await prisma.workspace.delete({ where: { id: workspaceId } });
    return { kind: "deleted" } as const;
}
