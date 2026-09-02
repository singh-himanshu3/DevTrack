import { useEffect, useState, type ReactNode } from "react"
import type { AuthUser } from "../types/auth"
import { getCurrentUser } from "../services/authApi";
import { AuthContext } from "./AuthContext";

const AuthProvider = ({children}: {children: ReactNode}) => {
    const [user, setUser] = useState<AuthUser | null>(null) ;
    const [isAuthLoading, setIsAuthLoading] = useState(true) ;
    const [authError, setAuthError] = useState<string | null>(null) ;

    useEffect(()=>{
        const restoreSession = async () =>{
            try {
                const response = await getCurrentUser() ;
                setUser(response) ;
            }catch(caughtError) {
                if(caughtError instanceof Error){
                    setAuthError(caughtError.message) ;
                }else{
                    setAuthError("Failed to restore session") ;
                }
            }
            finally{
                setIsAuthLoading(false) ;
            }

        }

        void restoreSession() ;

    }, [])

    return (
        <AuthContext.Provider
            value={{user, isAuthLoading, authError, setUser}} 
        >
            {children}
        </AuthContext.Provider>
    )
}

export default AuthProvider