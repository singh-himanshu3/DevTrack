import { Router } from "express";
import { createCommentController, deleteCommentController, editCommentController, getCommentsController } from "../controllers/comments.controller.js";

const router = Router({ mergeParams: true });
router.get("/", getCommentsController);
router.post("/", createCommentController);
router.patch("/:commentId", editCommentController);
router.delete("/:commentId", deleteCommentController);
export default router;
