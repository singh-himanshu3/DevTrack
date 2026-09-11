import type { Request, Response } from "express";
import { parsePositiveInteger } from "../lib/validation.js";
import {
    addWorkspaceMember,
    createWorkspace,
    deleteWorkspace,
    getWorkspaceMembers,
    getWorkspaces,
} from "../services/workspaces.service.js";

function requireUserId(req: Request, res: Response): number | null {
    if (req.userId === undefined) {
        res.status(401).json({ message: "Authentication required" });
        return null;
    }

    return req.userId;
}

export async function getWorkspacesController(req: Request, res: Response) {
    const userId = requireUserId(req, res);
    if (userId === null) return;

    res.status(200).json(await getWorkspaces(userId));
}

export async function createWorkspaceController(req: Request, res: Response) {
    const userId = requireUserId(req, res);
    if (userId === null) return;

    const { name } = req.body;
    if (typeof name !== "string" || name.trim().length === 0 || name.trim().length > 80) {
        res.status(400).json({ message: "Workspace name must contain 1 to 80 characters" });
        return;
    }

    const workspace = await createWorkspace(userId, name.trim());
    res.status(201).json(workspace);
}

export async function getWorkspaceMembersController(req: Request, res: Response) {
    const userId = requireUserId(req, res);
    if (userId === null) return;

    const workspaceId = parsePositiveInteger(req.params.workspaceId);
    if (workspaceId === null) {
        res.status(400).json({ message: "Workspace ID must be a positive integer" });
        return;
    }

    const members = await getWorkspaceMembers(workspaceId, userId);
    if (members === null) {
        res.status(403).json({ message: "You do not have access to this workspace" });
        return;
    }

    res.status(200).json(members);
}

export async function addWorkspaceMemberController(req: Request, res: Response) {
    const userId = requireUserId(req, res);
    if (userId === null) return;

    const workspaceId = parsePositiveInteger(req.params.workspaceId);
    if (workspaceId === null) {
        res.status(400).json({ message: "Workspace ID must be a positive integer" });
        return;
    }

    const { email } = req.body;
    if (typeof email !== "string" || email.trim().length === 0) {
        res.status(400).json({ message: "A member email is required" });
        return;
    }

    const result = await addWorkspaceMember(workspaceId, userId, email);

    if (result.kind === "forbidden") {
        res.status(403).json({ message: "You do not have access to this workspace" });
        return;
    }

    if (result.kind === "owner_required") {
        res.status(403).json({ message: "Only workspace owners can add members" });
        return;
    }

    if (result.kind === "user_not_found") {
        res.status(404).json({ message: "No registered user has that email" });
        return;
    }

    if (result.kind === "already_member") {
        res.status(409).json({ message: "That user is already a workspace member" });
        return;
    }

    res.status(201).json(result.member);
}

export async function deleteWorkspaceController(req: Request, res: Response) {
    const userId = requireUserId(req, res);
    if (userId === null) return;

    const workspaceId = parsePositiveInteger(req.params.workspaceId);
    if (workspaceId === null) {
        res.status(400).json({ message: "Workspace ID must be a positive integer" });
        return;
    }

    const result = await deleteWorkspace(workspaceId, userId);

    if (result.kind === "forbidden") {
        res.status(403).json({ message: "You do not have access to this workspace" });
        return;
    }

    if (result.kind === "owner_required") {
        res.status(403).json({ message: "Only workspace owners can delete a workspace" });
        return;
    }

    res.status(204).send();
}
