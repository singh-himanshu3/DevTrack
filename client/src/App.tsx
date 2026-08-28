import { useEffect, useState, type SubmitEvent} from "react";
import './App.css';
import type { Issue } from './types/issues'
import { getIssues, createIssue } from './services/issuesApi';


function App() {
  const [issues, setIssues] = useState<Issue[]>([]) ;
  const [isLoading, setIsLoading] = useState(true) ;
  const [error, setError] = useState<string | null >(null) ;
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } catch (caughtError) {
        if(caughtError instanceof Error) {
          setError(caughtError.message) ;
        }else{
          setError("Failed to create issue") ;
        }
      } finally {
        setIsSubmitting(false) ;
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
            <h2>{issue.title}</h2>
            <p>Created At: {new Date(issue.createdAt).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </>
  )
}
export default App
