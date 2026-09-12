import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useWorkspace } from "../context/WorkspaceContext";
import { useAuth } from "../context/AuthContext";
import { getMyIssues } from "../services/issuesApi";
import type { Issue } from "../types/issues";
import { EmptyState, ErrorNotice, IssueStats, IssueTable, LoadingState, PageHeader } from "../components/ui";

export default function MyIssuesPage() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const workspaceId = currentWorkspace?.id;
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (workspaceId === undefined) return;
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null);
      try { const data = await getMyIssues(workspaceId!); if (!cancelled) setIssues(data); }
      catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load your issues"); }
      finally { if (!cancelled) setLoading(false); }
    }
    void load(); return () => { cancelled = true; };
  }, [workspaceId, attempt]);
  return <section><PageHeader eyebrow="YOUR FOCUS" title="My issues" description={`${user?.name?.split(" ")[0] ?? "Here's your work"}, these are the issues assigned to you in this workspace.`} />
    {!currentWorkspace ? <EmptyState title="Choose your workspace"><p>Your assigned issues will appear here.</p><Link className="button-primary" to="/workspaces">Go to workspace settings</Link></EmptyState> : loading ? <LoadingState text="Finding your issues…" /> : error ? <ErrorNotice>{error} <button onClick={() => setAttempt(value => value + 1)}>Retry</button></ErrorNotice> : <>
      <IssueStats issues={issues} /><section className="panel"><div className="panel-toolbar"><div><h2>Assigned to you <span className="count-badge">{issues.length}</span></h2><p>Open an issue to update progress or join the conversation.</p></div></div>{issues.length ? <IssueTable issues={issues} /> : <EmptyState title="You're all clear"><p>No issues are assigned to you yet. Open an issue and choose yourself as its assignee.</p><Link className="button-primary" to="/">Browse all issues</Link></EmptyState>}</section>
    </>}
  </section>;
}
