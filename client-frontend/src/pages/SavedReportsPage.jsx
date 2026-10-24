import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useDataContext } from "../context/DataContext";
import { deleteReport, getReport, listReports } from "../api/reports.js";
import { describeFilter } from "../utils/reportUtils.js";
import { tk, useI18n } from "../i18n/I18nContext.jsx";
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
  faLayerGroup,
  faTableCells,
} from "@fortawesome/free-solid-svg-icons";

const TYPE_META = {
  statistics: {
    label: tk("Statistics"),
    icon: faChartBar,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  mostRepeated: {
    label: tk("Most repeated"),
    icon: faChartPie,
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  },
  group: {
    label: tk("Group & summarize"),
    icon: faLayerGroup,
    color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  },
  pivot: {
    label: tk("Pivot table"),
    icon: faTableCells,
    color: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  },
};
// Informes de agrupación de la versión anterior
TYPE_META.groupBy = TYPE_META.group;


function ReportCard({ report, isOpening, onDelete, onView }) {
  const { t, fmtDate, locale } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const meta = TYPE_META[report.type] || TYPE_META.statistics;
  const options = Object.entries(report.selectedOptions || {});
  const columnName = (idx) => report.snapshot?.headers?.[idx] ?? t("Column {n}", { n: Number(idx) + 1 });

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(report);
    setDeleting(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-xs transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ${meta.color}`}
          >
            <FontAwesomeIcon icon={meta.icon} className="text-xs" />
            {t(meta.label)}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{report.name}</p>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
              {report.sheetName ? `${report.sheetName} · ` : ""}
              {fmtDate(report.createdAt)}
            </p>
          </div>
        </div>
        {confirmDelete ? (
          <div className="flex items-center gap-2 text-sm shrink-0">
            <span className="text-gray-600 dark:text-gray-300">{t("Delete this report?")}</span>
            <button
              disabled={deleting}
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold"
            >
              {deleting && <FontAwesomeIcon icon={faSpinner} spin />} {t("Delete")}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold"
            >
              {t("Cancel")}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onView(report)}
              disabled={isOpening}
              className="flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white mr-1"
              title={t("Open report")}
            >
              <FontAwesomeIcon icon={isOpening ? faSpinner : faEye} spin={isOpening} className="text-xs" /> {t("Open")}
            </button>
            <button
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? t("Hide details") : t("Show details")}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} className="text-xs" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              aria-label={`Delete ${report.name}`}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <FontAwesomeIcon icon={faTrash} className="text-xs" />
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-700/30 space-y-3">
          {options.length > 0 ? (
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                {t("Filters & config")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {options.map(([k, v]) => (
                  <span
                    key={k}
                    className="text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 px-2.5 py-0.5 rounded-md shadow-xs"
                  >
                    {/* Las opciones se guardan por índice de columna */}
                    <strong className="opacity-70 mr-1">{k === "mostRepeated" ? "Column" : columnName(k)}:</strong>
                    {k === "mostRepeated" ? columnName(v) : describeFilter(v, locale)}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("No filters.")}</p>
          )}
        </div>
      )}
    </div>
  );
}

function SavedReportsPage() {
  const { setReport } = useDataContext();
  const { t, tServer, fmtNumber } = useI18n();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [openingId, setOpeningId] = useState(null);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await listReports();
      setReports(res.data);
    } catch (err) {
      setError(tServer(err.response?.data?.message, "Could not load your reports."));
    } finally {
      setIsLoading(false);
    }
  }, [tServer]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Abre el informe con los datos que se guardaron con él
  const handleView = async (report) => {
    setOpeningId(report._id);
    try {
      const { data: full } = await getReport(report._id);
      if (!full.snapshot?.data) {
        toast.error(t("This report was saved without its data. Generate it again from the Reader."));
        return;
      }
      setReport({
        typeReport: full.type === "groupBy" ? "group" : full.type,
        selectedOptions: full.selectedOptions || {},
        config: full.snapshot.config ?? null,
        data: full.snapshot.data,
        headers: full.snapshot.headers,
        columnTypes: full.snapshot.columnTypes ?? null,
        sheetName: full.sheetName,
      });
      navigate("/charts");
    } catch (err) {
      toast.error(tServer(err.response?.data?.message, "Could not open the report."));
    } finally {
      setOpeningId(null);
    }
  };

  const handleDelete = async (report) => {
    try {
      await deleteReport(report._id);
      setReports((prev) => prev.filter((r) => r._id !== report._id));
      toast.success(t("Report deleted"));
    } catch (err) {
      toast.error(tServer(err.response?.data?.message, "Could not delete the report."));
    }
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
            <FontAwesomeIcon icon={faClockRotateLeft} className="text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{t("My Reports")}</h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t("Your saved reports")}
              {reports.length > 0 && ` · ${t("{count} total", { count: fmtNumber(reports.length) })}`}
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16 text-blue-500">
            <FontAwesomeIcon icon={faSpinner} spin className="text-3xl" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm font-bold px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {!isLoading && !error && reports.length === 0 && (
          <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-4xl p-16 text-center shadow-xs">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <FontAwesomeIcon icon={faChartBar} className="text-2xl" />
            </div>
            <p className="text-gray-900 dark:text-white font-bold text-lg mb-1">{t("No saved reports")}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              {t("Generate a report from the")}{" "}
              <Link to="/filereader" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                {t("Reader")}
              </Link>{" "}
              {t('and click "Save report".')}
            </p>
          </div>
        )}

        {!isLoading && reports.length > 0 && (
          <div className="space-y-3">
            {reports.map((report) => (
              <ReportCard
                key={report._id}
                report={report}
                isOpening={openingId === report._id}
                onDelete={handleDelete}
                onView={handleView}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SavedReportsPage;
