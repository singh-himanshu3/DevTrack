import { useEffect, useState, type SubmitEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { useWorkspace } from "../context/WorkspaceContext";
import { getProjects } from "../services/projectsApi";
import { createIssue, getIssues } from "../services/issuesApi";
import type { Issue } from "../types/issues";
import type { Project } from "../types/projects";
import { EmptyState, ErrorNotice, Icon, IssueStats, IssueTable, LoadingState, PageHeader } from "../components/ui";

export default function IssuesPage() {
  const [search, setSearch] = useSearchParams();
  const projectFilter = search.get("projectId") ?? "";
  return <IssuesContent key={projectFilter} projectFilter={projectFilter} onFilter={value => setSearch(value ? { projectId: value } : {})} />;
}
function IssuesContent({ projectFilter, onFilter }: { projectFilter: string; onFilter: (value: string) => void }) {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const [issues, setIssues] = useState<Issue[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(projectFilter);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (workspaceId === undefined) return;
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        const [projectData, issueData] = await Promise.all([getProjects(workspaceId!), getIssues(workspaceId!, projectFilter ? Number(projectFilter) : undefined)]);
        if (!cancelled) { setProjects(projectData); setIssues(issueData); setProjectId(projectFilter || String(projectData[0]?.id ?? "")); }
      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load issues"); }
      finally { if (!cancelled) setLoading(false); }
    }
    void load(); return () => { cancelled = true; };
  }, [workspaceId, projectFilter, attempt]);
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspaceId || !title.trim() || !projectId || saving) return;
    setSaving(true); setError(null);
    try {
      const issue = await createIssue(title.trim(), workspaceId, Number(projectId));
      setIssues(items => [issue, ...items]); setTitle(""); setShowCreate(false); setNotice(`DT-${issue.id} created. Open it to add details and assign a teammate.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to create issue"); }
    finally { setSaving(false); }
  }
  const project = projects.find(item => item.id === Number(projectFilter));
  return <section>
    <PageHeader eyebrow="ISSUE TRACKER" title={projectFilter ? project?.name ?? "Project issues" : "All issues"} description={projectFilter ? "Everything your team is working on in this project." : "A clear view of what needs doing, what's in motion, and what's done."}>
      <button className="button-primary" disabled={!workspaceId || loading || !projects.length} aria-expanded={showCreate} aria-controls="create-issue-panel" onClick={() => setShowCreate(value => !value)}><Icon name="plus" />New issue</button>
    </PageHeader>
    {!currentWorkspace ? <EmptyState title="Start with a workspace"><p>A workspace brings your people, projects, and issues together.</p><Link className="button-primary" to="/workspaces">Create a workspace <Icon name="arrow" /></Link></EmptyState> : <>
      {error && <ErrorNotice>{error} <button onClick={() => setAttempt(value => value + 1)}>Retry</button>{projectFilter && <button onClick={() => onFilter("")}>Show all projects</button>}</ErrorNotice>}
      {notice && <p className="success-notice" role="status"><Icon name="check" />{notice}</p>}
      {loading ? <LoadingState text="Loading issues…" /> : <>
        {showCreate && <section className="panel create-panel" id="create-issue-panel"><div className="panel-heading"><div><h2>Create an issue</h2><p>Give the task a clear title and choose its project.</p></div><button className="button-quiet" disabled={saving} onClick={() => setShowCreate(false)}>Cancel</button></div>
          <form className="inline-form" onSubmit={submit}><div className="field grow"><label htmlFor="issue-title">Issue title</label><input id="issue-title" placeholder="e.g. Fix the sign-in error on mobile" value={title} onChange={event => setTitle(event.target.value)} required autoFocus disabled={saving} /></div><div className="field"><label htmlFor="issue-project">Project</label><select id="issue-project" value={projectId} disabled={!!projectFilter || saving} onChange={event => setProjectId(event.target.value)} required>{projects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><button className="button-primary" disabled={saving || !title.trim() || !projectId}>{saving ? "Creating…" : "Create issue"}</button></form>
        </section>}
        {!error && <IssueStats issues={issues} />}
        <section className="panel issue-panel"><div className="panel-toolbar"><div><h2>Issue list <span className="count-badge">{issues.length}</span></h2><p>Click an issue to manage its details and comments.</p></div><div className="filter-control"><label htmlFor="project-filter">Project</label><select id="project-filter" value={projectFilter} onChange={event => onFilter(event.target.value)}><option value="">All projects</option>{projects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div></div>
          {issues.length ? <IssueTable issues={issues} /> : !error && <EmptyState title={projects.length ? "Your next task starts here" : "Create your first project"}><p>{projects.length ? "Add an issue to start tracking a task, bug, or idea." : "Projects group related work. Create one before adding issues."}</p>{projects.length ? <button className="button-primary" onClick={() => setShowCreate(true)}><Icon name="plus" />New issue</button> : <Link className="button-primary" to="/projects">Go to projects <Icon name="arrow" /></Link>}</EmptyState>}
        </section>
      </>}
    </>}
  </section>;
}
