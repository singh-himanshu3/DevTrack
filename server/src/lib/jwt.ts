import "dotenv/config" ;
import jwt from "jsonwebtoken" ;

export interface AuthTokenPayload {
  userId: number;
}

function getJwtSecret(): string{
    const secret = process.env.JWT_SECRET ;
    if(!secret){
        throw new Error("JWT_SECRET is not configured") ;
    }

    return secret ;
}

const jwtSecret = getJwtSecret() ;

export function createAuthToken(userId: number){
    return jwt.sign({userId}, jwtSecret, {expiresIn: "1h", algorithm:"HS256"}) ;
}

export function verifyAuthToken(token: string): AuthTokenPayload {
    const decoded = jwt.verify(token, jwtSecret, {
        algorithms: ["HS256"],
    }) ;
    if (typeof decoded === "string" || typeof decoded.userId !== "number"){
        throw new Error("Invalid authentication token");
    }

    return {userId: decoded.userId} ;
}
