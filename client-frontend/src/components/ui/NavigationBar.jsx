import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faXmark,
  faSignOutAlt,
  faHome,
  faFileExcel,
  faDatabase,
  faClockRotateLeft,
  faCodeCompare,
} from "@fortawesome/free-solid-svg-icons";
import logo from "../../assets/images/logo.svg";
import { NavFileIndicator } from "./FileIndicator.jsx";

const NAV_LINKS = [
  { to: "/", label: "Home", icon: faHome, auth: false },
  { to: "/filereader", label: "File Reader", icon: faFileExcel, auth: false },
  { to: "/compare", label: "Compare", icon: faCodeCompare, auth: false },
  { to: "/savedfiles", label: "Saved Files", icon: faDatabase, auth: true },
  { to: "/reports", label: "My Reports", icon: faClockRotateLeft, auth: true },
];

function NavigationBar() {
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const isActive = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => e.key === "Escape" && setShowMenu(false);
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    setShowMenu(false);
  }, [location.pathname]);

  const visibleLinks = NAV_LINKS.filter((l) => !l.auth || isLoggedIn);

  return (
    <nav
      className="bg-gray-900 border-b border-gray-700/60 sticky top-0 z-50"
      ref={menuRef}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex-shrink-0">
              <img
                className="h-10 rounded-lg"
                src={logo}
                alt="Data Navigator"
              />
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {visibleLinks.map(({ to, label, icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(to)
                      ? "bg-gray-700 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  <FontAwesomeIcon icon={icon} className="text-xs" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <NavFileIndicator />
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                  <span>{user.username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-800"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} />
                  <span>Sign out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-800"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setShowMenu((v) => !v)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <FontAwesomeIcon icon={showMenu ? faXmark : faBars} />
          </button>
        </div>
      </div>

      {showMenu && (
        <div className="md:hidden border-t border-gray-700/60 bg-gray-900 px-4 py-3 space-y-1">
          {visibleLinks.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(to)
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <FontAwesomeIcon icon={icon} className="w-4" />
              {label}
            </Link>
          ))}
          <div className="border-t border-gray-700/60 pt-3 mt-3">
            {isLoggedIn ? (
              <div className="space-y-1">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                  {user.username}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-gray-800 transition-colors w-full text-left"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="w-4" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <Link
                  to="/login"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default NavigationBar;
