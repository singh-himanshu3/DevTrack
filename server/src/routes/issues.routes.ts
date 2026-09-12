import {Router} from "express";
import commentsRouter from "./comments.routes.js";
import { requireIssueScope } from "../middleware/issue.middleware.js";
import { getActivityController } from "../controllers/comments.controller.js";
import {
    updateIssueProjectController,
    createIssueController,
    deleteIssueController,
    getIssueByIdController,
    getIssuesController,
    getMyIssuesController,
    updateIssueAssigneeController,
    updateIssueTitleController,
    updateIssueWorkflowController,
} from "../controllers/issues.controller.js";

const issuesRouter = Router();

issuesRouter.get("/", getIssuesController);
issuesRouter.get("/mine", getMyIssuesController);
issuesRouter.use("/:id/comments", requireIssueScope, commentsRouter);
issuesRouter.get("/:id/activity", requireIssueScope, getActivityController);
issuesRouter.patch("/:id/workflow", requireIssueScope, updateIssueWorkflowController);
issuesRouter.get("/:id", getIssueByIdController);
issuesRouter.post("/", createIssueController);
issuesRouter.patch("/:id/project", updateIssueProjectController);
issuesRouter.patch("/:id/assignee", updateIssueAssigneeController);
issuesRouter.patch("/:id", updateIssueTitleController);
issuesRouter.delete("/:id", deleteIssueController);

export default issuesRouter;
