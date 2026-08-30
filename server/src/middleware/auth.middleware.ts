import type { NextFunction, Request, Response } from "express";
import {verifyAuthToken} from "../lib/jwt.js";

export function requireAuth(req: Request, res: Response, next:NextFunction){
    const token = req.cookies.devtrack_token ;

    if(typeof token !== "string"){
        res.status(401).json({
            message : "Authentication Required"
        })
        return ;
    }

    try {
        const payload = verifyAuthToken(token) ;
        req.userId = payload.userId ;
        next() ; 
    } catch {
        return res.status(401).json({
            message: "Authentication Required"
        })
    }
}