import type {
  WorkspaceMemberSummary,
  WorkspaceSummary,
} from "../types/workspaces";

const WORKSPACES_API_URL = "http://localhost:3000/api/workspaces";

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: unknown };
    return typeof body.message === "string" ? body.message : fallback;
  } catch {
    return fallback;
  }
}

export async function getWorkspaces(): Promise<WorkspaceSummary[]> {
  const response = await fetch(WORKSPACES_API_URL, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to fetch workspaces"));
  }

  return response.json() as Promise<WorkspaceSummary[]>;
}

export async function createWorkspace(name: string): Promise<WorkspaceSummary> {
  const response = await fetch(WORKSPACES_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to create workspace"));
  }

  return response.json() as Promise<WorkspaceSummary>;
}

export async function deleteWorkspace(workspaceId: number): Promise<void> {
  const response = await fetch(`${WORKSPACES_API_URL}/${workspaceId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to delete workspace"));
  }
}

export async function getWorkspaceMembers(
  workspaceId: number,
): Promise<WorkspaceMemberSummary[]> {
  const response = await fetch(`${WORKSPACES_API_URL}/${workspaceId}/members`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to fetch workspace members"));
  }

  return response.json() as Promise<WorkspaceMemberSummary[]>;
}

export async function addWorkspaceMember(
  workspaceId: number,
  email: string,
): Promise<WorkspaceMemberSummary> {
  const response = await fetch(`${WORKSPACES_API_URL}/${workspaceId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to add workspace member"));
  }

  return response.json() as Promise<WorkspaceMemberSummary>;
}
