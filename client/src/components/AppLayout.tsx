import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { logout } from "../services/authApi";
import { Avatar, Icon, LoadingState } from "./ui";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuth();
  const { workspaces, currentWorkspace, isWorkspaceLoading, workspaceError, selectWorkspace } = useWorkspace();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const page = location.pathname === "/my-issues" ? "My issues" : location.pathname === "/workspaces" ? "Workspace settings" : location.pathname === "/projects" ? "Projects" : location.pathname.startsWith("/projects/") ? "Issue details" : "All issues";
  async function handleLogout() {
    setLogoutError(null); setIsLoggingOut(true);
    try { await logout(); setUser(null); }
    catch (error) { setLogoutError(error instanceof Error ? error.message : "Failed to log out"); }
    finally { setIsLoggingOut(false); }
  }
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="sidebar">
      <Link className="brand" to="/"><span className="brand-mark"><Icon name="check" /></span>DevTrack<span className="brand-dot">.</span></Link>
      <div className="workspace-picker"><label htmlFor="current-workspace">CURRENT WORKSPACE</label>
        <select id="current-workspace" value={currentWorkspace?.id ?? ""} disabled={isWorkspaceLoading || workspaces.length === 0}
          onChange={event => { selectWorkspace(Number(event.target.value)); if (location.pathname === "/my-issues") void navigate("/my-issues"); else if (location.pathname === "/" || location.pathname.startsWith("/projects/")) void navigate("/"); }}>
          {workspaces.length === 0 && <option value="">{isWorkspaceLoading ? "Loading…" : "No workspace yet"}</option>}
          {workspaces.map(workspace => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
        </select><span className="workspace-role">{currentWorkspace ? `${currentWorkspace.role === "OWNER" ? "Owner" : "Member"} access` : "Create a workspace to get started"}</span>
      </div>
      {workspaceError && <p className="sidebar-error" role="alert">{workspaceError}</p>}
      <span className="nav-label">WORKSPACE</span>
      <nav aria-label="Main navigation">
        <NavLink to="/" end><Icon name="issues" />All issues</NavLink>
        <NavLink to="/my-issues"><Icon name="mine" />My issues</NavLink>
        <NavLink to="/projects"><Icon name="projects" />Projects</NavLink>
        <NavLink to="/workspaces"><Icon name="users" />Workspace settings</NavLink>
      </nav>
      <div className="sidebar-guide"><span className="guide-spark">✦</span><strong>A place for every task.</strong><p>Organize work into projects. Open an issue to assign it, track progress, and talk with your team.</p><Link to="/projects">Explore projects <Icon name="arrow" /></Link></div>
      <div className="sidebar-account"><Avatar name={user?.name ?? "User"} /><div><strong>{user?.name}</strong><span>Your account</span></div><button className="icon-button" aria-label="Log out" title="Log out" disabled={isLoggingOut} onClick={() => void handleLogout()}><Icon name="logout" /></button></div>
      {logoutError && <p className="sidebar-error" role="alert">{logoutError}</p>}
    </aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumbs"><span>{currentWorkspace?.name ?? "DevTrack"}</span><span aria-hidden="true">/</span><strong>{page}</strong></div><span className="topbar-note"><span className="live-dot" />Your team's work, in one place</span></header>
      <main id="main-content" className="page-content" tabIndex={-1}>{isWorkspaceLoading ? <LoadingState /> : <Outlet key={currentWorkspace?.id ?? "none"} />}</main>
    </div>
  </div>;
}
