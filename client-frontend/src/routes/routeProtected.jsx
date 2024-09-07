import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

export const PrivateRoute = () => {
  const { isLoggedIn, isLoading } = useAuth();
  console.log( isLoggedIn, isLoading);
  if (isLoading)
    return (
      <div className="flex-1 flex justify-center items-center bg-gray-500">
        <FontAwesomeIcon icon={faSpinner} spin size="3x" />
        <span className="ml-2">Loading</span>
      </div>
    );
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" />;
};
