import type { Request, Response } from "express";
import { registerUser, loginUser, getUserById} from "../services/auth.service.js";

export async function registerController(req: Request, res: Response) {
    const {name, email, password} = req.body ;
    if(typeof name !== 'string' || name.trim() === ""){
        return res.status(400).json({ message: "Name is required" })
    }
    if(typeof email !== 'string' || email.trim() === ""){
        return res.status(400).json({ message: "Email is required" })
    }
    if(typeof password !== 'string' || password.length < 8 || password.trim().length === 0) {
        return res.status(400).json({ message: "Password must contain at least 8 characters" }) ;
    }

    const user = await registerUser(name, email, password) ;

    if(user === null){
        return res.status(409).json({ message: "Email is already registered" }) ;
    }

    return res.status(201).json(user) ;
}

export async function loginController(req: Request, res: Response){
    const {email, password} = req.body ;
    if(typeof email !== 'string' || email.trim() === ""){
        return res.status(400).json({ message: "Email is required" })
    }
    if(typeof password !== 'string' || password === ""){
        return res.status(400).json({ message: "Password is required" }) ;
    }

    const result = await loginUser(email, password) ;

    if(result === null){
        return res.status(401).json({
            message: "Invalid email or password",
        }) ;
    }

    res.cookie("devtrack_token", result.token, {
        httpOnly: true,
        secure : process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60*60*1000,
    }) ;

    return res.status(200).json(result.user) ;
}

export async function getCurrentUserController(req: Request, res: Response){
    const id = req.userId ;
    if(id === undefined){
        return res.status(401).json({
            message:"Authentication Required"
        })
    }

    const user = await getUserById(id) ;
    if(user === null){
        return res.status(401).json({
            message:"Authentication Required"
        })
    }

    return res.status(200).json(user) ; 
}

export function logoutController(_req: Request, res: Response){
    res.clearCookie("devtrack_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    }) ;

    return res.status(204).send() ; 
}