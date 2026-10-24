import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendDown, faArrowTrendUp, faChevronDown, faClone, faCrown, faFont,
  faLightbulb, faSquare, faTriangleExclamation, faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import { useExcelContext } from "../context/ExcelContext.jsx";
import { useI18n } from "../i18n/I18nContext.jsx";
import { generateInsights } from "../utils/insights.js";
import { blankRows, duplicateRows, unifyTextChanges } from "../utils/cleanup.js";
import { isOutlier, numericProfile } from "../utils/columnProfile.js";
import { dataRows, getHeaders, parseDate, toNumber } from "../utils/excelUtils.js";
import { formatPeriodLabel, periodOf } from "../utils/reportUtils.js";
import DrillDownModal from "./reports/DrillDownModal.jsx";

const TONES = {
  good: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
  bad: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
  info: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
  warn: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
};

// Filas de un mes ("2024-03") según una columna de fecha
const monthRows = (rows, col, key, dateOrder) =>
  rows.filter((row) => {
    const d = parseDate(row[col], dateOrder);
    return d && periodOf(d, "month").key === key;
  });

// Conclusiones automáticas de la hoja abierta: lo más destacado y los
// problemas de calidad, cada uno con un botón para ver las filas o arreglarlo.
function InsightsPanel({ fileData, analysis, columnTypes }) {
  const { t, tn, fmtNumber, locale } = useI18n();
  const { applyChanges } = useExcelContext();
  const [expanded, setExpanded] = useState(true);
  const [drill, setDrill] = useState(null);

  const insights = useMemo(() => generateInsights(fileData, analysis), [fileData, analysis]);
  const rows = useMemo(() => dataRows(fileData), [fileData]);
  const headers = useMemo(() => getHeaders(fileData), [fileData]);

  if (insights.length === 0) return null;

  const fmt = (n) => fmtNumber(n, { maximumFractionDigits: 2 });
  const pct = (n) => fmtNumber(n, { maximumFractionDigits: 1 });
  const month = (key) => formatPeriodLabel(key, "month", locale, t);
  const show = (title, subset) => setDrill({ title, rows: subset });
  const done = (message) => toast.success(`${message} ${t("Use Undo edit to revert it.")}`);

  // Texto, icono y acción de cada conclusión
  const describe = (item) => {
    const measure = item.measure ?? t("The number of rows");
    switch (item.kind) {
      case "trend": {
        const up = item.change >= 0;
        const vars = { measure, change: `${pct(Math.abs(item.change))}%`, last: month(item.last), previous: month(item.previous) };
        return {
          icon: up ? faArrowTrendUp : faArrowTrendDown,
          tone: up ? "good" : "bad",
          text: up
            ? t("{measure} went up {change} in {last} compared with {previous}.", vars)
            : t("{measure} went down {change} in {last} compared with {previous}.", vars),
          action: t("See rows of {month}", { month: month(item.last) }),
          run: () =>
            show(month(item.last), monthRows(rows, item.dateCol, item.last, columnTypes[item.dateCol]?.dateOrder)),
        };
      }
      case "peak":
        return {
          icon: faTrophy,
          tone: "info",
          text: item.measure
            ? t("Best month for {measure}: {period}, with {value}.", { measure, period: month(item.period), value: fmt(item.value) })
            : t("Busiest month: {period}, with {value} rows.", { period: month(item.period), value: fmt(item.value) }),
          action: t("See rows"),
          run: () =>
            show(month(item.period), monthRows(rows, item.dateCol, item.period, columnTypes[item.dateCol]?.dateOrder)),
        };
      case "share":
        return {
          icon: faCrown,
          tone: "info",
          text: item.measure
            ? t("{value} brings {share}% of {measure} ({column}).", { value: item.value, share: pct(item.share), measure, column: item.column })
            : t("{value} appears in {share}% of the rows ({column}).", { value: item.value, share: pct(item.share), column: item.column }),
          action: t("See rows"),
          run: () => show(`${item.column}: ${item.value}`, rows.filter((row) => String(row[item.col]) === String(item.value))),
        };
      case "duplicates":
        return {
          icon: faClone,
          tone: "warn",
          text: tn("{count} row is an exact copy of another one.", "{count} rows are exact copies of others.", item.count),
          action: t("Remove duplicates"),
          run: () => {
            const dupes = duplicateRows(fileData);
            applyChanges([], dupes);
            done(tn("{count} duplicate row removed.", "{count} duplicate rows removed.", dupes.length));
          },
        };
      case "variants":
        return {
          icon: faFont,
          tone: "warn",
          text: tn(
            "{column}: {count} value is written in different ways, e.g. {example}.",
            "{column}: {count} values are written in different ways, e.g. {example}.",
            item.groups,
            { column: item.column, example: item.example }
          ),
          action: t("Unify"),
          run: () => {
            const changes = unifyTextChanges(fileData, item.col);
            applyChanges(changes);
            done(tn("{count} cell unified.", "{count} cells unified.", changes.length));
          },
        };
      case "outliers":
        return {
          icon: faTriangleExclamation,
          tone: "warn",
          text: tn(
            "{column} has {count} unusual value, far from the rest.",
            "{column} has {count} unusual values, far from the rest.",
            item.count,
            { column: item.column }
          ),
          action: t("See them"),
          run: () => {
            const decimal = columnTypes[item.col]?.decimal;
            const values = rows.map((row) => toNumber(row[item.col], decimal)).filter((n) => !isNaN(n));
            const profile = numericProfile(values);
            show(
              t("Unusual values of {column}", { column: item.column }),
              rows.filter((row) => {
                const n = toNumber(row[item.col], decimal);
                return !isNaN(n) && isOutlier(n, profile);
              })
            );
          },
        };
      case "blanks":
        return {
          icon: faSquare,
          tone: "warn",
          text: tn(
            "{column} is empty in {count} row ({share}%).",
            "{column} is empty in {count} rows ({share}%).",
            item.count,
            { column: item.column, share: pct(item.share) }
          ),
          action: t("See them"),
          run: () =>
            show(t("Empty {column}", { column: item.column }), blankRows(fileData, item.col).map((i) => fileData[i])),
        };
      default:
        return null;
    }
  };

  return (
    <section className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xs">
      {drill && (
        <DrillDownModal
          title={drill.title}
          headers={headers}
          rows={drill.rows}
          columnTypes={columnTypes}
          onClose={() => setDrill(null)}
        />
      )}
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between gap-3 px-4 py-3"
      >
        <span className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
            <FontAwesomeIcon icon={faLightbulb} />
          </span>
          <span className="text-left">
            <span className="block text-sm font-black text-gray-900 dark:text-white">{t("Key findings")}</span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              {tn("{count} thing worth a look in this sheet", "{count} things worth a look in this sheet", insights.length)}
            </span>
          </span>
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-xs text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 px-4 pb-4">
          {insights.map((item, i) => {
            const info = describe(item);
            if (!info) return null;
            return (
              <li
                key={`${item.kind}-${i}`}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700"
              >
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${TONES[info.tone]}`}>
                  <FontAwesomeIcon icon={info.icon} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-200">{info.text}</p>
                  <button
                    onClick={info.run}
                    className="mt-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {info.action}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default InsightsPanel;
