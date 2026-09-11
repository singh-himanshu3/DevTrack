import {Router} from "express";
import {
    updateIssueProjectController,
    createIssueController,
    deleteIssueController,
    getIssueByIdController,
    getIssuesController,
    getMyIssuesController,
    updateIssueAssigneeController,
    updateIssueTitleController,
} from "../controllers/issues.controller.js";

const issuesRouter = Router();

issuesRouter.get("/", getIssuesController);
issuesRouter.get("/mine", getMyIssuesController);
issuesRouter.get("/:id", getIssueByIdController);
issuesRouter.post("/", createIssueController);
issuesRouter.patch("/:id/project", updateIssueProjectController);
issuesRouter.patch("/:id/assignee", updateIssueAssigneeController);
issuesRouter.patch("/:id", updateIssueTitleController);
issuesRouter.delete("/:id", deleteIssueController);

export default issuesRouter;
