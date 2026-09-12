import { useEffect, useState, type SubmitEvent } from "react";
import { Link } from "react-router";
import { useWorkspace } from "../context/WorkspaceContext";
import { createProject, deleteProject, getProjects, renameProject } from "../services/projectsApi";
import type { Project } from "../types/projects";
import { EmptyState, ErrorNotice, Icon, LoadingState, PageHeader } from "../components/ui";

export default function ProjectsPage() {
  const { currentWorkspace } = useWorkspace();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const workspaceId = currentWorkspace?.id;
  useEffect(() => {
    if (workspaceId === undefined) return;
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null);
      try { const data = await getProjects(workspaceId!); if (!cancelled) setProjects(data); }
      catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load projects"); }
      finally { if (!cancelled) setLoading(false); }
    }
    void load(); return () => { cancelled = true; };
  }, [workspaceId, attempt]);
  const owner = currentWorkspace?.role === "OWNER";
  async function save(event: SubmitEvent<HTMLFormElement>, id?: number) {
    event.preventDefault(); if (workspaceId === undefined || busy) return;
    setBusy(true); setError(null);
    try {
      const project = id === undefined ? await createProject(workspaceId, name.trim()) : await renameProject(workspaceId, id, editName.trim());
      setProjects(items => (id === undefined ? [...items, project] : items.map(item => item.id === id ? project : item)).sort((a,b) => a.name.localeCompare(b.name)));
      setName(""); setEditingId(null); setShowCreate(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to save project"); }
    finally { setBusy(false); }
  }
  async function remove(project: Project) {
    if (workspaceId === undefined || !window.confirm(`Delete project "${project.name}"?`)) return;
    setBusy(true); setError(null);
    try { await deleteProject(workspaceId, project.id); setProjects(items => items.filter(item => item.id !== project.id)); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to delete project"); }
    finally { setBusy(false); }
  }
  return <section><PageHeader eyebrow="ORGANIZE YOUR WORK" title="Projects" description="Give every initiative a home. Keep related issues and conversations together.">
    {owner && <button className="button-primary" onClick={() => setShowCreate(value => !value)} aria-expanded={showCreate} aria-controls="new-project-panel"><Icon name="plus" />New project</button>}
  </PageHeader>
  {!currentWorkspace ? <EmptyState title="A workspace comes first"><p>Create or select a workspace to organize projects for your team.</p><Link className="button-primary" to="/workspaces">Go to workspace settings</Link></EmptyState> : <>
    {error && <ErrorNotice>{error} <button onClick={() => setAttempt(value => value + 1)}>Retry</button></ErrorNotice>}
    {owner && showCreate && <section className="panel create-panel" id="new-project-panel"><div className="panel-heading"><div><h2>Create a project</h2><p>A feature, a product, or your next big idea.</p></div><button className="button-quiet" disabled={busy} onClick={() => setShowCreate(false)}>Cancel</button></div><form className="inline-form" onSubmit={save}><div className="field grow"><label htmlFor="project-name">Project name</label><input id="project-name" placeholder="e.g. Website redesign" value={name} maxLength={80} required autoFocus disabled={busy} onChange={e => setName(e.target.value)} /></div><button className="button-primary" disabled={busy || !name.trim()}>{busy ? "Creating…" : "Create project"}</button></form></section>}
    {!owner && <p className="info-notice">You can work on issues in every project. Workspace owners manage project creation and settings.</p>}
    {loading ? <LoadingState text="Loading projects…" /> : !projects.length && !error ? <EmptyState title="Make room for your next idea"><p>Create your first project, then add the tasks your team needs to tackle.</p>{owner && <button className="button-primary" onClick={() => setShowCreate(true)}><Icon name="plus" />Create a project</button>}</EmptyState> : <>
      <div className="section-caption"><span>{projects.length} {projects.length === 1 ? "project" : "projects"}</span><span>In {currentWorkspace.name}</span></div>
      <ul className="project-grid">{projects.map((project, index) => <li className="project-card" key={project.id}>
        <div className="project-card-top"><span className={`project-symbol tone-${index % 4}`}><Icon name="projects" /></span><span className="project-card-label">PROJECT</span></div>
        <h2><Link to={`/?projectId=${project.id}`}>{project.name}</Link></h2><p className="muted">{project._count.issues} {project._count.issues === 1 ? "issue" : "issues"} to explore</p>
        <Link className="project-open" to={`/?projectId=${project.id}`}>View issues <Icon name="arrow" /></Link>
        {owner && <details className="project-settings"><summary>Project settings</summary>
          {editingId === project.id ? <form className="stack-form" onSubmit={event => void save(event, project.id)}><label htmlFor={`rename-${project.id}`}>Project name</label><input id={`rename-${project.id}`} value={editName} maxLength={80} required disabled={busy} onChange={e => setEditName(e.target.value)} /><div className="button-row"><button className="button-primary" disabled={busy || !editName.trim()}>Save name</button><button type="button" disabled={busy} onClick={() => setEditingId(null)}>Cancel</button></div></form> : <button disabled={busy} onClick={() => { setEditingId(project.id); setEditName(project.name); }}>Rename project</button>}
          <button className="button-danger" disabled={busy || project._count.issues > 0} onClick={() => void remove(project)}>Delete project</button>
          {project._count.issues > 0 && <p className="field-help">Move or delete all issues before deleting this project.</p>}
        </details>}
      </li>)}</ul>
    </>}
  </>}
  </section>;
}
