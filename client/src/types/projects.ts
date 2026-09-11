export interface Project {
  id: number;
  name: string;
  workspaceId: number;
  createdAt: string;
  updatedAt: string;
  _count: { issues: number };
}
