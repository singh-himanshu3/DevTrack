import type { UserSummary } from "./users";

export type WorkspaceRole = "OWNER" | "MEMBER";

export interface WorkspaceSummary {
  id: number;
  name: string;
  role: WorkspaceRole;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMemberSummary {
  userId: number;
  role: WorkspaceRole;
  joinedAt: string;
  user: UserSummary;
}
