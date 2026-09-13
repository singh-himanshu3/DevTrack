import type { Issue } from "../types/issues";

const ISSUES_API_URL = "http://localhost:3000/api/issues";
function getWorkspaceIssueUrl(workspaceId: number, path = "") {
    return `${ISSUES_API_URL}${path}?workspaceId=${workspaceId}`;
}

export interface IssuePage { items: Issue[]; page: number; limit: number; total: number; totalPages: number }
export async function getIssues(workspaceId: number, query = '', mine = false): Promise<IssuePage> {
    const params = new URLSearchParams(query);
    params.set('workspaceId', String(workspaceId));
    const response = await fetch(ISSUES_API_URL + (mine ? '/mine' : '') + '?' + params, { credentials: 'include' });
    if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(body.message ?? 'Unable to fetch issues');
    }
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object' || !('items' in data) || !Array.isArray(data.items)
        || !('total' in data) || !Number.isInteger(data.total)
        || !('page' in data) || !Number.isInteger(data.page)
        || !('limit' in data) || !Number.isInteger(data.limit)
        || !('totalPages' in data) || !Number.isInteger(data.totalPages)) {
        throw new Error('Unable to load the issue list. The server returned an unexpected response.');
    }
    return data as IssuePage;
}

export async function createIssue(title : string, workspaceId: number, projectId: number) : Promise<Issue> {
    const response = await fetch(getWorkspaceIssueUrl(workspaceId), {
        method : "POST",
        headers : {
            "Content-Type" : "application/json"
        },
        credentials: "include",
        body : JSON.stringify({title, projectId})
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

export async function updateIssueProject(id: number, projectId: number, workspaceId: number): Promise<Issue> {
    const response = await fetch(getWorkspaceIssueUrl(workspaceId, `/${id}/project`), {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
    });
    if (!response.ok) throw new Error("Failed to move issue");
    return response.json() as Promise<Issue>;
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
