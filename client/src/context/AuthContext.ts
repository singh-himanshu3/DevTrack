import type { AuthUser } from "../types/auth";
import { createContext, useContext } from "react";

interface AuthContextValue {
    user: AuthUser | null;
    isAuthLoading: boolean;
    authError: string | null;
    setUser: (user: AuthUser | null) => void; 
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined) ;

export function useAuth(){
    const context = useContext(AuthContext) ;
    if(context === undefined){
        throw new Error("useAuth must be used within an AuthProvider") ;
    }
    return context ;
}