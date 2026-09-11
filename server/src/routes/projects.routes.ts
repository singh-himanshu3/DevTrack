import { Router } from "express";
import {
    createProjectController,
    deleteProjectController,
    getProjectsController,
    renameProjectController,
} from "../controllers/projects.controller.js";
import { requireWorkspaceOwner } from "../middleware/workspace.middleware.js";

const router = Router();
router.get("/", getProjectsController);
router.post("/", requireWorkspaceOwner, createProjectController);
router.patch("/:id", requireWorkspaceOwner, renameProjectController);
router.delete("/:id", requireWorkspaceOwner, deleteProjectController);
export default router;
