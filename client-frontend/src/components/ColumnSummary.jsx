import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHashtag,
  faCalendar,
  faTag,
  faChevronDown,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import { tk, useI18n } from "../i18n/I18nContext.jsx";

// Números con hasta 2 decimales en el formato del idioma
const useFmt = () => {
  const { fmtNumber } = useI18n();
  return (n) => fmtNumber(n, { maximumFractionDigits: 2 });
};

const TYPE_LABELS = { numeric: tk("Number"), date: tk("Date"), text: tk("Text") };

// Clases completas (Tailwind solo genera las que aparecen literalmente en el código)
const ICON_STYLES = {
  blue: { box: "bg-blue-100 dark:bg-blue-900/40", icon: "text-blue-500" },
  purple: { box: "bg-purple-100 dark:bg-purple-900/40", icon: "text-purple-500" },
  amber: { box: "bg-amber-100 dark:bg-amber-900/40", icon: "text-amber-500" },
};

const selectClass =
  "text-[11px] bg-transparent border border-gray-200 dark:border-gray-600 rounded-sm px-1 py-0.5 text-gray-500 dark:text-gray-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500";

// Encabezado de tarjeta con el selector de tipo: "Auto" usa lo detectado y
// los demás valores fuerzan el tipo. En columnas de fecha también se elige
// el orden día/mes cuando la detección se equivoca (p. ej. 03/02/2024).
function CardHeader({ col, icon, color, badge, onChangeType }) {
  const { t } = useI18n();
  const current = col.overridden && col.type !== col.detected ? col.type : "";
  const typeValue = col.type === "categorical" ? "text" : col.type;
  const detected = col.detected === "categorical" ? "text" : col.detected;
  return (
    <div className="mb-3 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-6 h-6 rounded-md ${ICON_STYLES[color].box} flex items-center justify-center shrink-0`}>
            <FontAwesomeIcon icon={icon} className={`${ICON_STYLES[color].icon} text-xs`} />
          </span>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate" title={col.name}>
            {col.name}
          </span>
        </div>
        {badge}
      </div>
      {onChangeType && (
        <div className="flex flex-wrap gap-1">
          <select
            aria-label={t("{name} type", { name: col.name })}
            value={current && typeValue}
            onChange={(e) => onChangeType(col.index, { type: e.target.value })}
            className={selectClass}
          >
            <option value="">{t("Auto ({type})", { type: t(TYPE_LABELS[detected]) })}</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{t(label)}</option>
            ))}
          </select>
          {col.type === "numeric" && (
            <select
              aria-label={t("{name} number format", { name: col.name })}
              title={t("Decimal separator of this column")}
              value={col.decimal || "."}
              onChange={(e) => onChangeType(col.index, { decimal: e.target.value })}
              className={selectClass}
            >
              <option value=".">1,234.5</option>
              <option value=",">1.234,5</option>
            </select>
          )}
          {col.type === "date" && (
            <select
              aria-label={t("{name} date order", { name: col.name })}
              value={col.dateOrder}
              onChange={(e) => onChangeType(col.index, { dateOrder: e.target.value })}
              className={selectClass}
            >
              <option value="dmy">{t("Day/Month")}</option>
              <option value="mdy">{t("Month/Day")}</option>
            </select>
          )}
        </div>
      )}
    </div>
  );
}

function FillBadge({ col }) {
  const { t, fmtNumber } = useI18n();
  return (
    <span
      className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-sm shrink-0"
      title={t("Rows with a value in this column")}
    >
      {t("{rate}% fill", { rate: fmtNumber(Number(col.fillRate), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })}
    </span>
  );
}

function CardFooter({ col }) {
  const { tn } = useI18n();
  return (
    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 text-[11px]">
      <p className="text-gray-400 dark:text-gray-500 font-medium">
        {tn("{count} value", "{count} values", col.count)} · {tn("{count} unique", "{count} unique", col.unique)}
      </p>
      {col.invalid > 0 && (
        <p className="text-amber-600 dark:text-amber-400">
          {col.type === "date"
            ? tn("{count} value not read as a date", "{count} values not read as dates", col.invalid)
            : tn("{count} value not read as a number", "{count} values not read as numbers", col.invalid)}
        </p>
      )}
    </div>
  );
}

const cardClass = "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-xs";
const statBox = "bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2.5 py-1.5";
const statLabel = "text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase";
const statValue = "text-xs font-bold text-gray-800 dark:text-gray-100";

function NumericCard({ col, onChangeType }) {
  const { t } = useI18n();
  const fmt = useFmt();
  return (
    <div className={cardClass}>
      <CardHeader col={col} icon={faHashtag} color="blue" badge={<FillBadge col={col} />} onChangeType={onChangeType} />
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: t("Sum"), value: fmt(col.sum) },
          { label: t("Avg"), value: fmt(col.avg) },
          { label: t("Median"), value: fmt(col.median) },
          { label: t("Std dev"), value: fmt(col.stdDev) },
          { label: t("Min"), value: fmt(col.min) },
          { label: t("Max"), value: fmt(col.max) },
        ].map(({ label, value }) => (
          <div key={label} className={statBox}>
            <p className={statLabel}>{label}</p>
            <p className={statValue}>{value}</p>
          </div>
        ))}
      </div>
      <CardFooter col={col} />
    </div>
  );
}

