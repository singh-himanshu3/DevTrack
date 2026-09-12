import type { UserSummary } from "./users";

export const statusLabels = { BACKLOG: "Backlog", TODO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done" } as const;
export const priorityLabels = { NONE: "No priority", LOW: "Low", MEDIUM: "Medium", HIGH: "High", URGENT: "Urgent" } as const;
export type IssueStatus = keyof typeof statusLabels;
export type IssuePriority = keyof typeof priorityLabels;

export interface Issue {
    id : number;
    title : string;
    status: IssueStatus;
    priority: IssuePriority;
  createdAt : string;
  workspaceId: number;
  projectId: number;
  project: { id: number; name: string };
    assigneeId: number | null;
    assignee: UserSummary | null;
}
