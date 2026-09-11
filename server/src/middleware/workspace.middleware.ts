import type { NextFunction, Request, Response } from "express";
import { parsePositiveInteger } from "../lib/validation.js";
import { getWorkspaceMembership } from "../services/workspaces.service.js";

// Runs after requireAuth and requireWorkspaceMember.
export async function requireWorkspaceOwner(req: Request, res: Response, next: NextFunction) {
    const member = await getWorkspaceMembership(req.workspaceId!, req.userId!);
    if (member?.role !== "OWNER") {
        res.status(403).json({ message: "Only workspace owners can manage projects" });
        return;
    }
    next();
}

export async function requireWorkspaceMember(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    if (req.userId === undefined) {
        res.status(401).json({ message: "Authentication required" });
        return;
    }

    const workspaceId = parsePositiveInteger(req.query.workspaceId);
    if (workspaceId === null) {
        res.status(400).json({ message: "A valid workspaceId query parameter is required" });
        return;
    }

    const membership = await getWorkspaceMembership(workspaceId, req.userId);
    if (membership === null) {
        res.status(403).json({ message: "You do not have access to this workspace" });
        return;
    }

    req.workspaceId = workspaceId;
    next();
}