function DateCard({ col, onChangeType }) {
  const { t, fmtDate } = useI18n();
  return (
    <div className={cardClass}>
      <CardHeader col={col} icon={faCalendar} color="purple" badge={<FillBadge col={col} />} onChangeType={onChangeType} />
      <div className="space-y-2">
        <div className={statBox}>
          <p className={statLabel}>{t("From")}</p>
          <p className={statValue}>{fmtDate(col.min)}</p>
        </div>
        <div className={statBox}>
          <p className={statLabel}>{t("To")}</p>
          <p className={statValue}>{fmtDate(col.max)}</p>
        </div>
      </div>
      <CardFooter col={col} />
    </div>
  );
}

function CategoricalCard({ col, onChangeType }) {
  const fmt = useFmt();
  const max = col.topValues?.[0]?.[1] || 1;
  return (
    <div className={cardClass}>
      <CardHeader col={col} icon={faTag} color="amber" badge={<FillBadge col={col} />} onChangeType={onChangeType} />
      <div className="space-y-1.5">
        {col.topValues?.map(([val, count]) => (
          <div key={val}>
            <div className="flex justify-between text-[11px] mb-0.5">
              <span className="text-gray-600 dark:text-gray-400 truncate max-w-[70%] font-medium">{val}</span>
              <span className="text-gray-900 dark:text-white font-bold">{fmt(count)}</span>
            </div>
            <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <CardFooter col={col} />
    </div>
  );
}

// analysis: resultado de analyzeColumns
// onChangeType(índice, { type?, dateOrder? }): corrige el tipo de una columna
function ColumnSummary({ analysis, onChangeType }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useI18n();

  if (!analysis || analysis.length === 0) return null;

  const numeric = analysis.filter((c) => c.type === "numeric");
  const dates = analysis.filter((c) => c.type === "date");
  const categorical = analysis.filter((c) => c.type === "categorical");

  return (
    <div className="w-full mt-6">
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className={`w-full flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border transition-all duration-300 ${
          expanded
            ? "bg-white dark:bg-gray-800 border-blue-500 shadow-lg shadow-blue-500/10"
            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 shadow-xs hover:shadow-md"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors ${
              expanded ? "bg-blue-600 text-white" : "bg-blue-50 dark:bg-blue-900/30 text-blue-600"
            }`}
          >
            <FontAwesomeIcon icon={faChartLine} />
          </div>

          <div className="text-left">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
              {t("Dataset Intelligence")}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t("{numeric} numeric · {dates} date · {categorical} categorical", {
                numeric: numeric.length,
                dates: dates.length,
                categorical: categorical.length,
              })}
            </p>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {numeric.length > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                  <FontAwesomeIcon icon={faHashtag} /> {t("NUMBERS")}
                </span>
              )}
              {dates.length > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/20 text-[10px] font-bold text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800">
                  <FontAwesomeIcon icon={faCalendar} /> {t("DATES")}
                </span>
              )}
              {categorical.length > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
                  <FontAwesomeIcon icon={faTag} /> {t("CATEGORIES")}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs font-bold text-gray-400 uppercase tracking-widest">
            {expanded ? t("Collapse") : t("Expand insights")}
          </span>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
              expanded
                ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-600 rotate-180"
                : "bg-gray-50 dark:bg-gray-700 border-gray-100 dark:border-gray-600 text-gray-400"
            }`}
          >
            <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
          </div>
        </div>
      </button>

      {expanded && (
        <>
          {onChangeType && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              {t("Wrong type? Change it on any card: tables, filters and reports use the corrected type.")}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mt-3">
            {analysis.map((col) =>
              col.type === "numeric" ? <NumericCard key={col.index} col={col} onChangeType={onChangeType} /> :
              col.type === "date"    ? <DateCard    key={col.index} col={col} onChangeType={onChangeType} /> :
                                       <CategoricalCard key={col.index} col={col} onChangeType={onChangeType} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ColumnSummary;
