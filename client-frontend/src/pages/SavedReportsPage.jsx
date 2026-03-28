import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  faEye,
  faObjectGroup,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast"; // ✅ Importamos toast

const TYPE_META = {
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
  groupBy: {
    label: "Pivot Table",
    icon: faObjectGroup,
    color:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  },
};

function ReportCard({ report, onDelete, onView }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const meta = TYPE_META[report.type] || TYPE_META.statistics;

  const handleDelete = async () => {
    const toastId = toast.loading("Deleting report..."); // ✅ Toast de carga
    setDeleting(true);
    try {
      await onDelete(report._id);
      toast.success("Report deleted successfully", { id: toastId }); // ✅ Toast de éxito
    } catch (error) {
      toast.error("Failed to delete report", { id: toastId }); // ✅ Toast de error
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-sm transition-all">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex-shrink-0 ${meta.color}`}
          >
            <FontAwesomeIcon icon={meta.icon} className="text-xs" />
            {meta.label}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {report.name}
            </p>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
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
            onClick={() => onView(report)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="View report"
          >
            <FontAwesomeIcon icon={faEye} className="text-xs" />
          </button>
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
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
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
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-700/30 space-y-3">
          {report.selectedColumns?.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                Columns Analyzed
              </p>
              <div className="flex flex-wrap gap-1.5">
                {report.selectedColumns.map((col) => (
                  <span
                    key={col}
                    className="text-xs font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-2.5 py-0.5 rounded-md shadow-sm"
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
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                  Filters & Config
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(report.selectedOptions).map(([k, v]) => (
                    <span
                      key={k}
                      className="text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 px-2.5 py-0.5 rounded-md shadow-sm"
                    >
                      <strong className="opacity-70 mr-1">{k}:</strong>{" "}
                      {typeof v === "object" ? JSON.stringify(v) : v}
                    </span>
                  ))}
                </div>
              </div>
            )}
          <button
            onClick={() => onView(report)}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold mt-2 flex items-center gap-1"
          >
            Open in Chart Viewer →
          </button>
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
    setSelectedOptions,
    setTypeReport,
    setSelectedColumns,
    data,
  } = useDataContext();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSavedReports();
  }, []);

  const handleViewReport = (report) => {
    setSelectedOptions(report.selectedOptions || {});
    setTypeReport(report.type);
    setSelectedColumns(report.selectedColumns || []);

    if (!data || data.length === 0) {
      toast.error(`Please load the sheet "${report.sheetName}" first.`);
      navigate("/filereader");
      return;
    }
    navigate("/charts");
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
            <FontAwesomeIcon icon={faClockRotateLeft} className="text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              My Reports
            </h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Your saved configurations
              {savedReports.length > 0 && ` · ${savedReports.length} total`}
            </p>
          </div>
        </div>

        {isLoadingReports && (
          <div className="flex justify-center py-16 text-blue-500">
            <FontAwesomeIcon icon={faSpinner} spin className="text-3xl" />
          </div>
        )}

        {reportError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-bold px-4 py-3 rounded-xl mb-4">
            {reportError}
          </div>
        )}

        {!isLoadingReports && !reportError && savedReports.length === 0 && (
          <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2rem] p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <FontAwesomeIcon icon={faChartBar} className="text-2xl" />
            </div>
            <p className="text-gray-900 dark:text-white font-bold text-lg mb-1">
              No saved reports
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Generate your first report from the Data Reader and save it.
            </p>
          </div>
        )}

        {!isLoadingReports && savedReports.length > 0 && (
          <div className="space-y-3">
            {savedReports.map((report) => (
              <ReportCard
                key={report._id}
                report={report}
                onDelete={deleteReport}
                onView={handleViewReport}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SavedReportsPage;
