import type { Project } from "../types/projects";

async function request(workspaceId: number, path = "", method = "GET", name?: string) {
  const response = await fetch(
    `http://localhost:3000/api/projects${path}?workspaceId=${workspaceId}`,
    { method, credentials: "include", headers: { "Content-Type": "application/json" },
      ...(name === undefined ? {} : { body: JSON.stringify({ name }) }) },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(body.message ?? "Project request failed");
  }
  return response.status === 204 ? undefined : response.json();
}
export const getProjects = (workspaceId: number): Promise<Project[]> => request(workspaceId);
export const createProject = (workspaceId: number, name: string): Promise<Project> => request(workspaceId, "", "POST", name);
export const renameProject = (workspaceId: number, id: number, name: string): Promise<Project> => request(workspaceId, `/${id}`, "PATCH", name);
export const deleteProject = (workspaceId: number, id: number): Promise<void> => request(workspaceId, `/${id}`, "DELETE");
