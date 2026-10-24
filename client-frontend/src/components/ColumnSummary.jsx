import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHashtag, faCalendar, faTag, faChevronDown, faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

const fmt = (n) => {
  if (n === undefined || n === null || isNaN(n)) return "—";
  return Number.isInteger(n) ? n.toLocaleString() : parseFloat(n.toFixed(2)).toLocaleString();
};

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const TYPE_LABELS = { numeric: "Number", date: "Date", text: "Text" };

// Clases completas (Tailwind solo genera las que aparecen literalmente en el código)
const ICON_STYLES = {
  blue: { box: "bg-blue-100 dark:bg-blue-900/40", icon: "text-blue-500" },
  purple: { box: "bg-purple-100 dark:bg-purple-900/40", icon: "text-purple-500" },
  amber: { box: "bg-amber-100 dark:bg-amber-900/40", icon: "text-amber-500" },
};

const selectClass =
  "text-[11px] bg-transparent border border-gray-200 dark:border-gray-600 rounded px-1 py-0.5 text-gray-500 dark:text-gray-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500";

// Encabezado de tarjeta con el selector de tipo: "Auto" usa lo detectado y
// los demás valores fuerzan el tipo. En columnas de fecha también se elige
// el orden día/mes cuando la detección se equivoca (p. ej. 03/02/2024).
function CardHeader({ col, icon, color, onChangeType }) {
  const current = col.overridden && col.type !== col.detected ? col.type : "";
  const typeValue = col.type === "categorical" ? "text" : col.type;
  const detected = col.detected === "categorical" ? "text" : col.detected;
  return (
    <div className="mb-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className={`w-6 h-6 rounded-md ${ICON_STYLES[color].box} flex items-center justify-center shrink-0`}>
          <FontAwesomeIcon icon={icon} className={`${ICON_STYLES[color].icon} text-xs`} />
        </span>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate" title={col.name}>
          {col.name}
        </span>
      </div>
      {onChangeType && (
        <div className="flex flex-wrap gap-1">
          <select
            aria-label={`${col.name} type`}
            value={current && typeValue}
            onChange={(e) => onChangeType(col.index, { type: e.target.value })}
            className={selectClass}
          >
            <option value="">Auto ({TYPE_LABELS[detected]})</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {col.type === "date" && (
            <select
              aria-label={`${col.name} date order`}
              value={col.dateOrder}
              onChange={(e) => onChangeType(col.index, { dateOrder: e.target.value })}
              className={selectClass}
            >
              <option value="dmy">Day/Month</option>
              <option value="mdy">Month/Day</option>
            </select>
          )}
        </div>
      )}
    </div>
  );
}

function CardFooter({ col }) {
  return (
    <div className="mt-2 text-xs">
      <p className="text-gray-400 dark:text-gray-500">{col.count} values · {col.unique} unique</p>
      {col.invalid > 0 && (
        <p className="text-amber-600 dark:text-amber-400">
          {col.invalid} value{col.invalid === 1 ? "" : "s"} not read as {col.type === "date" ? "dates" : "numbers"}
        </p>
      )}
    </div>
  );
}

function NumericCard({ col, onChangeType }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <CardHeader col={col} icon={faHashtag} color="blue" onChangeType={onChangeType} />
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Sum",  value: fmt(col.sum) },
          { label: "Avg",  value: fmt(col.avg) },
          { label: "Min",  value: fmt(col.min) },
          { label: "Max",  value: fmt(col.max) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{value}</p>
          </div>
        ))}
      </div>
      <CardFooter col={col} />
    </div>
  );
}

function DateCard({ col, onChangeType }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <CardHeader col={col} icon={faCalendar} color="purple" onChangeType={onChangeType} />
      <div className="space-y-2">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">From</p>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{fmtDate(col.min)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">To</p>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{fmtDate(col.max)}</p>
        </div>
      </div>
      <CardFooter col={col} />
    </div>
  );
}

function CategoricalCard({ col, onChangeType }) {
  const max = col.topValues?.[0]?.[1] || 1;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <CardHeader col={col} icon={faTag} color="amber" onChangeType={onChangeType} />
      <div className="space-y-1.5">
        {col.topValues?.map(([val, count]) => (
          <div key={val}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-gray-700 dark:text-gray-300 truncate max-w-[70%]">{val}</span>
              <span className="text-gray-500 dark:text-gray-400 font-medium">{count}</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <CardFooter col={col} />
    </div>
  );
}

function ColumnSummary({ analysis, onChangeType }) {
  const [expanded, setExpanded] = useState(true);

  if (!analysis || analysis.length === 0) return null;

  const numeric = analysis.filter((c) => c.type === "numeric");
  const dates = analysis.filter((c) => c.type === "date");
  const categorical = analysis.filter((c) => c.type === "categorical");

  return (
    <div className="w-full mt-6">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} className="text-xs" />
        Column summary
        <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-1">
          {numeric.length} numeric · {dates.length} date · {categorical.length} categorical
        </span>
      </button>

      {expanded && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {analysis.map((col) =>
            col.type === "numeric" ? <NumericCard key={col.index} col={col} onChangeType={onChangeType} /> :
            col.type === "date"    ? <DateCard    key={col.index} col={col} onChangeType={onChangeType} /> :
                                     <CategoricalCard key={col.index} col={col} onChangeType={onChangeType} />
          )}
        </div>
      )}
    </div>
  );
}

export default ColumnSummary;