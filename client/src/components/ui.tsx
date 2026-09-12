import type { ReactNode } from "react";
import { Link } from "react-router";
import { priorityLabels, statusLabels, type Issue } from "../types/issues";

const paths = {
  issues: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  projects: "M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  mine: "M20 21v-2a7 7 0 0 0-14 0v2M13 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M2 12l2 2 4-4",
  plus: "M12 5v14M5 12h14",
  arrow: "M5 12h14M13 6l6 6-6 6",
  check: "M5 12l4 4L19 6",
  clock: "M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  logout: "M9 4H4v16h5M9 12h12M17 8l4 4-4 4",
} as const;
export function Icon({ name }: { name: keyof typeof paths }) {
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
export function Avatar({ name }: { name: string }) {
  return <span className="avatar" aria-hidden="true">{name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "?"}</span>;
}
export function PageHeader({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div><div className="heading-actions">{children}</div></div>;
}
export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name="projects" /></span><h3>{title}</h3><div>{children}</div></div>;
}
export function LoadingState({ text = "Loading your workspace…" }: { text?: string }) {
  return <div className="loading-state" role="status"><span className="spinner" />{text}</div>;
}
export function ErrorNotice({ children }: { children: ReactNode }) {
  return <div className="error-notice" role="alert">{children}</div>;
}
export function IssueStats({ issues }: { issues: Issue[] }) {
  const values = [
    { name: "Total issues", value: issues.length, icon: "issues" as const, note: "In this view" },
    { name: "In progress", value: issues.filter(issue => issue.status === "IN_PROGRESS").length, icon: "clock" as const, note: "Work underway" },
    { name: "Completed", value: issues.filter(issue => issue.status === "DONE").length, icon: "check" as const, note: "Marked as done" },
    { name: "Unassigned", value: issues.filter(issue => issue.assigneeId === null).length, icon: "mine" as const, note: "Need an owner" },
  ];
  return <div className="stats-grid">{values.map(item => <div className="stat-card" key={item.name}><div className="stat-label">{item.name}<Icon name={item.icon} /></div><strong>{item.value}</strong><span>{item.note}</span></div>)}</div>;
}
export function IssueTable({ issues }: { issues: Issue[] }) {
  return <div className="table-scroll"><table className="issue-table"><caption className="sr-only">Issues in the current view. Open an issue to edit it or add a comment.</caption>
    <thead><tr><th scope="col">Issue</th><th scope="col">Status</th><th scope="col">Priority</th><th scope="col">Assignee</th><th scope="col">Project</th></tr></thead>
    <tbody>{issues.map(issue => <tr key={issue.id}>
      <td><span className="issue-code">DT-{issue.id}</span><Link className="issue-title-link" to={`/projects/${issue.projectId}/issues/${issue.id}`}>{issue.title}<Icon name="arrow" /></Link></td>
      <td><span className={`status-badge status-${issue.status.toLowerCase()}`}><i />{statusLabels[issue.status]}</span></td>
      <td><span className={`priority priority-${issue.priority.toLowerCase()}`}><i />{priorityLabels[issue.priority]}</span></td>
      <td>{issue.assignee ? <span className="person"><Avatar name={issue.assignee.name} /><span>{issue.assignee.name}</span></span> : <span className="muted">Unassigned</span>}</td>
      <td><Link className="project-tag" to={`/?projectId=${issue.projectId}`}>{issue.project.name}</Link></td>
    </tr>)}</tbody>
  </table></div>;
}
