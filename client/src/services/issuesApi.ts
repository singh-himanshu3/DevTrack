import type { Issue } from "../types/issues";

const ISSUES_API_URL = "http://localhost:3000/api/issues";
export async function getIssues() : Promise<Issue[]> {
    const response = await fetch(ISSUES_API_URL,{
        credentials: "include"
    });
    if(!response.ok) {
        throw new Error("Failed to fetch issues");
    }
    const data = await response.json() ;
    return data as Issue[] ;
}

export async function getMyIssues(): Promise<Issue[]> {
    const response = await fetch(`${ISSUES_API_URL}/mine`, {
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error("Failed to fetch your issues");
    }

    const data = await response.json();
    return data as Issue[];
}

export async function createIssue(title : string) : Promise<Issue> {
    const response = await fetch(ISSUES_API_URL, {
        method : "POST",
        headers : {
            "Content-Type" : "application/json"
        },
        credentials: "include",
        body : JSON.stringify({title})
    })
    if(!response.ok){
        throw new Error("Failed to create issue") ;
    }
    const data = await response.json() ;
    return data as Issue ;
}

export async function updateIssueTitle(id : number, title : string): Promise<Issue>{
        const response = await fetch(`${ISSUES_API_URL}/${id}`, {
            method : "PATCH",
            headers : {
                "Content-Type" : "application/json"
            },
            credentials: "include",
            body : JSON.stringify({title})
        })
        if(!response.ok){
            throw new Error("Failed to update issue") ;
        }
        const data = await response.json() ;
        return data as Issue ;
}

export async function deleteIssue(id : number): Promise<void>{
        const response = await fetch(`${ISSUES_API_URL}/${id}`, {
            method : "DELETE",
            credentials: "include"
        })
        if(!response.ok){ 
            throw new Error("Failed to delete issue") ;
        }
        
}

export async function updateIssueAssignee(
    id: number,
    assigneeId: number | null,
): Promise<Issue> {
    const response = await fetch(`${ISSUES_API_URL}/${id}/assignee`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ assigneeId }),
    });

    if (!response.ok) {
        throw new Error("Failed to update assignee");
    }

    const data = await response.json();
    return data as Issue;
}
