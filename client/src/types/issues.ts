import type { UserSummary } from "./users";

export interface Issue {
    id : number;
    title : string;
  createdAt : string;
  workspaceId: number;
    assigneeId: number | null;
    assignee: UserSummary | null;
}
