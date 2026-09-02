import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router";
import { login } from "../services/authApi";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
    const [email, setEmail] = useState<string>("") ;
    const [password, setPassword] = useState<string>("") ;
    const [error, setError] = useState<string | null>(null) ;
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false) ;

    const navigate = useNavigate() ;
    const {setUser} = useAuth() ;

    const handleSubmit = async (e : SubmitEvent<HTMLFormElement>) => {
        e.preventDefault() ;
        if(email.trim() === "" || password === ""){
            setError("Email and password are required");
            return ;
        }
        try {
    
            setError(null) ;
            setIsSubmitting(true) ;
    
            const authenticatedUser = await login(email, password) ;
            setUser(authenticatedUser) ;
            navigate("/", {replace: true}) ;

        } catch (caughtError) {
            if(caughtError instanceof Error){
                setError(caughtError.message) ;
            }else{
                setError("Failed to login") ;
            }
        } finally{
            setIsSubmitting(false) ;
        }

    }
    return (
        <>
            <form onSubmit={handleSubmit}>
                <div>
                    <h1>Log in to DevTrack</h1>
                    <div>
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                        />
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                        />
                    </div>
                    <div>
                        <button type="submit" disabled={isSubmitting ||
                            email.trim() === "" || password === ""
                        }>
                            {isSubmitting ? "Logging in..." : "Login"}
                        </button>
                    </div>
                    {error && <p>{error}</p>}
                    <p>
                        Don't have an account? <Link to="/register">Create an account</Link>
                    </p>

                </div>
            </form>
        </>
    )
}

export default LoginPage