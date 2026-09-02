import type { AuthUser } from "../types/auth";

const AUTH_API_URL = "http://localhost:3000/api/auth";
export async function login(email: string, password:string): Promise<AuthUser>{
    const response = await fetch(`${AUTH_API_URL}/login`,{
        method : "POST",
        headers : {
            "Content-Type" : "application/json"
        },
        credentials: "include",
        body : JSON.stringify({email, password})
    })

    if(!response.ok){
        throw new Error("Login failed") ;
    }

    const data = await response.json() ;
    return data as AuthUser ;
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<AuthUser>{
    const response = await fetch(`${AUTH_API_URL}/register`,{
        method : "POST",
        headers : {
            "Content-Type" : "application/json"
        },
        body : JSON.stringify({name, email, password})
    })

    if(!response.ok){
        throw new Error("Registration failed") ;
    }

    const data = await response.json() ;
    return data as AuthUser ;
}

export async function getCurrentUser(): Promise<AuthUser | null>{
    const response = await fetch(`${AUTH_API_URL}/me`,{
        credentials: "include",
    })

    if(response.status === 401){
        return null ;
    }
    
    if (!response.ok) {
        throw new Error("Failed to restore session");
    }

    const user = await response.json() ;
    return user as AuthUser ;
}

export async function logout(): Promise<void>{
    const response = await fetch(`${AUTH_API_URL}/logout`, {
        method: "POST",
        credentials : "include",
    }) ;

    if(!response.ok){
        throw new Error("Logout failed") ;
    }
}