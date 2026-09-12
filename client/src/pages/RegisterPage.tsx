import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router";
import { register } from "../services/authApi";
import AuthLayout from "../components/AuthLayout";

const RegisterPage = () => {
    const [name, setName] = useState<string>("") ;
    const [email, setEmail] = useState<string>("") ;
    const [password, setPassword] = useState<string>("") ;
    const [error, setError] = useState<string | null>(null) ;
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false) ;

    const navigate = useNavigate() ;

    const handleSubmit = async (e : SubmitEvent<HTMLFormElement>) => {
        e.preventDefault() ;
        if(name.trim() === "" ||email.trim() === "" || password.trim() === ""){
            setError("Name, Email and password are required");
            return ;
        }
        if(password.length < 8){
            setError("Minimum 8 characters are needed for password") ;
            return ;
        }
        try {
            setError(null) ;
            setIsSubmitting(true) ;
    
            await register(name, email, password) ;
            navigate("/login", {replace: true}) ;

        } catch (caughtError) {
            if(caughtError instanceof Error){
                setError(caughtError.message) ;
            }else{
                setError("Failed to register") ;
            }
        } finally{
            setIsSubmitting(false) ;
        }

    }
    return (
        <AuthLayout>
            <form onSubmit={handleSubmit}>
                <div>
                    <p className="eyebrow">LET'S BUILD SOMETHING</p>
                    <h1>Your work, organized.</h1>
                    <p className="auth-description">Create an account and give your next project a home.</p>
                    <div className="auth-fields">
                        <label htmlFor="name">Name</label>
                        <input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoComplete="name"
                            placeholder="Your full name"
                            required
                        />
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
                            autoComplete="new-password"
                            placeholder="Create a password"
                            minLength={8}
                            required
                            aria-describedby="password-help"
                        />
                        <p id="password-help" className="auth-password-help">Use at least 8 characters.</p>
                    </div>
                    <div>
                        <button className="button-primary" type="submit" disabled={isSubmitting || name.trim() === "" ||
                            email.trim() === "" || password === ""
                        }>
                            {isSubmitting ? "Creating account..." : "Create Account"}
                        </button>
                    </div>
                    {error && <p className="error-notice" role="alert">{error}</p>}
                    <p className="auth-footer">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>

                </div>
            </form>
        </AuthLayout>
    )
}

export default RegisterPage ;
