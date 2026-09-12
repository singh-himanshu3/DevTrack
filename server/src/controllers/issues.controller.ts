import { getProjectById } from "../services/projects.service.js";
import { parsePositiveInteger } from "../lib/validation.js";
import type { Request, Response } from "express";
import { IssuePriority, IssueStatus } from "../generated/prisma/client.js";
import type { IssueScope } from "../services/issue-scope.service.js";
import {
    updateIssueProject,
    createIssue,
    deleteIssue,
    getIssueById,
    getIssues,
    getMyIssues,
    updateIssueAssignee,
    updateIssueTitle,
    updateIssueWorkflow,
} from "../services/issues.service.js";

function scopeFrom(req: Request, res: Response): IssueScope | null {
    const id = parsePositiveInteger(req.params.id);
    const projectId = req.query.projectId === undefined ? undefined : parsePositiveInteger(req.query.projectId);
    if (id === null || projectId === null || req.workspaceId === undefined) {
        res.status(400).json({ message: "Valid issue, workspace and project IDs are required" });
        return null;
    }
    return { id, workspaceId: req.workspaceId, ...(projectId === undefined ? {} : { projectId }) };
}

function requireWorkspaceId(req: Request, res: Response): number | null {
    if (req.workspaceId === undefined) {
        res.status(400).json({ message: "A workspace is required" });
        return null;
    }

    return req.workspaceId;
}

export async function createIssueController(req: Request, res: Response){
    const workspaceId = requireWorkspaceId(req, res);
    if (workspaceId === null) return;

    const {title} = req.body ?? {};
    if(typeof title !== "string" || title.trim() === ""){
        res.status(400).json({ message: "Title is required" });
        return;
    }

    const projectId = parsePositiveInteger(req.body?.projectId);
    if (projectId === null) { res.status(400).json({ message: "A valid projectId is required" }); return; }
    if (!await getProjectById(projectId, workspaceId)) {
        res.status(404).json({ message: "Project not found" }); return;
    }
    const issue = await createIssue(title.trim(), workspaceId, projectId, req.userId!);
    res.status(201).json(issue);
}

export async function getIssuesController(req: Request, res: Response){
    const workspaceId = requireWorkspaceId(req, res);
    if (workspaceId === null) return;

    const projectId = req.query.projectId === undefined ? undefined : parsePositiveInteger(req.query.projectId);
    if (projectId === null) { res.status(400).json({ message: "A valid projectId is required" }); return; }
    if (projectId !== undefined && !await getProjectById(projectId, workspaceId)) {
        res.status(404).json({ message: "Project not found" }); return;
    }
    const issues = await getIssues(workspaceId, projectId);
    res.status(200).json(issues);
}

export async function getMyIssuesController(req: Request, res: Response) {
    if (req.userId === undefined) {
        res.status(401).json({ message: "Authentication required" });
        return;
    }

    const workspaceId = requireWorkspaceId(req, res);
    if (workspaceId === null) return;

    const issues = await getMyIssues(req.userId, workspaceId);
    res.status(200).json(issues);
}

export async function getIssueByIdController(req: Request, res: Response){
    const workspaceId = requireWorkspaceId(req, res);
    if (workspaceId === null) return;

    const id = Number(req.params.id) ;

    if(!Number.isInteger(id) || id <= 0){
        res.status(400).json({ message : "Issue ID must be a positive integer"})
        return;
    }

    const scope = scopeFrom(req, res);
    if (scope === null) return;
    const issue = await getIssueById(id, workspaceId, scope.projectId);
    if(issue === null){
        res.status(404).json({ message : "Issue not found"});
        return ;
    }
    res.status(200).json(issue) ;
}

