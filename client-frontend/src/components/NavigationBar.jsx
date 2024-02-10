import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function NavigationBar() {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-gray-800">
      <ul className="flex justify-between items-center px-4 py-2">
        <li>
          <Link to="/" className="text-white hover:text-gray-300 mr-4">
            Home
          </Link>
        </li>
        {isLoggedIn && (
          <li>
            <Link to="/filereader" className="text-white hover:text-gray-300">
              File Reader
            </Link>
          </li>
        )}
        <li className="ml-auto">
          {isLoggedIn ? (
            <>
              <Link
                to="/profile"
                className="text-white hover:text-gray-300 mr-4"
              >
                Welcome {user.username}
              </Link>
              <button
                onClick={handleLogout}
                className="text-white hover:text-gray-300 mr-4"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-white hover:text-gray-300 mr-4">
                Login
              </Link>
              <Link to="/register" className="text-white hover:text-gray-300">
                Register
              </Link>
            </>
          )}
        </li>
      </ul>
    </nav>
  );
}

export default NavigationBar;
