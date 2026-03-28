import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileExcel,
  faDatabase,
  faChartBar,
  faArrowRight,
  faUpload,
  faClockRotateLeft,
  faSpinner,
  faChartPie,
} from "@fortawesome/free-solid-svg-icons";
import { HomeFileIndicator } from "../components/ui/FileIndicator.jsx";
import axios from "../api/axios";
import toast from "react-hot-toast";

const FeatureCard = ({ to, icon, color, title, description, cta }) => (
  <Link
    to={to}
    className="group flex flex-col gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
  >
    <div
      className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${color}`}
    >
      <FontAwesomeIcon icon={icon} />
    </div>
    <div>
      <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
        {description}
      </p>
    </div>
    <span className="flex items-center gap-1.5 text-sm font-bold text-blue-600 dark:text-blue-400 mt-auto group-hover:gap-2.5 transition-all">
      {cta} <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
    </span>
  </Link>
);

function HomePage() {
  const { user, isLoggedIn } = useAuth();
  const [recentFiles, setRecentFiles] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      toast(`Welcome back, ${user.username}!`, {
        icon: "👋",
        id: "welcome-toast",
      });
      fetchDashboardData();
    }
  }, [isLoggedIn, user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [filesRes, reportsRes] = await Promise.all([
        axios.get("/data/savedfiles"),
        axios.get("/reports"),
      ]);

      const files = Array.isArray(filesRes.data?.data)
        ? filesRes.data.data
        : [];
      setRecentFiles(files.slice(0, 3)); // Tomamos solo los 3 más recientes
      setRecentReports(reportsRes.data.slice(0, 3));
    } catch (error) {
      console.error("Dashboard error:", error);
      toast.error("Failed to load your recent activity");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 ">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Componente opcional que tenías antes */}
        <HomeFileIndicator />

        <div className="mb-10">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
            {isLoggedIn ? "Dashboard Overview" : "Welcome to Data Navigator"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base font-medium">
            {isLoggedIn
              ? "Pick up where you left off with your recent files and reports."
              : "Upload Excel files, explore your data, and generate reports in seconds."}
          </p>
        </div>

        {/* --- VISTA PARA USUARIO LOGUEADO (DASHBOARD) --- */}
        {isLoggedIn ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
              {/* Tarjeta: Archivos Recientes */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
                  <h2 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faDatabase}
                      className="text-purple-500"
                    />{" "}
                    Recent Files
                  </h2>
                  <Link
                    to="/savedfiles"
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    View All
                  </Link>
                </div>

                <div className="flex-1 flex flex-col gap-3">
                  {loading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                      <FontAwesomeIcon
                        icon={faSpinner}
                        spin
                        className="text-2xl"
                      />
                    </div>
                  ) : recentFiles.length > 0 ? (
                    recentFiles.map((file) => (
                      <Link
                        key={file._id}
                        to="/savedfiles"
                        className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent hover:border-gray-100 dark:hover:border-gray-600 transition-all"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center font-black text-xs shrink-0">
                            XL
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              {file.sheetName}
                            </p>
                            <p className="text-[10px] text-gray-500 font-medium">
                              {formatDate(file.updatedAt)}
                            </p>
                          </div>
                        </div>
                        <FontAwesomeIcon
                          icon={faArrowRight}
                          className="text-gray-300 group-hover:text-blue-500 transition-colors shrink-0"
                        />
                      </Link>
                    ))
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                      <p className="text-sm text-gray-500 mb-3">
                        No saved files yet.
                      </p>
                      <Link
                        to="/filereader"
                        className="text-xs font-bold bg-blue-50 text-blue-600 px-4 py-2 rounded-lg"
                      >
                        Upload your first Excel
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Tarjeta: Reportes Recientes */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
                  <h2 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faChartPie}
                      className="text-orange-500"
                    />{" "}
                    Recent Reports
                  </h2>
                  <Link
                    to="/reports"
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    View All
                  </Link>
                </div>

                <div className="flex-1 flex flex-col gap-3">
                  {loading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                      <FontAwesomeIcon
                        icon={faSpinner}
                        spin
                        className="text-2xl"
                      />
                    </div>
                  ) : recentReports.length > 0 ? (
                    recentReports.map((report) => (
                      <Link
                        key={report._id}
                        to="/reports"
                        className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent hover:border-gray-100 dark:hover:border-gray-600 transition-all"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-black text-xs shrink-0">
                            <FontAwesomeIcon
                              icon={
                                report.type === "statistics"
                                  ? faChartBar
                                  : faChartPie
                              }
                            />
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              {report.name}
                            </p>
                            <p className="text-[10px] text-gray-500 font-medium capitalize">
                              {report.type} · {formatDate(report.updatedAt)}
                            </p>
                          </div>
                        </div>
                        <FontAwesomeIcon
                          icon={faArrowRight}
                          className="text-gray-300 group-hover:text-blue-500 transition-colors shrink-0"
                        />
                      </Link>
                    ))
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                      <p className="text-sm text-gray-500 mb-3">
                        No saved reports yet.
                      </p>
                      <span className="text-xs font-bold bg-gray-50 text-gray-400 px-4 py-2 rounded-lg">
                        Generate reports from the Reader
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Destacada para usuarios */}
            <div className="bg-blue-600 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-blue-200 dark:shadow-none">
              <div>
                <h2 className="text-white font-black text-xl mb-1">
                  Ready to analyze new data?
                </h2>
                <p className="text-blue-100 text-sm font-medium">
                  Head over to the File Reader to upload, filter, and extract
                  insights.
                </p>
              </div>
              <Link
                to="/filereader"
                className="flex items-center gap-2 bg-white text-blue-600 font-bold text-sm px-6 py-3 rounded-xl hover:scale-95 transition-transform whitespace-nowrap shadow-sm"
              >
                <FontAwesomeIcon icon={faUpload} /> Open File Reader
              </Link>
            </div>
          </>
        ) : (
          /* --- VISTA PARA USUARIO NO LOGUEADO (LANDING) --- */
          <>
            <div className="bg-blue-600 rounded-3xl p-8 mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl shadow-blue-200 dark:shadow-none">
              <div className="flex-1">
                <h2 className="text-white font-black text-2xl mb-2">
                  Upload an Excel file
                </h2>
                <p className="text-blue-100 text-sm font-medium max-w-md">
                  Read, filter, and explore any .xlsx or .csv file instantly
                  directly in your browser without uploading to a server.
                </p>
              </div>
              <Link
                to="/filereader"
                className="flex items-center gap-2 bg-white text-blue-600 font-black text-sm px-6 py-3.5 rounded-xl hover:scale-95 transition-transform whitespace-nowrap shadow-sm"
              >
                <FontAwesomeIcon icon={faUpload} /> Open File Reader
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
              <FeatureCard
                to="/filereader"
                icon={faFileExcel}
                color="bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
                title="Excel Reader"
                description="Load any .xlsx file, select sheets, filter columns and preview your data."
                cta="Open reader"
              />
              <FeatureCard
                to="/compare"
                icon={faClockRotateLeft}
                color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
                title="Data Auditor"
                description="Compare spreadsheets and automatically detect discrepancies."
                cta="Compare data"
              />
              <FeatureCard
                to="/charts"
                icon={faChartBar}
                color="bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400"
                title="Dynamic Reports"
                description="Generate Pivot tables, pie charts, and export them directly to PDF."
                cta="View reports"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
              <div className="flex-1">
                <h3 className="font-black text-xl text-gray-900 dark:text-white mb-2">
                  Save your work securely
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium max-w-md">
                  Create a free account to save files to the database, store
                  your custom reports, and access them anytime.
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-sm"
                >
                  Sign up free
                </Link>
                <Link
                  to="/login"
                  className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default HomePage;
