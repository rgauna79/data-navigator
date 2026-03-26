import React, { useEffect, useState } from "react";
import { useDataContext } from "../context/DataContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faTrash,
  faChartBar,
  faChartPie,
  faClockRotateLeft,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

const TYPE_LABELS = {
  statistics: {
    label: "Statistics",
    icon: faChartBar,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  mostRepeated: {
    label: "Most Repeated",
    icon: faChartPie,
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  },
};

function ReportCard({ report, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const meta = TYPE_LABELS[report.type] || TYPE_LABELS.statistics;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(report._id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${meta.color}`}
          >
            <FontAwesomeIcon icon={meta.icon} className="text-xs" />
            {meta.label}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {report.name}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {report.sheetName} ·{" "}
              {new Date(report.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FontAwesomeIcon
              icon={expanded ? faChevronUp : faChevronDown}
              className="text-xs"
            />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
          >
            <FontAwesomeIcon
              icon={deleting ? faSpinner : faTrash}
              spin={deleting}
              className="text-xs"
            />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-700/30 space-y-2">
          {report.selectedColumns?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                Columns
              </p>
              <div className="flex flex-wrap gap-1">
                {report.selectedColumns.map((col) => (
                  <span
                    key={col}
                    className="text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}
          {report.selectedOptions &&
            Object.keys(report.selectedOptions).length > 0 && (
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                  Filters
                </p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(report.selectedOptions).map(([k, v]) => (
                    <span
                      key={k}
                      className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 px-2 py-0.5 rounded-full"
                    >
                      {k}: {typeof v === "object" ? JSON.stringify(v) : v}
                    </span>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

function SavedReportsPage() {
  const {
    savedReports,
    isLoadingReports,
    reportError,
    fetchSavedReports,
    deleteReport,
  } = useDataContext();

  useEffect(() => {
    fetchSavedReports();
  }, []);

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-64px)]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FontAwesomeIcon icon={faClockRotateLeft} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Saved Reports
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your generated reports history
            </p>
          </div>
        </div>

        {isLoadingReports && (
          <div className="flex justify-center py-12 text-gray-400">
            <FontAwesomeIcon icon={faSpinner} spin className="text-2xl" />
          </div>
        )}

        {reportError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-xl mb-4">
            {reportError}
          </div>
        )}

        {!isLoadingReports && !reportError && savedReports.length === 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
            <FontAwesomeIcon
              icon={faChartBar}
              className="text-4xl text-gray-300 dark:text-gray-600 mb-4"
            />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No saved reports yet. Generate a report from the File Reader and
              save it.
            </p>
          </div>
        )}

        {!isLoadingReports && savedReports.length > 0 && (
          <div className="space-y-2">
            {savedReports.map((report) => (
              <ReportCard
                key={report._id}
                report={report}
                onDelete={deleteReport}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SavedReportsPage;
