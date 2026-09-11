import type { Issue } from "../types/issues";

const ISSUES_API_URL = "http://localhost:3000/api/issues";
function getWorkspaceIssueUrl(workspaceId: number, path = "") {
    return `${ISSUES_API_URL}${path}?workspaceId=${workspaceId}`;
}

export async function getIssues(workspaceId: number) : Promise<Issue[]> {
    const response = await fetch(getWorkspaceIssueUrl(workspaceId),{
        credentials: "include"
    });
    if(!response.ok) {
        throw new Error("Failed to fetch issues");
    }
    const data = await response.json() ;
    return data as Issue[] ;
}

export async function getMyIssues(workspaceId: number): Promise<Issue[]> {
    const response = await fetch(getWorkspaceIssueUrl(workspaceId, "/mine"), {
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error("Failed to fetch your issues");
    }

    const data = await response.json();
    return data as Issue[];
}

export async function createIssue(title : string, workspaceId: number) : Promise<Issue> {
    const response = await fetch(getWorkspaceIssueUrl(workspaceId), {
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

export async function updateIssueTitle(
    id: number,
    title: string,
    workspaceId: number,
): Promise<Issue>{
        const response = await fetch(getWorkspaceIssueUrl(workspaceId, `/${id}`), {
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

export async function deleteIssue(id : number, workspaceId: number): Promise<void>{
        const response = await fetch(getWorkspaceIssueUrl(workspaceId, `/${id}`), {
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
    workspaceId: number,
): Promise<Issue> {
    const response = await fetch(
        getWorkspaceIssueUrl(workspaceId, `/${id}/assignee`),
        {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ assigneeId }),
        },
    );

    if (!response.ok) {
        throw new Error("Failed to update assignee");
    }

    const data = await response.json();
    return data as Issue;
}
