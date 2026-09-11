import { prisma } from "../lib/prisma.js";
import bcrypt from 'bcrypt'; 
import {createAuthToken} from "../lib/jwt.js" ;

export async function registerUser(name : string, email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({where : { email : normalizedEmail}}) ;

    if(existingUser !== null){
        return null ; 
    }
    
    const passwordHash = await bcrypt.hash(password, 12) ;
    const trimmedName = name.trim();
    const user = await prisma.$transaction(async (transaction) => {
        const createdUser = await transaction.user.create({
            data: {
                name: trimmedName,
                email: normalizedEmail,
                passwordHash,
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        await transaction.workspace.create({
            data: {
                name: `${trimmedName}'s Workspace`,
                memberships: {
                    create: {
                        userId: createdUser.id,
                        role: "OWNER",
                    },
                },
            },
        });

        return createdUser;
    });
    return user;
}

export async function loginUser(email : string, password: string){
    const normalizedEmail = email.trim().toLowerCase() ;
    const existingUser = await prisma.user.findUnique({where : { email : normalizedEmail}}) ;

    if(existingUser === null){
        return null ;
    }

    const passwordMatches = await bcrypt.compare(password, existingUser.passwordHash) ;

    if(passwordMatches === false){
        return null ;
    }

    const token = createAuthToken(existingUser.id) ;

    return {
        token,
        user:{
            id : existingUser.id,
            name:  existingUser.name,
            email:  existingUser.email,
            createdAt: existingUser.createdAt,
            updatedAt: existingUser.updatedAt,
        },
    }
}

export async function getUserById(id : number){
    return prisma.user.findUnique({
        where: {id},
        select:{
            id: true,
            name: true,
            email: true,
            createdAt: true,
            updatedAt: true
        },
    });
}
