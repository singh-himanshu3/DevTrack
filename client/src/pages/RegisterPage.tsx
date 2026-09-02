import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router";
import { register } from "../services/authApi";

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
        <>
            <form onSubmit={handleSubmit}>
                <div>
                    <h1>Register to DevTrack</h1>
                    <div>
                        <label htmlFor="name">Name</label>
                        <input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoComplete="name"
                        />
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
                            autoComplete="new-password"
                        />
                    </div>
                    <div>
                        <button type="submit" disabled={isSubmitting || name.trim() === "" ||
                            email.trim() === "" || password === ""
                        }>
                            {isSubmitting ? "Creating account..." : "Create Account"}
                        </button>
                    </div>
                    {error && <p>{error}</p>}
                    <p>
                        Already have an account? <Link to="/login">Login here</Link>
                    </p>

                </div>
            </form>
        </>
    )
}

export default RegisterPage ;