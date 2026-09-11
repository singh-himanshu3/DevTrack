import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { logout } from "../services/authApi";

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuth();
  const {
    workspaces,
    currentWorkspace,
    isWorkspaceLoading,
    workspaceError,
    selectWorkspace,
  } = useWorkspace();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    setLogoutError(null);
    setIsLoggingOut(true);

    try {
      await logout();
      setUser(null);
    } catch (caughtError) {
      setLogoutError(
        caughtError instanceof Error ? caughtError.message : "Failed to log out",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <>
      <header>
        <h1>DevTrack</h1>
        <p>Signed in as {user?.name}</p>
        <label htmlFor="current-workspace">Workspace</label>
        {isWorkspaceLoading ? (
          <span> Loading workspaces...</span>
        ) : (
          <select
            id="current-workspace"
            value={currentWorkspace?.id ?? ""}
            onChange={(event) => {
              selectWorkspace(Number(event.target.value));
              if (location.pathname === "/") void navigate("/");
            }}
            disabled={workspaces.length === 0}
          >
            {workspaces.length === 0 && <option value="">No workspace</option>}
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
        )}
        {workspaceError && <p>{workspaceError}</p>}
        <nav aria-label="Main navigation">
          <Link to="/">All Issues</Link>{" "}
          <Link to="/my-issues">My Issues</Link>{" "}
          <Link to="/workspaces">Workspaces</Link>
          {" "}<Link to="/projects">Projects</Link>
        </nav>
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Logging out..." : "Log out"}
        </button>
        {logoutError && <p>{logoutError}</p>}
      </header>
      <main>
        <Outlet key={currentWorkspace?.id ?? "none"} />
      </main>
    </>
  );
}

export default AppLayout;
