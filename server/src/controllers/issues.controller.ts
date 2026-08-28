import type { Request, Response } from "express";
import { createIssue, getIssues } from "../services/issues.service.js";

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