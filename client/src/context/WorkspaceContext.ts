import { createContext, useContext } from "react";
import type { WorkspaceSummary } from "../types/workspaces";

interface WorkspaceContextValue {
  workspaces: WorkspaceSummary[];
  currentWorkspace: WorkspaceSummary | null;
  isWorkspaceLoading: boolean;
  workspaceError: string | null;
  selectWorkspace: (workspaceId: number) => void;
  refreshWorkspaces: (preferredWorkspaceId?: number) => Promise<void>;
}

export const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(
  undefined,
);

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }

  return context;
}