export async function updateIssueTitleController(req: Request, res: Response){
    const workspaceId = requireWorkspaceId(req, res);
    if (workspaceId === null) return;

    const id = Number(req.params.id) ;
    if(!Number.isInteger(id) || id <= 0){
        res.status(400).json({ message : "Issue ID must be a positive integer"})
        return;
    }

    const {title} = req.body ?? {};
    if(typeof title !== "string" || title.trim() === ""){
        res.status(400).json({ message: "Title is required" });
        return;
    }

    const scope = scopeFrom(req, res);
    if (scope === null) return;
    const updatedIssue = await updateIssueTitle(scope, title.trim(), req.userId!);
    if(updatedIssue === null){
        res.status(404).json({ message : "Issue not found"});
        return ;
    }
    res.status(200).json(updatedIssue) ;
}

export async function updateIssueAssigneeController(req: Request, res: Response) {
    const workspaceId = requireWorkspaceId(req, res);
    if (workspaceId === null) return;

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ message: "Issue ID must be a positive integer" });
        return;
    }

    const { assigneeId } = req.body ?? {};
    const isValidAssignee = assigneeId === null ||
        (typeof assigneeId === "number" && parsePositiveInteger(assigneeId) !== null);

    if (!isValidAssignee) {
        res.status(400).json({ message: "Assignee ID must be a positive integer or null" });
        return;
    }

    const scope = scopeFrom(req, res);
    if (scope === null) return;
    const result = await updateIssueAssignee(scope, assigneeId, req.userId!);

    if (result.kind === "issue_not_found") {
        res.status(404).json({ message: "Issue not found" });
        return;
    }

    if (result.kind === "assignee_not_member") {
        res.status(400).json({ message: "Assignee must be a workspace member" });
        return;
    }

    res.status(200).json(result.issue);
}

export async function deleteIssueController(req: Request, res: Response){
    const workspaceId = requireWorkspaceId(req, res);
    if (workspaceId === null) return;

    const id = Number(req.params.id) ;

    if(!Number.isInteger(id) || id <= 0){
        res.status(400).json({ message : "Issue ID must be a positive integer"})
        return;
    }

    const scope = scopeFrom(req, res);
    if (scope === null) return;
    const issue = await deleteIssue(scope);
    if(issue === null){
        res.status(404).json({ message : "Issue not found"});
        return ;
    }
    res.status(204).send();
}

export async function updateIssueProjectController(req: Request, res: Response) {
    const workspaceId = requireWorkspaceId(req, res);
    if (workspaceId === null) return;
    const id = parsePositiveInteger(req.params.id);
    const projectId = parsePositiveInteger(req.body?.projectId);
    if (id === null || projectId === null) { res.status(400).json({ message: "Valid issue and project IDs are required" }); return; }
    if (!await getProjectById(projectId, workspaceId)) {
        res.status(404).json({ message: "Project not found" }); return;
    }
    const scope = scopeFrom(req, res);
    if (scope === null) return;
    const issue = await updateIssueProject(scope, projectId, req.userId!);
    if (issue === null) { res.status(404).json({ message: "Issue not found" }); return; }
    res.json(issue);
}

export async function updateIssueWorkflowController(req: Request, res: Response) {
    const body: unknown = req.body;
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
        res.status(400).json({ message: "A status or priority is required" }); return;
    }
    const values = body as Record<string, unknown>;
    if (Object.keys(values).length === 0 || Object.keys(values).some(key => key !== "status" && key !== "priority")) {
        res.status(400).json({ message: "Only status and priority can be changed here" }); return;
    }
    const change: { status?: IssueStatus; priority?: IssuePriority } = {};
    if ("status" in values) {
        if (typeof values.status !== "string" || !Object.values(IssueStatus).includes(values.status as IssueStatus)) {
            res.status(400).json({ message: "Invalid issue status" }); return;
        }
        change.status = values.status as IssueStatus;
    }
    if ("priority" in values) {
        if (typeof values.priority !== "string" || !Object.values(IssuePriority).includes(values.priority as IssuePriority)) {
            res.status(400).json({ message: "Invalid issue priority" }); return;
        }
        change.priority = values.priority as IssuePriority;
    }
    const issue = await updateIssueWorkflow(req.issueScope!, req.userId!, change);
    if (issue === null) { res.status(404).json({ message: "Issue not found in this project" }); return; }
    res.json(issue);
}
