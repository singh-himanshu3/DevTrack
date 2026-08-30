import type { Request, Response } from "express";
import { registerUser } from "../services/auth.service.js";

export async function registerController(req: Request, res: Response) {
    const {name, email, password} = req.body ;
    if(typeof name !== 'string' || name.trim() === ""){
        return res.status(400).json({ message: "Name is required" })
    }
    if(typeof email !== 'string' || email.trim() === ""){
        return res.status(400).json({ message: "Email is required" })
    }
    if(typeof password !== 'string' || password.length < 8){
        return res.status(400).json({ message: "Password must contain at least 8 characters" }) ;
    }

    const user = await registerUser(name, email, password) ;

    if(user === null){
        return res.status(409).json({ message: "Email is already registered" }) ;
    }

    return res.status(201).json(user) ;
}