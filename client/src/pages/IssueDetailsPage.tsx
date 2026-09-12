import { useEffect, useState, type SubmitEvent } from "react";
import { Link, useParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import * as api from "../services/collaborationApi";
import { getWorkspaceMembers } from "../services/workspacesApi";
import { priorityLabels, statusLabels, type Issue, type IssuePriority, type IssueStatus } from "../types/issues";
import type { IssueActivity, IssueComment, IssueScope } from "../types/collaboration";
import type { WorkspaceMemberSummary } from "../types/workspaces";
import "./IssueDetailsPage.css";

export default function IssueDetailsPage() {
  const { projectId, issueId } = useParams();
  const { currentWorkspace } = useWorkspace();
  if (!currentWorkspace) return <p>Select a workspace to view this issue.</p>;
  if (!projectId || !issueId || !/^[1-9]\d*$/.test(projectId) || !/^[1-9]\d*$/.test(issueId)
    || Number(projectId) > 2147483647 || Number(issueId) > 2147483647) {
    return <p role="alert">Invalid issue link. <Link to="/">Return to issues</Link></p>;
  }
  return <IssueDetails key={`${currentWorkspace.id}/${projectId}/${issueId}`}
    scope={{ workspaceId: currentWorkspace.id, projectId: Number(projectId), issueId: Number(issueId) }} />;
}

function activityText(activity: IssueActivity) {
  const previous = activity.oldValue ?? "Unassigned";
  const next = activity.newValue ?? "Unassigned";
  switch (activity.type) {
    case "ISSUE_CREATED": return `created this issue: ${next}`;
    case "TITLE_CHANGED": return `changed the title from “${previous}” to “${next}”`;
    case "ASSIGNEE_CHANGED": return `changed the assignee from ${previous} to ${next}`;
    case "PROJECT_CHANGED": return `moved the issue from ${previous} to ${next}`;
    case "STATUS_CHANGED": return `changed status from ${statusLabels[previous as IssueStatus] ?? previous} to ${statusLabels[next as IssueStatus] ?? next}`;
    case "PRIORITY_CHANGED": return `changed priority from ${priorityLabels[previous as IssuePriority] ?? previous} to ${priorityLabels[next as IssuePriority] ?? next}`;
  }
}

function IssueDetails({ scope }: { scope: IssueScope }) {
  const { user } = useAuth();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [activity, setActivity] = useState<IssueActivity[]>([]);
  const [members, setMembers] = useState<WorkspaceMemberSummary[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const { workspaceId, projectId, issueId } = scope;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        const requestedScope = { workspaceId, projectId, issueId };
        const [loadedIssue, loadedComments, loadedActivity, loadedMembers] = await Promise.all([
          api.getIssue(requestedScope), api.getComments(requestedScope), api.getActivity(requestedScope), getWorkspaceMembers(workspaceId),
        ]);
        if (!cancelled) {
          setIssue(loadedIssue); setTitle(loadedIssue.title); setComments(loadedComments);
          setActivity(loadedActivity); setMembers(loadedMembers);
        }
      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load issue"); }
      finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [workspaceId, projectId, issueId, loadAttempt]);

  async function mutate(action: () => Promise<void>) {
    setPending(true); setError(null);
    try { await action(); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to save changes"); }
    finally { setPending(false); }
  }

  async function refreshActivity() {
    setActivityError(null);
    try { setActivity(await api.getActivity(scope)); }
    catch { setActivityError("Changes saved, but activity could not be refreshed. Try again."); }
  }

  async function updateIssue(action: () => Promise<Issue>) {
    await mutate(async () => {
      const updated = await action();
      setIssue(updated);
      await refreshActivity();
    });
  }

  function submitComment(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim() || pending) return;
    void mutate(async () => {
      const comment = await api.createComment(scope, content.trim());
      setComments(items => [...items, comment]); setContent("");
    });
  }

  function submitEdit(event: SubmitEvent<HTMLFormElement>, id: number) {
    event.preventDefault();
    if (!editContent.trim() || pending) return;
    void mutate(async () => {
      const updated = await api.editComment(scope, id, editContent.trim());
      setComments(items => items.map(item => item.id === id ? updated : item)); setEditingId(null);
    });
  }

  function removeComment(id: number) {
    if (pending || !window.confirm("Delete your comment? This cannot be undone.")) return;
    void mutate(async () => {
      await api.deleteComment(scope, id);
      setComments(items => items.filter(item => item.id !== id));
      if (editingId === id) setEditingId(null);
    });
  }

  if (loading) return <p>Loading issue details...</p>;
  if (!issue) return <section><p role="alert">{error ?? "Issue not found"}</p>
    <button onClick={() => setLoadAttempt(value => value + 1)}>Retry</button>{" "}<Link to="/">Return to issues</Link></section>;

  return <article className="issue-details" aria-busy={pending}>
    <Link to={`/?projectId=${projectId}`}>Back to {issue.project.name}</Link>
    <h2>{issue.title}</h2>
    <p>Issue #{issue.id} · Created <time dateTime={issue.createdAt}>{new Date(issue.createdAt).toLocaleString()}</time></p>
    {error && <p role="alert">{error}</p>}
    <form onSubmit={event => { event.preventDefault(); if (title.trim()) void updateIssue(() => api.changeTitle(scope, title.trim())); }}>
      <label htmlFor="detail-title">Issue title</label>
      <input id="detail-title" value={title} onChange={event => setTitle(event.target.value)} disabled={pending} required />
      <button disabled={pending || !title.trim() || title.trim() === issue.title}>Save title</button>
    </form>
    <div className="issue-fields">
      <label>Assignee<select aria-label="Assignee" disabled={pending} value={issue.assigneeId ?? ""}
        onChange={event => { const value = event.target.value; void updateIssue(() => api.changeAssignee(scope, value ? Number(value) : null)); }}>
        <option value="">Unassigned</option>
        {members.map(member => <option key={member.userId} value={member.userId}>{member.user.name}</option>)}
      </select></label>
      <label>Status<select aria-label="Status" disabled={pending} value={issue.status}
        onChange={event => { const status = event.target.value as IssueStatus; void updateIssue(() => api.changeWorkflow(scope, { status })); }}>
        {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <label>Priority<select aria-label="Priority" disabled={pending} value={issue.priority}
        onChange={event => { const priority = event.target.value as IssuePriority; void updateIssue(() => api.changeWorkflow(scope, { priority })); }}>
        {Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
    </div>
    <section aria-labelledby="comments-heading">
      <h3 id="comments-heading">Comments</h3>
      <form onSubmit={submitComment}>
        <label htmlFor="new-comment">Add a comment</label>
        <textarea id="new-comment" value={content} maxLength={5000} required disabled={pending} onChange={event => setContent(event.target.value)} />
        <button disabled={pending || !content.trim()}>Post comment</button>
      </form>
      {comments.length === 0 && <p>No comments yet. Start the conversation.</p>}
      <ol className="issue-timeline">{comments.map(comment => <li key={comment.id}>
        <p><strong>{comment.author.name}</strong>{" · "}<time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString()}</time>
          {comment.updatedAt !== comment.createdAt && <span> · Edited <time dateTime={comment.updatedAt}>{new Date(comment.updatedAt).toLocaleString()}</time></span>}</p>
        {editingId === comment.id ? <form onSubmit={event => submitEdit(event, comment.id)}>
          <label htmlFor={`edit-comment-${comment.id}`}>Edit comment</label>
          <textarea id={`edit-comment-${comment.id}`} value={editContent} maxLength={5000} required disabled={pending} onChange={event => setEditContent(event.target.value)} />
          <button disabled={pending || !editContent.trim()}>Save comment</button>
          <button type="button" disabled={pending} onClick={() => setEditingId(null)}>Cancel</button>
        </form> : <p className="comment-content">{comment.content}</p>}
        {user?.id === comment.author.id && <div>
          <button disabled={pending || editingId === comment.id} onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}>Edit comment</button>{" "}
          <button disabled={pending} onClick={() => removeComment(comment.id)}>Delete comment</button>
        </div>}
      </li>)}</ol>
    </section>
    <section aria-labelledby="activity-heading">
      <h3 id="activity-heading">Activity</h3>
      {activityError && <p role="alert">{activityError} <button disabled={pending} onClick={() => void refreshActivity()}>Refresh activity</button></p>}
      {activity.length === 0 && <p>No recorded activity yet. History starts with changes made after activity tracking was added.</p>}
      <ol className="issue-timeline">{activity.map(event => <li key={event.id}>
        <p><strong>{event.actor?.name ?? "Deleted user"}</strong> {activityText(event)}</p>
        <time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString()}</time>
      </li>)}</ol>
    </section>
  </article>;
}
