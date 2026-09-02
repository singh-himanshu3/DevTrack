import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute(){
    const {user, isAuthLoading, authError} = useAuth() ;

    if(isAuthLoading){
        return <p>Checking Session...</p> ; 
    }

    if(authError && user === null){
        return <p>{authError}</p> ;
    }

    if(user === null){
        return <Navigate to="/login" replace/> ;
    }

    return <Outlet/>
}

export default ProtectedRoute ;