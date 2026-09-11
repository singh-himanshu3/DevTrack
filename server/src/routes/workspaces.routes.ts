import { Router } from "express";
import {
    addWorkspaceMemberController,
    createWorkspaceController,
    deleteWorkspaceController,
    getWorkspaceMembersController,
    getWorkspacesController,
} from "../controllers/workspaces.controller.js";

const workspacesRouter = Router();

workspacesRouter.get("/", getWorkspacesController);
workspacesRouter.post("/", createWorkspaceController);
workspacesRouter.delete("/:workspaceId", deleteWorkspaceController);
workspacesRouter.get("/:workspaceId/members", getWorkspaceMembersController);
workspacesRouter.post("/:workspaceId/members", addWorkspaceMemberController);

export default workspacesRouter;
