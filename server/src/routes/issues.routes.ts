import {Router} from "express";
import { getIssuesController, createIssueController } from "../controllers/issues.controller.js";

const issuesRouter = Router();

issuesRouter.get("/", getIssuesController);
issuesRouter.post("/", createIssueController);

export default issuesRouter;