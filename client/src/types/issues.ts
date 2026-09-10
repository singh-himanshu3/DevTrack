import type { UserSummary } from "./users";

export interface Issue {
    id : number;
    title : string;
    createdAt : string;
    assigneeId: number | null;
    assignee: UserSummary | null;
}
