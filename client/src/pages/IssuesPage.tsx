import { useEffect, useState, type SubmitEvent} from "react";
import '../App.css';
import type { Issue } from '../types/issues'
import {
  createIssue,
  deleteIssue,
  getIssues,
  updateIssueAssignee,
  updateIssueTitle,
} from '../services/issuesApi';
import { getUsers } from "../services/usersApi";
import type { UserSummary } from "../types/users";

function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]) ;
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true) ;
  const [error, setError] = useState<string | null >(null) ;
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingIssueId, setDeletingIssueId] = useState<number | null>(null);
  const [editingIssueId, setEditingIssueId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [assigningIssueId, setAssigningIssueId] = useState<number | null>(null);

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
  async function handleAssigneeChange(issueId: number, value: string) {
    const assigneeId = value === "" ? null : Number(value);
    setError(null);
    setAssigningIssueId(issueId);

    try {
      const updatedIssue = await updateIssueAssignee(issueId, assigneeId);
      setIssues((currentIssues) =>
        currentIssues.map((issue) =>
          issue.id === updatedIssue.id ? updatedIssue : issue,
        ),
      );
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError("Failed to update assignee");
      }
    } finally {
      setAssigningIssueId(null);
    }
  }
  useEffect(() => {
    async function fetchPageData(){
      try {
        const [issueData, userData] = await Promise.all([
          getIssues(),
          getUsers(),
        ]);
        setIssues(issueData) ;
        setUsers(userData);
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
    void fetchPageData() ;
  }
  , [])
  if(isLoading) return <div>Loading...</div> ;
  return (
    <>
      <h2>All Issues</h2>
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
            <label htmlFor={`issue-${issue.id}-assignee`}>Assignee</label>
            <select
              id={`issue-${issue.id}-assignee`}
              value={issue.assigneeId ?? ""}
              onChange={(event) =>
                void handleAssigneeChange(issue.id, event.target.value)
              }
              disabled={assigningIssueId !== null}
            >
              <option value="">Unassigned</option>
              {users.map((availableUser) => (
                <option key={availableUser.id} value={availableUser.id}>
                  {availableUser.name} ({availableUser.email})
                </option>
              ))}
            </select>
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
