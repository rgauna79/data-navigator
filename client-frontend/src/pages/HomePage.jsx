import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDataContext } from "../context/DataContext.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileExcel,
  faDatabase,
  faChartBar,
  faArrowRight,
  faUpload,
  faCodeCompare,
  faSpinner,
  faChartPie,
  faLayerGroup,
  faTableList,
  faClockRotateLeft,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { HomeFileIndicator } from "../components/ui/FileIndicator.jsx";
import { getSavedFile, listSavedFiles } from "../api/data.js";
import { getReport, listReports } from "../api/reports.js";
import { useOpenInReader } from "../hooks/useOpenInReader.js";
import { fileFromRows } from "../utils/fileFromRows.js";
import { sampleFile } from "../utils/sampleData.js";
import { tk, useI18n } from "../i18n/I18nContext.jsx";
import toast from "react-hot-toast";

const REPORT_LABELS = {
  statistics: tk("Statistics"),
  mostRepeated: tk("Most repeated"),
  group: tk("Group & summarize"),
  groupBy: tk("Pivot table"),
};
const REPORT_ICONS = { statistics: faChartBar, mostRepeated: faChartPie, group: faLayerGroup, groupBy: faLayerGroup };

const FeatureCard = ({ to, icon, color, title, description, cta }) => (
  <Link
    to={to}
    className="group flex flex-col gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${color}`}>
      <FontAwesomeIcon icon={icon} />
    </div>
    <div>
      <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
    <span className="flex items-center gap-1.5 text-sm font-bold text-blue-600 dark:text-blue-400 mt-auto group-hover:gap-2.5 transition-all">
      {cta} <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
    </span>
  </Link>
);

// Cifra del panel (archivos, filas, informes...)
const Stat = ({ icon, color, label, value, loading }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-xs flex items-center gap-3 min-w-0">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <FontAwesomeIcon icon={icon} />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">{label}</p>
      <p className="text-xl font-black text-gray-900 dark:text-white truncate">
        {loading ? <FontAwesomeIcon icon={faSpinner} spin className="text-base text-gray-400" /> : value}
      </p>
    </div>
  </div>
);

const listRow =
  "group w-full text-left flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent hover:border-gray-100 dark:hover:border-gray-600 transition-all disabled:opacity-60";

