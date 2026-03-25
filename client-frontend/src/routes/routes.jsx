import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoutes() {
    const { isLoggedIn, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>
    }
    return isLoggedIn ? <Outlet /> : <Navigate to="/login" />
}

export default ProtectedRoutes;