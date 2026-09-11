import { useCallback, useEffect, useState, type ReactNode } from "react";
import { getWorkspaces } from "../services/workspacesApi";
import type { WorkspaceSummary } from "../types/workspaces";
import { useAuth } from "./AuthContext";
import { WorkspaceContext } from "./WorkspaceContext";

const WORKSPACE_STORAGE_KEY = "devtrack_workspace_id";

function readStoredWorkspaceId() {
  const value = Number(window.localStorage.getItem(WORKSPACE_STORAGE_KEY));
  return Number.isInteger(value) && value > 0 ? value : null;
}

function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, isAuthLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [currentWorkspace, setCurrentWorkspace] =
    useState<WorkspaceSummary | null>(null);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  const refreshWorkspaces = useCallback(
    async (preferredWorkspaceId?: number) => {
      if (user === null) {
        setWorkspaces([]);
        setCurrentWorkspace(null);
        setIsWorkspaceLoading(false);
        return;
      }

      setIsWorkspaceLoading(true);
      setWorkspaceError(null);

      try {
        const workspaceData = await getWorkspaces();
        setWorkspaces(workspaceData);
        setCurrentWorkspace((previousWorkspace) => {
          const desiredId =
            preferredWorkspaceId ??
            readStoredWorkspaceId() ??
            previousWorkspace?.id;
          const selectedWorkspace =
            workspaceData.find((workspace) => workspace.id === desiredId) ??
            workspaceData[0] ??
            null;

          if (selectedWorkspace !== null) {
            window.localStorage.setItem(
              WORKSPACE_STORAGE_KEY,
              String(selectedWorkspace.id),
            );
          } else {
            window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
          }

          return selectedWorkspace;
        });
      } catch (caughtError) {
        setWorkspaceError(
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to fetch workspaces",
        );
      } finally {
        setIsWorkspaceLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    if (isAuthLoading) return;
    void Promise.resolve().then(() => refreshWorkspaces());
  }, [isAuthLoading, refreshWorkspaces]);

  function selectWorkspace(workspaceId: number) {
    const workspace = workspaces.find((candidate) => candidate.id === workspaceId);
    if (workspace === undefined) return;

    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, String(workspace.id));
    setCurrentWorkspace(workspace);
  }

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        isWorkspaceLoading,
        workspaceError,
        selectWorkspace,
        refreshWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export default WorkspaceProvider;
