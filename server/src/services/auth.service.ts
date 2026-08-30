import { prisma } from "../lib/prisma.js";
import bcrypt from 'bcrypt'; 

export async function registerUser(name : string, email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({where : { email : normalizedEmail}}) ;

    if(existingUser !== null){
        return null ; 
    }
    

    const passwordHash = await bcrypt.hash(password, 12) ;
    const user = await prisma.user.create({
        data: {
            name : name.trim() ,
            email : normalizedEmail,
            passwordHash,
        },
        select:{
            id: true,
            name: true,
            email: true,
            createdAt: true,
            updatedAt: true,
        }
    });
    return user;
}