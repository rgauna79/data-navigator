import React, { useState } from "react";
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

function NumericCard({ col }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
          <FontAwesomeIcon icon={faHashtag} className="text-blue-500 text-xs" />
        </span>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{col.name}</span>
      </div>
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
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{col.count} values · {col.unique} unique</p>
    </div>
  );
}

function DateCard({ col }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
          <FontAwesomeIcon icon={faCalendar} className="text-purple-500 text-xs" />
        </span>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{col.name}</span>
      </div>
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
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{col.count} values · {col.unique} unique</p>
    </div>
  );
}

function CategoricalCard({ col }) {
  const max = col.topValues?.[0]?.[1] || 1;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
          <FontAwesomeIcon icon={faTag} className="text-amber-500 text-xs" />
        </span>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{col.name}</span>
      </div>
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
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{col.count} values · {col.unique} unique</p>
    </div>
  );
}

function ColumnSummary({ analysis }) {
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
            col.type === "numeric" ? <NumericCard key={col.name} col={col} /> :
            col.type === "date"    ? <DateCard    key={col.name} col={col} /> :
                                     <CategoricalCard key={col.name} col={col} />
          )}
        </div>
      )}
    </div>
  );
}

export default ColumnSummary;