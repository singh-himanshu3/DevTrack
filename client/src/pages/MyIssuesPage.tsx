import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useWorkspace } from "../context/WorkspaceContext";
import { getMyIssues } from "../services/issuesApi";
import type { Issue } from "../types/issues";

function MyIssuesPage() {
  const { currentWorkspace } = useWorkspace();
  const currentWorkspaceId = currentWorkspace?.id;
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentWorkspaceId === undefined) return;
    const workspaceId = currentWorkspaceId;

    let isCancelled = false;

    async function fetchMyIssues() {
      setIsLoading(true);
      setError(null);

      try {
        const issueData = await getMyIssues(workspaceId);
        if (!isCancelled) setIssues(issueData);
      } catch (caughtError) {
        if (!isCancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Failed to fetch your issues",
          );
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    void fetchMyIssues();
    return () => {
      isCancelled = true;
    };
  }, [currentWorkspaceId]);

  if (currentWorkspace === null) {
    return <p>Create or select a workspace to view your issues.</p>;
  }
  if (isLoading) return <p>Loading your issues...</p>;

  return (
    <section>
      <h2>My Issues</h2>
      {error && <p>{error}</p>}
      {!error && issues.length === 0 && <p>No issues are assigned to you.</p>}
      <ul>
        {issues.map((issue) => (
          <li key={issue.id}>
            <h3><Link to={`/projects/${issue.projectId}/issues/${issue.id}`}>{issue.title}</Link></h3>
            <Link to={`/?projectId=${issue.projectId}`}>{issue.project.name}</Link>
            <p>Created At: {new Date(issue.createdAt).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default MyIssuesPage;
