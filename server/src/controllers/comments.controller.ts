import type { Request, Response } from "express";
import { parsePositiveInteger } from "../lib/validation.js";
import { createComment, deleteComment, editComment, getComments } from "../services/comments.service.js";
import { getActivity } from "../services/activity.service.js";

function contentFrom(req: Request, res: Response) {
    const content = req.body?.content;
    if (typeof content !== "string" || !content.trim() || content.trim().length > 5000) {
        res.status(400).json({ message: "Comment must contain 1 to 5000 characters" });
        return null;
    }
    return content.trim();
}

export async function getCommentsController(req: Request, res: Response) {
    res.json(await getComments(req.issueScope!));
}

export async function getActivityController(req: Request, res: Response) {
    res.json(await getActivity(req.issueScope!));
}

export async function createCommentController(req: Request, res: Response) {
    const content = contentFrom(req, res);
    if (content === null) return;
    const comment = await createComment(req.issueScope!, req.userId!, content);
    if (comment === null) { res.status(404).json({ message: "Issue not found in this project" }); return; }
    res.status(201).json(comment);
}

export async function editCommentController(req: Request, res: Response) {
    const id = parsePositiveInteger(req.params.commentId);
    if (id === null) { res.status(400).json({ message: "A valid comment ID is required" }); return; }
    const content = contentFrom(req, res);
    if (content === null) return;
    const comment = await editComment(req.issueScope!, id, req.userId!, content);
    if (comment === null) { res.status(404).json({ message: "Issue not found in this project" }); return; }
    res.json(comment);
}

export async function deleteCommentController(req: Request, res: Response) {
    const id = parsePositiveInteger(req.params.commentId);
    if (id === null) { res.status(400).json({ message: "A valid comment ID is required" }); return; }
    const comment = await deleteComment(req.issueScope!, id, req.userId!);
    if (comment === null) { res.status(404).json({ message: "Issue not found in this project" }); return; }
    res.status(204).send();
}
