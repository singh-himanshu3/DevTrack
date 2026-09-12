export interface IssueComment {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: { id: number; name: string };
}

export interface IssueActivity {
  id: number;
  type: "ISSUE_CREATED" | "TITLE_CHANGED" | "ASSIGNEE_CHANGED" | "STATUS_CHANGED" | "PRIORITY_CHANGED" | "PROJECT_CHANGED";
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  actor: { id: number; name: string } | null;
}

export interface IssueScope {
  workspaceId: number;
  projectId: number;
  issueId: number;
}
