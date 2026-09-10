import { useEffect, useState } from "react";
import { getMyIssues } from "../services/issuesApi";
import type { Issue } from "../types/issues";

function MyIssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMyIssues() {
      try {
        setIssues(await getMyIssues());
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Failed to fetch your issues",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void fetchMyIssues();
  }, []);

  if (isLoading) {
    return <p>Loading your issues...</p>;
  }

  return (
    <section>
      <h2>My Issues</h2>
      {error && <p>{error}</p>}
      {!error && issues.length === 0 && <p>No issues are assigned to you.</p>}
      <ul>
        {issues.map((issue) => (
          <li key={issue.id}>
            <h3>{issue.title}</h3>
            <p>Created At: {new Date(issue.createdAt).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default MyIssuesPage;
