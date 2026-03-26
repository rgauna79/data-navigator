import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileExcel,
  faDatabase,
  faChartBar,
  faArrowRight,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";

const FeatureCard = ({ to, icon, color, title, description, cta }) => (
  <Link
    to={to}
    className={`group flex flex-col gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${color}`}>
      <FontAwesomeIcon icon={icon} />
    </div>
    <div>
      <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
    <span className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 mt-auto group-hover:gap-2.5 transition-all">
      {cta} <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
    </span>
  </Link>
);

function HomePage() {
  const { user, isLoggedIn } = useAuth();

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-64px)]">
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isLoggedIn ? `Welcome back, ${user.username} 👋` : "Welcome to Data Navigator"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base">
            Upload Excel files, explore your data, and generate reports in seconds.
          </p>
        </div>

        {/* Quick action destacada */}
        <div className="bg-blue-600 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-white font-semibold text-lg mb-1">Upload an Excel file</h2>
            <p className="text-blue-100 text-sm">Read, filter, and explore any .xlsx file instantly</p>
          </div>
          <Link
            to="/filereader"
            className="flex items-center gap-2 bg-white text-blue-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            <FontAwesomeIcon icon={faUpload} />
            Open File Reader
          </Link>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <FeatureCard
            to="/filereader"
            icon={faFileExcel}
            color="bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
            title="Excel Reader"
            description="Load any .xlsx file, select sheets, filter columns and preview your data."
            cta="Open reader"
          />
          {isLoggedIn && (
            <FeatureCard
              to="/savedfiles"
              icon={faDatabase}
              color="bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400"
              title="Saved Files"
              description="Access files you've previously saved to the database."
              cta="View saved files"
            />
          )}
          <FeatureCard
            to="/reports"
            icon={faChartBar}
            color="bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400"
            title="Reports"
            description="Visualize your previously saved reports."
            cta="View reports"
          />
        </div>

        {/* CTA para usuarios no logueados */}
        {!isLoggedIn && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Save your work</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Create a free account to save files to the database and access them anytime.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Sign up free
              </Link>
              <Link
                to="/login"
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;