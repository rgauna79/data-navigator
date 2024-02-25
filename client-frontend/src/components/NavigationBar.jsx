import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";

function NavigationBar() {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setShowMenu(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-gray-800">
      <div className="flex justify-between items-center px-4 py-2">
        <ul className="flex items-center">
          <li>
            <Link to="/" className="text-white hover:text-gray-300 mr-4">
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/filereader"
              className="text-white hover:text-gray-300 mr-4"
            >
              FileReader
            </Link>
          </li>
          {isLoggedIn && (
            <li>
              <Link
                to="/savedfiles"
                className="text-white hover:text-gray-300 mr-4"
              >
                Saved Files
              </Link>
            </li>
          )}
        </ul>

        <ul className="flex flex-col items-center">
          <li>
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
                  className="text-white hover:text-gray-300"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:text-gray-300 mr-4"
                >
                  Login
                </Link>
                <Link to="/register" className="text-white hover:text-gray-300">
                  Register
                </Link>
              </>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default NavigationBar;
