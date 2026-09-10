import { Router } from "express";
import { getUsersController } from "../controllers/users.controller.js";

const usersRouter = Router();

usersRouter.get("/", getUsersController);

export default usersRouter;
