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
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import logo from "../../assets/images/logo.svg";
import { NavFileIndicator } from "./FileIndicator.jsx";

const NAV_LINKS = [
  { to: "/", label: "Home", icon: faHome, auth: false },
  { to: "/filereader", label: "Reader", icon: faFileExcel, auth: false }, // Acortamos "File Reader" a "Reader" para ganar espacio
  { to: "/compare", label: "Compare", icon: faCodeCompare, auth: false },
  { to: "/savedfiles", label: "Files", icon: faDatabase, auth: true }, // Acortamos "Saved Files" a "Files"
  { to: "/reports", label: "Reports", icon: faClockRotateLeft, auth: true }, // Acortamos "My Reports" a "Reports"
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
      className="bg-gray-900 border-b border-gray-800 sticky top-0 z-[100] w-full"
      ref={menuRef}
    >
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex justify-between items-center h-16 gap-4">
          {/* LADO IZQUIERDO: Logo y Links (Desktop) */}
          <div className="flex items-center gap-4 lg:gap-8 min-w-0">
            <Link
              to="/"
              className="flex-shrink-0 transition-transform active:scale-95"
            >
              <img
                className="h-9 w-auto rounded-lg shadow-sm"
                src={logo}
                alt="Data Navigator"
              />
            </Link>

            <div className="hidden lg:flex items-center gap-1 overflow-hidden">
              {visibleLinks.map(({ to, label, icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    isActive(to)
                      ? "bg-gray-800 text-blue-400 shadow-inner"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  }`}
                >
                  <FontAwesomeIcon icon={icon} className="text-[10px]" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* CENTRO: Indicador de Archivo (Se oculta en tablets/móviles pequeños para no estorbar) */}
          <div className="hidden md:block flex-shrink-0">
            <NavFileIndicator />
          </div>

          {/* LADO DERECHO: Usuario y Menú Hamburguesa */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 border-l border-gray-800 ml-2 pl-4">
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <Link to="/profile" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 group-hover:bg-blue-500 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-blue-900/20 transition-all">
                      {user.username?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-gray-300 group-hover:text-white hidden xl:block transition-colors">
                      {user.username}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Sign out"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="text-sm" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-xs font-bold text-gray-400 hover:text-white px-3 py-2 rounded-xl transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all font-black uppercase tracking-widest shadow-lg shadow-blue-900/20"
                  >
                    Join
                  </Link>
                </div>
              )}
            </div>

            {/* Hamburguesa (Visible en < 1024px) */}
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all border border-transparent hover:border-gray-700"
            >
              <FontAwesomeIcon
                icon={showMenu ? faXmark : faBars}
                className="text-lg"
              />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      {showMenu && (
        <div className="lg:hidden border-t border-gray-800 bg-gray-900/95 backdrop-blur-md px-4 py-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
          <div className="md:hidden mb-4 pb-4 border-b border-gray-800">
            <NavFileIndicator />
          </div>

          {visibleLinks.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive(to)
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <FontAwesomeIcon icon={icon} className="w-5 text-center" />
              {label}
            </Link>
          ))}

          <div className="pt-4 mt-4 border-t border-gray-800">
            {isLoggedIn ? (
              <div className="space-y-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[10px] font-black">
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors w-full text-left"
                >
                  <FontAwesomeIcon
                    icon={faSignOutAlt}
                    className="w-5 text-center"
                  />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  className="flex items-center justify-center px-4 py-3 rounded-xl text-sm font-bold text-gray-400 bg-gray-800 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="flex items-center justify-center px-4 py-3 rounded-xl text-sm bg-blue-600 text-white font-black uppercase tracking-widest shadow-lg shadow-blue-900/20"
                >
                  Join
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
