import type { Issue } from "../types/issues";

export async function getIssues() : Promise<Issue[]> {
    const response = await fetch("http://localhost:3000/api/issues");
    if(!response.ok) {
        throw new Error("Failed to fetch issues");
    }
    const data = await response.json() ;
    return data as Issue[] ;
}

export async function createIssue(title : string) : Promise<Issue> {
    const response = await fetch("http://localhost:3000/api/issues", {
        method : "POST",
        headers : {
            "Content-Type" : "application/json"
        },
        body : JSON.stringify({title})
    })
    if(!response.ok){
        throw new Error("Failed to create issue") ;
    }
    const data = await response.json() ;
    return data as Issue ;
}