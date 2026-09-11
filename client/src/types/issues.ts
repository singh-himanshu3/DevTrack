import type { UserSummary } from "./users";

export interface Issue {
    id : number;
    title : string;
  createdAt : string;
  workspaceId: number;
  projectId: number;
  project: { id: number; name: string };
    assigneeId: number | null;
    assignee: UserSummary | null;
}
