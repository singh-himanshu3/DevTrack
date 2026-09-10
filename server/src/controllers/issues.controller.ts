import type { Request, Response } from "express";
import {
    createIssue,
    deleteIssue,
    getIssueById,
    getIssues,
    getMyIssues,
    updateIssueAssignee,
    updateIssueTitle,
} from "../services/issues.service.js";

export async function createIssueController(req: Request, res: Response){
    const {title} = req.body;
    if(typeof title !== "string" || title.trim() === ""){
        res.status(400).json({ message: "Title is required" });
        return;
    }

    const issue = await createIssue(title.trim()) ;
    res.status(201).json(issue);
}

export async function getIssuesController(_req: Request, res: Response){
    const issues = await getIssues();
    res.status(200).json(issues);
}

export async function getMyIssuesController(req: Request, res: Response) {
    if (req.userId === undefined) {
        res.status(401).json({ message: "Authentication required" });
        return;
    }

    const issues = await getMyIssues(req.userId);
    res.status(200).json(issues);
}

export async function getIssueByIdController(req: Request, res: Response){
    const id = Number(req.params.id) ;

    if(!Number.isInteger(id) || id <= 0){
        res.status(400).json({ message : "Issue ID must be a positive integer"})
        return;
    }

    const issue = await getIssueById(id) ;
    if(issue === null){
        res.status(404).json({ message : "Issue not found"});
        return ;
    }
    res.status(200).json(issue) ;
}

export async function updateIssueTitleController(req: Request, res: Response){
    const id = Number(req.params.id) ;
    if(!Number.isInteger(id) || id <= 0){
        res.status(400).json({ message : "Issue ID must be a positive integer"})
        return;
    }

    const {title} = req.body; 
    if(typeof title !== "string" || title.trim() === ""){
        res.status(400).json({ message: "Title is required" });
        return;
    }

    const updatedIssue = await updateIssueTitle(id, title.trim()) ;
    if(updatedIssue === null){
        res.status(404).json({ message : "Issue not found"});
        return ;
    }
    res.status(200).json(updatedIssue) ;
}

export async function updateIssueAssigneeController(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ message: "Issue ID must be a positive integer" });
        return;
    }

    const { assigneeId } = req.body;
    const isValidAssignee = assigneeId === null ||
        (typeof assigneeId === "number" && Number.isInteger(assigneeId) && assigneeId > 0);

    if (!isValidAssignee) {
        res.status(400).json({ message: "Assignee ID must be a positive integer or null" });
        return;
    }

    const result = await updateIssueAssignee(id, assigneeId);

    if (result.kind === "issue_not_found") {
        res.status(404).json({ message: "Issue not found" });
        return;
    }

    if (result.kind === "user_not_found") {
        res.status(404).json({ message: "Assignee not found" });
        return;
    }

    res.status(200).json(result.issue);
}

export async function deleteIssueController(req: Request, res: Response){
    const id = Number(req.params.id) ;

    if(!Number.isInteger(id) || id <= 0){
        res.status(400).json({ message : "Issue ID must be a positive integer"})
        return;
    }

    const issue = await deleteIssue(id) ;
    if(issue === null){
        res.status(404).json({ message : "Issue not found"});
        return ;
    }
    res.status(204).send();
}
