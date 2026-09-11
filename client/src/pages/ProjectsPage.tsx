import { useEffect, useState, type SubmitEvent } from "react";
import { Link } from "react-router";
import { useWorkspace } from "../context/WorkspaceContext";
import { createProject, deleteProject, getProjects, renameProject } from "../services/projectsApi";
import type { Project } from "../types/projects";

export default function ProjectsPage() {
  const { currentWorkspace } = useWorkspace();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workspaceId = currentWorkspace?.id;
  useEffect(() => {
    if (workspaceId === undefined) return;
    let cancelled = false;
    getProjects(workspaceId).then(data => { if (!cancelled) setProjects(data); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load projects"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [workspaceId]);
  if (!currentWorkspace) return <p>Select a workspace to manage projects.</p>;
  const owner = currentWorkspace.role === "OWNER";

  async function save(event: SubmitEvent<HTMLFormElement>, id?: number) {
    event.preventDefault();
    if (workspaceId === undefined) return;
    setBusy(true); setError(null);
    try {
      const project = id === undefined ? await createProject(workspaceId, name.trim()) : await renameProject(workspaceId, id, editName.trim());
      setProjects(items => id === undefined ? [...items, project] : items.map(item => item.id === id ? project : item));
      setName(""); setEditingId(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to save project"); }
    finally { setBusy(false); }
  }
  async function remove(project: Project) {
    if (workspaceId === undefined || !window.confirm(`Delete project "${project.name}"?`)) return;
    setBusy(true); setError(null);
    try {
      await deleteProject(workspaceId, project.id);
      setProjects(items => items.filter(item => item.id !== project.id));
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to delete project"); }
    finally { setBusy(false); }
  }
  return <section>
    <h2>Projects</h2>
    {owner ? <form onSubmit={save}>
      <label htmlFor="project-name">New project name</label>
      <input id="project-name" value={name} maxLength={80} required onChange={e => setName(e.target.value)} />
      <button disabled={busy || !name.trim()}>Create project</button>
    </form> : <p>Workspace owners manage projects.</p>}
    {error && <p role="alert">{error}</p>}
    {loading ? <p>Loading projects...</p> : projects.length === 0 && <p>No projects yet. A workspace owner can create one to start tracking issues.</p>}
    <ul>{projects.map(project => <li key={project.id}>
      <h3><Link to={`/?projectId=${project.id}`}>{project.name}</Link></h3>
      <p>{project._count.issues} issues</p>
      {owner && (editingId === project.id ? <form onSubmit={event => void save(event, project.id)}>
        <label htmlFor="rename-project">Project name</label>
        <input id="rename-project" value={editName} maxLength={80} required onChange={e => setEditName(e.target.value)} />
        <button disabled={busy || !editName.trim()}>Save</button>
        <button type="button" disabled={busy} onClick={() => setEditingId(null)}>Cancel</button>
      </form> : <button disabled={busy} onClick={() => { setEditingId(project.id); setEditName(project.name); }}>Rename</button>)}
      {owner && <button disabled={busy || project._count.issues > 0} onClick={() => void remove(project)}>Delete project</button>}
      {owner && project._count.issues > 0 && <p>Move or delete this project's issues before deleting it.</p>}
    </li>)}</ul>
  </section>;
}
