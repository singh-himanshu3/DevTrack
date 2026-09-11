import type { Request, Response } from "express";
import { parsePositiveInteger } from "../lib/validation.js";
import { createProject, deleteProject, getProjects, renameProject } from "../services/projects.service.js";

function parseName(value: unknown): string | null {
    return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 80
        ? value.trim() : null;
}

export async function getProjectsController(req: Request, res: Response) {
    res.json(await getProjects(req.workspaceId!));
}

export async function createProjectController(req: Request, res: Response) {
    const name = parseName(req.body?.name);
    if (name === null) {
        res.status(400).json({ message: "Project name must contain 1 to 80 characters" });
        return;
    }
    res.status(201).json(await createProject(name, req.workspaceId!));
}

export async function renameProjectController(req: Request, res: Response) {
    const id = parsePositiveInteger(req.params.id);
    const name = parseName(req.body?.name);
    if (id === null || name === null) {
        res.status(400).json({ message: "A valid project ID and name (1 to 80 characters) are required" });
        return;
    }
    res.json(await renameProject(id, name, req.workspaceId!));
}

export async function deleteProjectController(req: Request, res: Response) {
    const id = parsePositiveInteger(req.params.id);
    if (id === null) {
        res.status(400).json({ message: "A valid project ID is required" });
        return;
    }
    await deleteProject(id, req.workspaceId!);
    res.sendStatus(204);
}
