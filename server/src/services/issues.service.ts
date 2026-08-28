import { prisma } from "../lib/prisma.js";

export async function createIssue(title: string) {
    return prisma.issue.create({
        data: {
            title
        },
    });
}

export async function getIssues() {
    return prisma.issue.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });
}

export async function getIssueById(id: number){
    return prisma.issue.findUnique({
        where: {
            id,
        },
    });
}

export async function updateIssueTitle(id: number, title: string){
    const existingIssue = await getIssueById(id);
    if(existingIssue === null){
        return null ;
    }
    
    return prisma.issue.update({
        where:{
            id,
        },
        data:{
            title,
        },
    }) ;
}

export async function deleteIssue(id: number){
    const existingIssue = await getIssueById(id);
    if(existingIssue === null){
        return null ;
    }
    return prisma.issue.delete({
        where: {
            id,
        },
    });
}