import { useEffect, useState, type SubmitEvent } from "react";
import { Avatar, Icon, PageHeader } from "../components/ui";
import { useWorkspace } from "../context/WorkspaceContext";
import {
  addWorkspaceMember,
  createWorkspace,
  deleteWorkspace,
  getWorkspaceMembers,
} from "../services/workspacesApi";
import type { WorkspaceMemberSummary } from "../types/workspaces";

function WorkspacesPage() {
  const {
    workspaces,
    currentWorkspace,
    selectWorkspace,
    refreshWorkspaces,
  } = useWorkspace();
  const currentWorkspaceId = currentWorkspace?.id;
  const [members, setMembers] = useState<WorkspaceMemberSummary[]>([]);
  const [workspaceName, setWorkspaceName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentWorkspaceId === undefined) return;
    const workspaceId = currentWorkspaceId;

    let isCancelled = false;

    async function fetchMembers() {
      setIsLoadingMembers(true);
      setError(null);

      try {
        const memberData = await getWorkspaceMembers(workspaceId);
        if (!isCancelled) setMembers(memberData);
      } catch (caughtError) {
        if (!isCancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Failed to fetch members",
          );
        }
      } finally {
        if (!isCancelled) setIsLoadingMembers(false);
      }
    }

    void fetchMembers();
    return () => {
      isCancelled = true;
    };
  }, [currentWorkspaceId]);

  async function handleCreateWorkspace(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = workspaceName.trim();
    if (!name) return;

    setIsCreating(true);
    setError(null);

    try {
      const workspace = await createWorkspace(name);
      setWorkspaceName("");
      await refreshWorkspaces(workspace.id);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to create workspace",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleAddMember(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = memberEmail.trim();
    if (!email || currentWorkspace === null) return;

    setIsAddingMember(true);
    setError(null);

    try {
      const member = await addWorkspaceMember(currentWorkspace.id, email);
      setMembers((currentMembers) =>
        [...currentMembers, member].sort((left, right) =>
          left.user.name.localeCompare(right.user.name),
        ),
      );
      setMemberEmail("");
      await refreshWorkspaces(currentWorkspace.id);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to add workspace member",
      );
    } finally {
      setIsAddingMember(false);
    }
  }

  async function handleDeleteWorkspace() {
    if (currentWorkspace === null) return;
    if (!window.confirm(`Delete ${currentWorkspace.name} and all of its issues?`)) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteWorkspace(currentWorkspace.id);
      await refreshWorkspaces();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to delete workspace",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="workspace-settings-page">
      <PageHeader eyebrow="YOUR TEAM'S HOME" title="Workspace settings" description="A workspace contains your projects, issues, and teammates. Switch between them here or in the sidebar." />

      <form className="panel inline-form create-panel" onSubmit={handleCreateWorkspace}>
        <div className="field grow">
        <label htmlFor="workspace-name">New workspace name</label>
        <input
          id="workspace-name"
          placeholder="e.g. Product & engineering"
          value={workspaceName}
          maxLength={80}
          onChange={(event) => setWorkspaceName(event.target.value)}
        />
        </div>
        <button
          className="button-primary"
          type="submit"
          disabled={isCreating || workspaceName.trim() === ""}
        >
          <Icon name="plus" />{isCreating ? "Creating..." : "Create workspace"}
        </button>
      </form>

      {error && <p className="error-notice" role="alert">{error}</p>}

      <h3>Your workspaces</h3>
      {workspaces.length === 0 ? (
        <p>You do not belong to a workspace yet.</p>
      ) : (
        <ul className="workspace-grid">
          {workspaces.map((workspace) => (
            <li key={workspace.id} className={workspace.id === currentWorkspace?.id ? "selected-workspace" : ""}>
              <button
                type="button"
                onClick={() => selectWorkspace(workspace.id)}
                disabled={workspace.id === currentWorkspace?.id}
              >
                <span className="project-symbol"><Icon name="users" /></span>
                <strong>{workspace.name}</strong><span>{workspace.memberCount} {workspace.memberCount === 1 ? "member" : "members"} · {workspace.role === "OWNER" ? "Owner" : "Member"}</span>
                <span className="workspace-select-label">{workspace.id === currentWorkspace?.id ? "Current workspace" : "Switch workspace →"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {currentWorkspace && (
        <section className="panel members-panel">
          <h3>{currentWorkspace.name} members</h3>

          {currentWorkspace.role === "OWNER" && (
            <>
              <p className="muted">Add a teammate using the email they registered with on DevTrack.</p>
              <form className="inline-form" onSubmit={handleAddMember}>
                <div className="field grow">
                <label htmlFor="member-email">Registered user email</label>
                <input
                  id="member-email"
                  type="email"
                  placeholder="teammate@company.com"
                  value={memberEmail}
                  onChange={(event) => setMemberEmail(event.target.value)}
                />
                </div>
                <button
                  className="button-primary"
                  type="submit"
                  disabled={isAddingMember || memberEmail.trim() === ""}
                >
                  {isAddingMember ? "Adding..." : "Add member"}
                </button>
              </form>
              <details className="danger-zone"><summary>Delete workspace</summary><p>This permanently deletes this workspace and its projects, issues, comments, and history.</p><button
                className="button-danger"
                type="button"
                onClick={() => void handleDeleteWorkspace()}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete workspace"}
              </button></details>
            </>
          )}

          {isLoadingMembers ? (
            <p>Loading members...</p>
          ) : (
            <ul className="member-list">
              {members.map((member) => (
                <li key={member.userId}>
                  <Avatar name={member.user.name} /><div><strong>{member.user.name}</strong><span>{member.user.email}</span></div><span className="role-badge">{member.role === "OWNER" ? "Owner" : "Member"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </section>
  );
}

export default WorkspacesPage;
