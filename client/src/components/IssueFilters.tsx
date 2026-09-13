import { useEffect, useState } from 'react';
import { priorityLabels, statusLabels } from '../types/issues';
import type { Project } from '../types/projects';
import type { WorkspaceMemberSummary } from '../types/workspaces';

type Change = (values: Record<string, string>) => void;
function SearchInput({ value, onChange }: { value: string; onChange: Change }) {
  const [draft, setDraft] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);
  // Sync browser Back/Forward without remounting the input and losing keyboard focus.
  if (previousValue !== value) {
    setPreviousValue(value);
    if (draft.trim() !== value) setDraft(value);
  }
  useEffect(() => {
    if (draft.trim() === value) return;
    const timer = window.setTimeout(() => onChange({ search: draft.trim() }), 300);
    return () => window.clearTimeout(timer);
  }, [draft, value, onChange]);
  return <div className="field filter-search"><label htmlFor="issue-search">Search titles</label><input id="issue-search" type="search" maxLength={200} placeholder="Find an issue…" value={draft} onChange={event => setDraft(event.target.value)} /></div>;
}
export default function IssueFilters({ query, projects, members, mine, onChange, onReset }: {
  query: URLSearchParams; projects: Project[]; members: WorkspaceMemberSummary[]; mine: boolean; onChange: Change; onReset: () => void;
}) {
  return <div className="issue-filters">
    <SearchInput value={query.get('search') ?? ''} onChange={onChange} />
    <div className="field"><label htmlFor="filter-project">Project</label><select id="filter-project" value={query.get('projectId') ?? ''} onChange={e => onChange({ projectId: e.target.value })}><option value="">All projects</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
    {!mine && <div className="field"><label htmlFor="filter-assignee">Assignee</label><select id="filter-assignee" value={query.get('assigneeId') ?? ''} onChange={e => onChange({ assigneeId: e.target.value })}><option value="">Anyone</option><option value="unassigned">Unassigned</option>{members.map(m => <option key={m.userId} value={m.userId}>{m.user.name}</option>)}</select></div>}
    <div className="field"><label htmlFor="filter-status">Status</label><select id="filter-status" value={query.get('status') ?? ''} onChange={e => onChange({ status: e.target.value })}><option value="">All statuses</option>{Object.entries(statusLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div>
    <div className="field"><label htmlFor="filter-priority">Priority</label><select id="filter-priority" value={query.get('priority') ?? ''} onChange={e => onChange({ priority: e.target.value })}><option value="">All priorities</option>{Object.entries(priorityLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div>
    <div className="field"><label htmlFor="filter-sort">Sort by</label><select id="filter-sort" value={`${query.get('sort') ?? 'createdAt'}:${query.get('order') ?? 'desc'}`} onChange={e => { const [sort,order] = e.target.value.split(':'); onChange({ sort, order }); }}><option value="createdAt:desc">Newest created</option><option value="createdAt:asc">Oldest created</option><option value="updatedAt:desc">Recently updated</option><option value="updatedAt:asc">Least recently updated</option></select></div>
    <button className="button-quiet" onClick={onReset}>Reset filters</button>
  </div>;
}
