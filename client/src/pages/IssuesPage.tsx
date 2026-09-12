import { useEffect, useState, type SubmitEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { getProjects } from "../services/projectsApi";
import type { Project } from "../types/projects";
import "../App.css";
import { useWorkspace } from "../context/WorkspaceContext";
import {
  createIssue,
  updateIssueProject,
  deleteIssue,
  getIssues,
  updateIssueAssignee,
  updateIssueTitle,
} from "../services/issuesApi";
import { getWorkspaceMembers } from "../services/workspacesApi";
import type { Issue } from "../types/issues";
import type { WorkspaceMemberSummary } from "../types/workspaces";

function IssuesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectFilter = searchParams.get("projectId") ?? "";
  return <IssuesContent key={projectFilter} projectFilter={projectFilter} onFilter={value => setSearchParams(value ? { projectId: value } : {})} />;
}

function IssuesContent({ projectFilter, onFilter }: { projectFilter: string; onFilter: (value: string) => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(projectFilter);
  const [movingId, setMovingId] = useState<number | null>(null);
  const { currentWorkspace } = useWorkspace();
  const currentWorkspaceId = currentWorkspace?.id;
  const [issues, setIssues] = useState<Issue[]>([]);
  const [members, setMembers] = useState<WorkspaceMemberSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingIssueId, setDeletingIssueId] = useState<number | null>(null);
  const [editingIssueId, setEditingIssueId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [assigningIssueId, setAssigningIssueId] = useState<number | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Title cannot be empty");
      return;
    }

    if (currentWorkspace === null) {
      setError("Select a workspace before creating an issue");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const newIssue = await createIssue(trimmedTitle, currentWorkspace.id, Number(projectId));
      setIssues((currentIssues) => [newIssue, ...currentIssues]);
      setTitle("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to create issue",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (currentWorkspace === null) return;
    if (!window.confirm("Are you sure you want to delete this issue?")) return;

    setError(null);
    setDeletingIssueId(id);

    try {
      await deleteIssue(id, currentWorkspace.id);
      setIssues((currentIssues) =>
        currentIssues.filter((issue) => issue.id !== id),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to delete issue",
      );
    } finally {
      setDeletingIssueId(null);
    }
  }

  function beginEditing(issue: Issue) {
    setEditingIssueId(issue.id);
    setEditTitle(issue.title);
    setError(null);
  }

  function cancelEditing() {
    setEditingIssueId(null);
    setEditTitle("");
  }

  async function handleUpdate(event: SubmitEvent<HTMLFormElement>, id: number) {
    event.preventDefault();
    const trimmedTitle = editTitle.trim();

    if (!trimmedTitle) {
      setError("Title cannot be empty");
      return;
    }

    if (currentWorkspace === null) return;

    setError(null);
    setIsUpdating(true);

    try {
      const updatedIssue = await updateIssueTitle(
        id,
        trimmedTitle,
        currentWorkspace.id,
      );
      setIssues((currentIssues) =>
        currentIssues.map((issue) =>
          issue.id === updatedIssue.id ? updatedIssue : issue,
        ),
      );
      cancelEditing();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to update issue",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleAssigneeChange(issueId: number, value: string) {
    if (currentWorkspace === null) return;

    const assigneeId = value === "" ? null : Number(value);
    setError(null);
    setAssigningIssueId(issueId);

    try {
      const updatedIssue = await updateIssueAssignee(
        issueId,
        assigneeId,
        currentWorkspace.id,
      );
      setIssues((currentIssues) =>
        currentIssues.map((issue) =>
          issue.id === updatedIssue.id ? updatedIssue : issue,
        ),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to update assignee",
      );
    } finally {
      setAssigningIssueId(null);
    }
  }

  async function moveIssue(id: number, nextProjectId: number) {
    if (!currentWorkspace) return;
    setMovingId(id); setError(null);
    try {
      const updated = await updateIssueProject(id, nextProjectId, currentWorkspace.id);
      setIssues(items => items.map(item => item.id === id ? updated : item)
        .filter(item => !projectFilter || item.projectId === Number(projectFilter)));
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to move issue"); }
    finally { setMovingId(null); }
  }

  useEffect(() => {
    if (currentWorkspaceId === undefined) return;
    const workspaceId = currentWorkspaceId;

    let isCancelled = false;

    async function fetchPageData() {
      setIsLoading(true);
      setError(null);

      try {
        const [issueData, memberData, projectData] = await Promise.all([
          getIssues(workspaceId, projectFilter === "" ? undefined : Number(projectFilter)),
          getWorkspaceMembers(workspaceId),
          getProjects(workspaceId),
        ]);

        if (!isCancelled) {
          setIssues(issueData);
          setMembers(memberData);
          setProjects(projectData);
          setProjectId(projectFilter || String(projectData[0]?.id ?? ""));
        }
      } catch (caughtError) {
        if (!isCancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Failed to load issues",
          );
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    void fetchPageData();
    return () => {
      isCancelled = true;
    };
  }, [currentWorkspaceId, projectFilter]);

  if (currentWorkspace === null) {
    return <p>Create or select a workspace to manage issues.</p>;
  }
  if (isLoading) return <p>Loading issues...</p>;

  return (
    <section>
      <h2>{projectFilter ? "Project Issues" : "All Issues"}</h2>
      <label htmlFor="project-filter">Filter by project</label>
      <select id="project-filter" value={projectFilter} onChange={e => onFilter(e.target.value)}>
        <option value="">All projects</option>
        {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
      </select>
      <Link to="/projects">Manage projects</Link>
      {!error && projects.length === 0 && <p>Create a project before adding issues.</p>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="new-issue-project">Project</label>
        <select id="new-issue-project" value={projectId} disabled={!!projectFilter} onChange={e => setProjectId(e.target.value)} required>
          <option value="" disabled>Select project</option>
          {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <label htmlFor="issue-title">Issue title</label>
        <input
          id="issue-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <button type="submit" disabled={isSubmitting || title.trim() === "" || !projects.some(project => project.id === Number(projectId))}>
          {isSubmitting ? "Creating..." : "Create Issue"}
        </button>
      </form>

      {error && <p>{error}</p>}
      {!error && issues.length === 0 && <p>No issues in this view.</p>}

      <ul>
        {issues.map((issue) => (
          <li key={issue.id}>
            {editingIssueId === issue.id ? (
              <form onSubmit={(event) => void handleUpdate(event, issue.id)}>
                <input
                  aria-label="Issue title"
                  type="text"
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isUpdating || editTitle.trim() === ""}
                >
                  {isUpdating ? "Saving..." : "Save"}
                </button>
                <button type="button" onClick={cancelEditing} disabled={isUpdating}>
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <h3><Link to={`/projects/${issue.projectId}/issues/${issue.id}`}>{issue.title}</Link></h3>
                <button type="button" onClick={() => beginEditing(issue)}>
                  Edit
                </button>
              </>
            )}

            <label htmlFor={`issue-${issue.id}-project`}>Project</label>
            <select id={`issue-${issue.id}-project`} value={issue.projectId} disabled={movingId !== null}
              onChange={event => void moveIssue(issue.id, Number(event.target.value))}>
              {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
            <p>Created At: {new Date(issue.createdAt).toLocaleString()}</p>
            <label htmlFor={`issue-${issue.id}-assignee`}>Assignee</label>
            <select
              id={`issue-${issue.id}-assignee`}
              value={issue.assigneeId ?? ""}
              onChange={(event) =>
                void handleAssigneeChange(issue.id, event.target.value)
              }
              disabled={assigningIssueId !== null}
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.user.id} value={member.user.id}>
                  {member.user.name} ({member.user.email})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void handleDelete(issue.id)}
              disabled={deletingIssueId !== null}
            >
              {deletingIssueId === issue.id ? "Deleting..." : "Delete"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default IssuesPage;
