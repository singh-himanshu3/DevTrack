import {Router} from "express";
import { getIssuesController, createIssueController,getIssueByIdController, updateIssueTitleController, deleteIssueController} from "../controllers/issues.controller.js";

const issuesRouter = Router();

issuesRouter.get("/", getIssuesController);
issuesRouter.get("/:id", getIssueByIdController);
issuesRouter.post("/", createIssueController);
issuesRouter.patch("/:id", updateIssueTitleController);
issuesRouter.delete("/:id", deleteIssueController);

export default issuesRouter;