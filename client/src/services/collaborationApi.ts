import type { Issue, IssuePriority, IssueStatus } from "../types/issues";
import type { IssueActivity, IssueComment, IssueScope } from "../types/collaboration";

async function request<T>(scope: IssueScope, path = "", method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(
    `http://localhost:3000/api/issues/${scope.issueId}${path}?workspaceId=${scope.workspaceId}&projectId=${scope.projectId}`,
    { method, credentials: "include", headers: { "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) },
  );
  if (!response.ok) {
    const result = await response.json().catch(() => ({})) as { message?: unknown };
    throw new Error(typeof result.message === "string" ? result.message : "Request failed. Please try again.");
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export const getIssue = (scope: IssueScope) => request<Issue>(scope);
export const getComments = (scope: IssueScope) => request<IssueComment[]>(scope, "/comments");
export const getActivity = (scope: IssueScope) => request<IssueActivity[]>(scope, "/activity");
export const createComment = (scope: IssueScope, content: string) => request<IssueComment>(scope, "/comments", "POST", { content });
export const editComment = (scope: IssueScope, id: number, content: string) => request<IssueComment>(scope, `/comments/${id}`, "PATCH", { content });
export const deleteComment = (scope: IssueScope, id: number) => request<void>(scope, `/comments/${id}`, "DELETE");
export const changeTitle = (scope: IssueScope, title: string) => request<Issue>(scope, "", "PATCH", { title });
export const changeAssignee = (scope: IssueScope, assigneeId: number | null) => request<Issue>(scope, "/assignee", "PATCH", { assigneeId });
export const changeWorkflow = (scope: IssueScope, change: { status?: IssueStatus; priority?: IssuePriority }) => request<Issue>(scope, "/workflow", "PATCH", change);
