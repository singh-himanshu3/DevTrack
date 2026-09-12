import type { Request, Response, NextFunction } from "express";
import { parsePositiveInteger } from "../lib/validation.js";
import { getIssueById } from "../services/issues.service.js";

// New collaboration endpoints always require an explicit project as well as workspace.
export async function requireIssueScope(req: Request, res: Response, next: NextFunction) {
    const id = parsePositiveInteger(req.params.id);
    const projectId = parsePositiveInteger(req.query.projectId);
    if (id === null || projectId === null || req.workspaceId === undefined) {
        res.status(400).json({ message: "Valid issue, workspace and project IDs are required" });
        return;
    }
    if (!await getIssueById(id, req.workspaceId, projectId)) {
        res.status(404).json({ message: "Issue not found in this project" });
        return;
    }
    req.issueScope = { id, workspaceId: req.workspaceId, projectId };
    next();
}
