import type { Request, Response } from "express";
import { getUsers } from "../services/users.service.js";

export async function getUsersController(_req: Request, res: Response) {
    const users = await getUsers();
    res.status(200).json(users);
}