function HomePage() {
  const { user, isLoggedIn } = useAuth();
  const { setReport } = useDataContext();
  const { t, tn, lang, fmtNumber, fmtDate } = useI18n();
  const navigate = useNavigate();
  const openInReader = useOpenInReader();
  const [files, setFiles] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openingId, setOpeningId] = useState(null);

  const username = user?.username;

  useEffect(() => {
    if (!isLoggedIn) return;
    toast(t("Welcome back, {name}!", { name: username }), { icon: "👋", id: "welcome-toast" });

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [filesRes, reportsRes] = await Promise.all([listSavedFiles(), listReports()]);
        if (cancelled) return;
        // Las listas vienen ordenadas de la más reciente a la más antigua
        setFiles(filesRes.data);
        setReports(reportsRes.data);
      } catch (error) {
        console.error("Dashboard error:", error);
        if (!cancelled) toast.error(t("Failed to load your recent activity"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // t cambia con el idioma; no hace falta recargar los datos por eso
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, username]);

  const openSavedFile = async (file) => {
    setOpeningId(file._id);
    try {
      const res = await getSavedFile(file._id);
      await openInReader(fileFromRows(res.data.sheetName, res.data.fileData));
    } catch {
      toast.error(t("Could not open the file."));
      setOpeningId(null);
    }
  };

  const openReport = async (report) => {
    setOpeningId(report._id);
    try {
      const { data: full } = await getReport(report._id);
      if (!full.snapshot?.data) {
        toast.error(t("This report was saved without its data. Generate it again from the Reader."));
        setOpeningId(null);
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
    } catch {
      toast.error(t("Could not open the report."));
      setOpeningId(null);
    }
  };

  const trySample = () => openInReader(sampleFile(lang));

  const totalRows = files.reduce((n, f) => n + (f.rowCount || 0), 0);
  const lastActivity = [files[0]?.updatedAt, reports[0]?.updatedAt].filter(Boolean).sort().at(-1);
  const recentFiles = files.slice(0, 4);
  const recentReports = reports.slice(0, 4);

  const sampleButton = (className) => (
    <button
      onClick={trySample}
      className={`flex items-center gap-2 font-bold text-sm px-5 py-3 rounded-xl transition-all whitespace-nowrap ${className}`}
    >
      <FontAwesomeIcon icon={faWandMagicSparkles} /> {t("Try sample data")}
    </button>
  );

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <HomeFileIndicator />

        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
            {isLoggedIn ? t("Dashboard Overview") : t("Welcome to Data Navigator")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base font-medium">
            {isLoggedIn
              ? t("Pick up where you left off with your recent files and reports.")
              : t("Upload Excel files, explore your data, and generate reports in seconds.")}
          </p>
        </div>

        {isLoggedIn ? (
          <>
            {/* Cifras */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Stat icon={faDatabase} color="bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300"
                label={t("Saved files")} value={fmtNumber(files.length)} loading={loading} />
              <Stat icon={faTableList} color="bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300"
                label={t("Rows stored")} value={fmtNumber(totalRows)} loading={loading} />
              <Stat icon={faChartPie} color="bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300"
                label={t("Saved reports")} value={fmtNumber(reports.length)} loading={loading} />
              <Stat icon={faClockRotateLeft} color="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300"
                label={t("Last activity")} value={lastActivity ? fmtDate(lastActivity) : "—"} loading={loading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
              {/* Archivos recientes */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
                  <h2 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <FontAwesomeIcon icon={faDatabase} className="text-purple-500" /> {t("Recent Files")}
                  </h2>
                  <Link to="/savedfiles" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                    {t("View All")}
                  </Link>
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  {loading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400 py-6">
                      <FontAwesomeIcon icon={faSpinner} spin className="text-2xl" />
                    </div>
                  ) : recentFiles.length > 0 ? (
                    recentFiles.map((file) => (
                      <button
                        key={file._id}
                        onClick={() => openSavedFile(file)}
                        disabled={openingId !== null}
                        title={t("Open in the Reader to analyze, clean and create reports")}
                        className={listRow}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center font-black text-xs shrink-0">
                            XL
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{file.sheetName}</p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                              {tn("{count} row", "{count} rows", file.rowCount ?? 0)} · {fmtDate(file.updatedAt)}
                            </p>
                          </div>
                        </div>
                        <FontAwesomeIcon
                          icon={openingId === file._id ? faSpinner : faArrowRight}
                          spin={openingId === file._id}
                          className="text-gray-300 group-hover:text-blue-500 transition-colors shrink-0"
                        />
                      </button>
                    ))
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t("No saved files yet.")}</p>
                      <Link to="/filereader" className="text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-4 py-2 rounded-lg">
                        {t("Upload your first Excel")}
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Informes recientes */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col">
                <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-700 pb-3">
                  <h2 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <FontAwesomeIcon icon={faChartPie} className="text-orange-500" /> {t("Recent Reports")}
                  </h2>
                  <Link to="/reports" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                    {t("View All")}
                  </Link>
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  {loading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400 py-6">
                      <FontAwesomeIcon icon={faSpinner} spin className="text-2xl" />
                    </div>
                  ) : recentReports.length > 0 ? (
                    recentReports.map((report) => (
                      <button
                        key={report._id}
                        onClick={() => openReport(report)}
                        disabled={openingId !== null}
                        className={listRow}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs shrink-0">
                            <FontAwesomeIcon icon={REPORT_ICONS[report.type] || faChartBar} />
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{report.name}</p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                              {t(REPORT_LABELS[report.type] || report.type)} · {fmtDate(report.updatedAt)}
                            </p>
                          </div>
                        </div>
                        <FontAwesomeIcon
                          icon={openingId === report._id ? faSpinner : faArrowRight}
                          spin={openingId === report._id}
                          className="text-gray-300 group-hover:text-blue-500 transition-colors shrink-0"
                        />
                      </button>
                    ))
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t("No saved reports yet.")}</p>
                      <span className="text-xs font-bold bg-gray-50 dark:bg-gray-700 text-gray-400 px-4 py-2 rounded-lg">
                        {t("Generate reports from the Reader")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Acción rápida */}
            <div className="bg-blue-600 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-blue-200 dark:shadow-none">
              <div>
                <h2 className="text-white font-black text-xl mb-1">{t("Ready to analyze new data?")}</h2>
                <p className="text-blue-100 text-sm font-medium">
                  {t("Head over to the File Reader to upload, filter, and extract insights.")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/filereader"
                  className="flex items-center gap-2 bg-white text-blue-600 font-bold text-sm px-5 py-3 rounded-xl hover:scale-95 transition-transform whitespace-nowrap shadow-xs"
                >
                  <FontAwesomeIcon icon={faUpload} /> {t("Open File Reader")}
                </Link>
                {sampleButton("bg-blue-500 hover:bg-blue-400 text-white")}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-blue-600 rounded-3xl p-8 mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl shadow-blue-200 dark:shadow-none">
              <div className="flex-1">
                <h2 className="text-white font-black text-2xl mb-2">{t("Upload an Excel file")}</h2>
                <p className="text-blue-100 text-sm font-medium max-w-md">
                  {t("Read, filter, and explore Excel, OpenDocument and CSV files instantly, directly in your browser without uploading them to a server.")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/filereader"
                  className="flex items-center gap-2 bg-white text-blue-600 font-black text-sm px-6 py-3.5 rounded-xl hover:scale-95 transition-transform whitespace-nowrap shadow-xs"
                >
                  <FontAwesomeIcon icon={faUpload} /> {t("Open File Reader")}
                </Link>
                {sampleButton("bg-blue-500 hover:bg-blue-400 text-white py-3.5")}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
              <FeatureCard
                to="/filereader"
                icon={faFileExcel}
                color="bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
                title={t("Excel Reader")}
                description={t("Load Excel, OpenDocument or CSV files, select sheets, filter columns and clean your data.")}
                cta={t("Open reader")}
              />
              <FeatureCard
                to="/compare"
                icon={faCodeCompare}
                color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
                title={t("Data Auditor")}
                description={t("Compare spreadsheets and automatically detect discrepancies.")}
                cta={t("Compare data")}
              />
              <FeatureCard
                to="/charts"
                icon={faChartBar}
                color="bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400"
                title={t("Dynamic Reports")}
                description={t("Statistics, top values and group & summarize reports with charts, exportable to PDF.")}
                cta={t("View reports")}
              />
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
              <div className="flex-1">
                <h3 className="font-black text-xl text-gray-900 dark:text-white mb-2">{t("Save your work securely")}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium max-w-md">
                  {t("Create a free account to save files to the database, store your custom reports, and access them anytime.")}
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-xs"
                >
                  {t("Sign up free")}
                </Link>
                <Link
                  to="/login"
                  className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95"
                >
                  {t("Sign in")}
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
