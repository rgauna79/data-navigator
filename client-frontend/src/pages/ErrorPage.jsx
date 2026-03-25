import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faHome } from "@fortawesome/free-solid-svg-icons";

function ErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 px-4 text-center min-h-[calc(100vh-128px)]">
      <p className="text-8xl font-bold text-gray-200 dark:text-gray-700 mb-2 select-none">
        404
      </p>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Page not found
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
          Go back
        </button>
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        >
          <FontAwesomeIcon icon={faHome} className="text-xs" />
          Home
        </Link>
      </div>
    </div>
  );
}

export default ErrorPage;