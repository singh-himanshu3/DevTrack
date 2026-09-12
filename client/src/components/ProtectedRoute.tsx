import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";
import { LoadingState, ErrorNotice } from "./ui";

function ProtectedRoute(){
    const {user, isAuthLoading, authError} = useAuth() ;

    if(isAuthLoading){
        return <LoadingState text="Checking your session…" />;
    }

    if(authError && user === null){
        return <ErrorNotice>{authError} <button onClick={() => window.location.reload()}>Retry</button></ErrorNotice>;
    }

    if(user === null){
        return <Navigate to="/login" replace/> ;
    }

    return <Outlet/>
}

export default ProtectedRoute ;
