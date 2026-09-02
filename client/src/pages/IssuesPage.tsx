import { useEffect, useState, type SubmitEvent} from "react";
import '../App.css';
import type { Issue } from '../types/issues'
import { getIssues, createIssue, updateIssueTitle, deleteIssue } from '../services/issuesApi';
import { logout } from "../services/authApi" ;
import { useAuth } from "../context/AuthContext" ;

function IssuesPage() {
  const { user, setUser } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [issues, setIssues] = useState<Issue[]>([]) ;
  const [isLoading, setIsLoading] = useState(true) ;
  const [error, setError] = useState<string | null >(null) ;
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingIssueId, setDeletingIssueId] = useState<number | null>(null);
  const [editingIssueId, setEditingIssueId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault() ;
    const trimmedTitle = title.trim() ;
    if(!trimmedTitle) {
      setError("Title cannot be empty") ;
      return ;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const newIssue = await createIssue(trimmedTitle) ;
      setIssues(prevIssues => [newIssue, ...prevIssues]) ;
      setTitle("") ;
    }catch (caughtError) {
        if(caughtError instanceof Error) {
          setError(caughtError.message) ;
        }else{
          setError("Failed to create issue") ;
        }
    }finally {
        setIsSubmitting(false) ;
    }
  }

  async function handleDelete(id : number) {
    const confirmed = window.confirm("Are you sure you want to delete this issue?") ;
    if(!confirmed) return ;
    
    setError(null) ;
    setDeletingIssueId(id) ;
    try {
      await deleteIssue(id) ;
      setIssues(prevIssues => prevIssues.filter(issue => issue.id !== id)) ;
    }catch (caughtError) {
        if(caughtError instanceof Error) {
          setError(caughtError.message) ;
        }else{
          setError("Failed to delete issue") ;
        }
    }finally {
        setDeletingIssueId(null) ;
    }
    
  }
  
  function beginEditing(issue: Issue) {
    setEditingIssueId(issue.id);
    setEditTitle(issue.title);
    setError(null);
  }

  function cancelEditing() {
    setEditingIssueId(null);
    setEditTitle("");
  }

  async function handleUpdate(
    event: SubmitEvent<HTMLFormElement>,
    id: number
  ) {
    event.preventDefault();

    const trimmedTitle = editTitle.trim();

    if (!trimmedTitle) {
      setError("Title cannot be empty");
      return;
    }

    setError(null);
    setIsUpdating(true);

    try {
      const updatedIssue = await updateIssueTitle(id, trimmedTitle);

      setIssues(currentIssues =>
        currentIssues.map(issue =>
          issue.id === updatedIssue.id ? updatedIssue : issue
        )
      );

      cancelEditing();
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("Failed to update issue");
      }
    } finally {
      setIsUpdating(false);
    }
  }
  async function handleLogout() {
    setError(null);
    setIsLoggingOut(true);

    try {
      await logout();
      setUser(null);
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("Failed to log out");
      }
    } finally {
      setIsLoggingOut(false);
    }
  }
  useEffect(() => {
    async function fetchIssues(){
      try {
        const data = await getIssues() ;
        setIssues(data) ;
      } catch (caughtError) {
        if(caughtError instanceof Error) {
          setError(caughtError.message) ;
        }else{
          setError("Failed to load issues") ;
        }
      } finally {
        setIsLoading(false) ;
      }
    }
    void fetchIssues() ;
  }
  , [])
  if(isLoading) return <div>Loading...</div> ;
  return (
    <>
      <h1>DevTrack</h1>
      <p>Signed in as {user?.name}</p>

      <button
        type="button"
        onClick={() => void handleLogout()}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? "Logging out..." : "Log out"}
      </button>
      <form onSubmit={handleSubmit}>
        <label htmlFor="issue-title">Issue title</label>

        <input
          id="issue-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <button
          type="submit"
          disabled={isSubmitting || title.trim() === ""}
        >
          {isSubmitting ? "Creating..." : "Create Issue"}
        </button>
      </form>
      {error && <div>{error}</div>}
      <ul>
        {issues.map(issue => (
          <li key={issue.id}>
            {editingIssueId === issue.id ? (
                <form onSubmit={(event) => void handleUpdate(event, issue.id)}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                    autoFocus
                  />

                  <button
                    type="submit"
                    disabled={isUpdating || editTitle.trim() === ""}
                  >
                    {isUpdating ? "Saving..." : "Save"}
                  </button>

                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <h2>{issue.title}</h2>

                  <button
                    type="button"
                    onClick={() => beginEditing(issue)}
                  >
                    Edit
                  </button>
                </>
              )}
            <p>Created At: {new Date(issue.createdAt).toLocaleString()}</p>
            <button
              type="button"
              onClick={() => void handleDelete(issue.id)}
              disabled={deletingIssueId !== null}
            >
              {deletingIssueId === issue.id
                ? "Deleting..."
                : "Delete"}
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
export default IssuesPage