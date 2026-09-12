import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router";
import { login } from "../services/authApi";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";

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
        <AuthLayout>
            <form onSubmit={handleSubmit}>
                <div>
                    <p className="eyebrow">WELCOME TO DEVTRACK</p>
                    <h1>Welcome back.</h1>
                    <p className="auth-description">Sign in to pick up where your team left off.</p>
                    <div className="auth-fields">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            placeholder="you@company.com"
                            required
                        />
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <div>
                        <button className="button-primary" type="submit" disabled={isSubmitting ||
                            email.trim() === "" || password === ""
                        }>
                            {isSubmitting ? "Signing in…" : "Sign in"}
                        </button>
                    </div>
                    {error && <p className="error-notice" role="alert">{error}</p>}
                    <p className="auth-footer">
                        Don't have an account? <Link to="/register">Create an account</Link>
                    </p>

                </div>
            </form>
        </AuthLayout>
    )
}

export default LoginPage
