import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import logo from "../../assets/images/logo.png";

function NavigationBar() {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const hamburgerRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleItemClick = () => {
    setShowMenu(false);
  };

  const handleClickOutside = (event) => {
    if (
      menuRef.current &&
      !menuRef.current.contains(event.target) &&
      hamburgerRef.current &&
      !hamburgerRef.current.contains(event.target)
    ) {
      setShowMenu(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleEscapePress = (event) => {
      if (event.key === "Escape") {
        setShowMenu(false);
      }
    };

    document.addEventListener("keydown", handleEscapePress);

    return () => {
      document.removeEventListener("keydown", handleEscapePress);
    };
  }, []);

  return (
    <nav className="bg-gray-800 px-4 sm:px-2 lg:px-4 sticky top-0">
      <div className="w-full">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center ">
              <Link to="/">
                <img className="h-16 rounded py-1" src={logo} alt="Logo" />
              </Link>
            </div>
            <div className="hidden md:block ml-4 text-right">
              <div className="flex space-x-4">
                <Link to="/" className="text-white hover:text-gray-300">
                  Home
                </Link>
                <Link
                  to="/filereader"
                  className="text-white hover:text-gray-300"
                  onClick={handleItemClick}
                >
                  FileReader
                </Link>
                {isLoggedIn && (
                  <Link
                    to="/savedfiles"
                    className="text-white hover:text-gray-300"
                    onClick={handleItemClick}
                  >
                    Saved Files
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {isLoggedIn ? (
                <>
                  <span className="text-white">Welcome {user.username}</span>
                  <button
                    onClick={handleLogout}
                    className="ml-4 text-white hover:text-gray-300"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-white hover:text-gray-300"
                    onClick={handleItemClick}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="ml-4 text-white hover:text-gray-300"
                    onClick={handleItemClick}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden ">
            <button
              onClick={() => {
                setShowMenu((prevMenuState) => !prevMenuState);
              }}
              type="button"
              ref={menuRef}
              className="hamburger inline-flex items-center justify-center p-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={showMenu ? "true" : "false"}
            >
              <span className="sr-only">Open main menu</span>
              <FontAwesomeIcon icon={faBars} />
            </button>
          </div>
        </div>
      </div>

      <div
        className={`${showMenu ? "block" : "hidden"} md:hidden`}
        id="mobile-menu"
        ref={hamburgerRef}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 text-right">
          <Link
            to="/"
            className="text-white block hover:text-gray-300"
            onClick={handleItemClick}
          >
            Home
          </Link>
          <Link
            to="/filereader"
            className="text-white block hover:text-gray-300"
            onClick={handleItemClick}
          >
            FileReader
          </Link>
          {isLoggedIn && (
            <Link
              to="/savedfiles"
              className="text-white block hover:text-gray-300"
              onClick={handleItemClick}
            >
              Saved Files
            </Link>
          )}
        </div>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3  flex justify-end text-right">
          {isLoggedIn ? (
            <div className="flex justify-end flex-col text-right">
              <span className="text-white">Welcome {user.username}</span>
              <button
                onClick={handleLogout}
                className="block mt-1 text-white hover:text-gray-300 text-right"
              >
                Logout <FontAwesomeIcon icon={faSignOutAlt} />
              </button>
            </div>
          ) : (
            <div className="flex justify-end flex-col text-right">
              <Link
                to="/login"
                className="text-white block hover:text-gray-300 text-right"
                onClick={handleItemClick}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="mt-1 text-white block hover:text-gray-300 text-right"
                onClick={handleItemClick}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavigationBar;
