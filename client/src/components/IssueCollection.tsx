import { useCallback, useEffect, useState, type SubmitEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useWorkspace } from '../context/WorkspaceContext';
import { getProjects } from '../services/projectsApi';
import { getWorkspaceMembers } from '../services/workspacesApi';
import { createIssue, getIssues, type IssuePage } from '../services/issuesApi';
import type { Project } from '../types/projects';
import type { WorkspaceMemberSummary } from '../types/workspaces';
import { EmptyState, ErrorNotice, Icon, IssueTable, LoadingState, PageHeader } from './ui';
import IssueFilters from './IssueFilters';

export default function IssueCollection({ mine = false }: { mine?: boolean }) {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const [query, setQuery] = useSearchParams();
  const queryString = query.toString();
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<WorkspaceMemberSummary[]>([]);
  const [page, setPage] = useState<IssuePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');
  const [filterReset, setFilterReset] = useState(0);
  function resetView() { setFilterReset(value => value + 1); setQuery({}); }

  const change = useCallback((values: Record<string, string>) => {
    setQuery(previous => {
      const next = new URLSearchParams(previous);
      next.delete('page');
      for (const [key, value] of Object.entries(values)) { if (value) next.set(key, value); else next.delete(key); }
      return next;
    });
  }, [setQuery]);
  useEffect(() => {
    if (workspaceId === undefined) return;
    let cancelled = false;
    async function load() {
      setLoading(true); setError('');
      try {
        const [data, availableProjects, availableMembers] = await Promise.all([
          getIssues(workspaceId!, queryString, mine), getProjects(workspaceId!), getWorkspaceMembers(workspaceId!),
        ]);
        if (!cancelled) { setPage(data); setProjects(availableProjects); setMembers(availableMembers); }
      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : 'Unable to load issues'); }
      finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [workspaceId, queryString, mine, attempt]);

  function openCreate() {
    setProjectId(query.get('projectId') ?? String(projects[0]?.id ?? ''));
    setShowCreate(true); setSaveError('');
  }
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspaceId || !title.trim() || !projectId || saving) return;
    setSaving(true); setSaveError('');
    try {
      const issue = await createIssue(title.trim(), workspaceId, Number(projectId));
      setTitle(''); setShowCreate(false);
      setNotice(`DT-${issue.id} created. Current filters determine whether it appears below.`);
      // Reload the server page: never insert an issue that may violate the active filters or sort.
      setAttempt(value => value + 1);
    } catch (e) { setSaveError(e instanceof Error ? e.message : 'Unable to create issue'); }
    finally { setSaving(false); }
  }
  const active = ['search','projectId','assigneeId','status','priority'].some(key => query.has(key));
  const filteredProject = projects.find(p => String(p.id) === query.get('projectId'));
  return <section>
    <PageHeader eyebrow={mine ? 'YOUR FOCUS' : 'ISSUE TRACKER'} title={mine ? 'My issues' : filteredProject?.name ?? 'All issues'} description={mine ? 'Find and prioritize the work assigned to you.' : 'Find the right work. Search, narrow your view, and keep your team moving.'}>
      {!mine && <button className="button-primary" disabled={!workspaceId || loading || !projects.length} onClick={openCreate}><Icon name="plus" />New issue</button>}
    </PageHeader>
    {!currentWorkspace ? <EmptyState title="Start with a workspace"><p>A workspace brings your team, projects, and issues together.</p><Link className="button-primary" to="/workspaces">Go to workspace settings</Link></EmptyState> : <>
      {notice && <p className="success-notice" role="status">{notice}</p>}
      {saveError && <ErrorNotice>{saveError}</ErrorNotice>}
      {showCreate && <section className="panel create-panel"><div className="panel-heading"><h2>Create an issue</h2><button disabled={saving} onClick={() => setShowCreate(false)}>Cancel</button></div><form className="inline-form" onSubmit={submit}><div className="field grow"><label htmlFor="issue-title">Issue title</label><input id="issue-title" required autoFocus value={title} disabled={saving} onChange={e => setTitle(e.target.value)} placeholder="What needs doing?" /></div><div className="field"><label htmlFor="issue-project">Project</label><select id="issue-project" required value={projectId} disabled={saving} onChange={e => setProjectId(e.target.value)}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div><button className="button-primary" disabled={saving || !title.trim() || !projectId}>{saving ? 'Creating…' : 'Create issue'}</button></form></section>}
      <section className="panel issue-panel">
        <IssueFilters key={filterReset} query={query} projects={projects} members={members} mine={mine} onChange={change} onReset={resetView} />
        <div className="panel-toolbar"><div><h2>{mine ? 'Assigned to you' : 'Issue list'}</h2><p role="status">{loading ? 'Finding issues…' : error ? 'Unable to load results.' : `${page?.total ?? 0} matching ${(page?.total ?? 0) === 1 ? 'issue' : 'issues'}`}</p></div><div className="filter-control"><label htmlFor="page-size">Per page</label><select id="page-size" value={query.get('limit') ?? '20'} onChange={e => change({limit:e.target.value})}>{[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}</select></div></div>
        {loading ? <LoadingState text="Loading issues…" /> : error ? <ErrorNotice>{error} <button onClick={() => setAttempt(v => v + 1)}>Retry</button><button onClick={resetView}>Reset view</button></ErrorNotice> : page && <>
          {page.items.length ? <IssueTable issues={page.items} /> : <EmptyState title={page.total > 0 ? 'No issues on this page' : active ? 'No matching issues' : mine ? "You're all clear" : projects.length ? 'Your next task starts here' : 'Create your first project'}><p>{active ? 'Try another search or clear the filters to broaden your view.' : mine ? 'Issues assigned to you will appear here.' : projects.length ? 'Add an issue to start tracking a task, bug, or idea.' : 'Projects group related work. Create one before adding issues.'}</p>{page.total > 0 ? <button onClick={() => change({page:'1'})}>Go to first page</button> : active ? <button onClick={resetView}>Clear filters</button> : !projects.length ? <Link className="button-primary" to="/projects">Go to projects</Link> : !mine && <button className="button-primary" onClick={openCreate}>New issue</button>}</EmptyState>}
          <nav className="pagination" aria-label="Issue pages"><span>{page.total ? `${page.items.length ? (page.page - 1) * page.limit + 1 : 0}–${page.items.length ? (page.page - 1) * page.limit + page.items.length : 0} of ${page.total}` : '0 issues'}</span><div><button disabled={page.page <= 1} onClick={() => change({page:String(page.page - 1)})}>Previous</button><span>Page {page.page} of {Math.max(1,page.totalPages)}</span><button disabled={page.page >= page.totalPages} onClick={() => change({page:String(page.page + 1)})}>Next</button></div></nav>
        </>}
      </section>
    </>}
  </section>;
}
