import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHashtag,
  faCalendar,
  faTag,
  faChevronDown,
  faChevronUp,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";

const fmt = (n) => {
  if (n === undefined || n === null || isNaN(n)) return "—";
  return Number.isInteger(n)
    ? n.toLocaleString()
    : parseFloat(n.toFixed(2)).toLocaleString();
};

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function NumericCard({ col }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
          <FontAwesomeIcon icon={faHashtag} className="text-blue-500 text-xs" />
        </span>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
          {col.name}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Sum", value: fmt(col.sum) },
          { label: "Avg", value: fmt(col.avg) },
          { label: "Min", value: fmt(col.min) },
          { label: "Max", value: fmt(col.max) },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2"
          >
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
              {label}
            </p>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
              {value}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        {col.count} values · {col.unique} unique
      </p>
    </div>
  );
}

function DateCard({ col }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
          <FontAwesomeIcon
            icon={faCalendar}
            className="text-purple-500 text-xs"
          />
        </span>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
          {col.name}
        </span>
      </div>
      <div className="space-y-2">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
            From
          </p>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
            {fmtDate(col.min)}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">To</p>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
            {fmtDate(col.max)}
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        {col.count} values · {col.unique} unique
      </p>
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
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
          {col.name}
        </span>
      </div>
      <div className="space-y-1.5">
        {col.topValues?.map(([val, count]) => (
          <div key={val}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-gray-700 dark:text-gray-300 truncate max-w-[70%]">
                {val}
              </span>
              <span className="text-gray-500 dark:text-gray-400 font-medium">
                {count}
              </span>
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
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        {col.count} values · {col.unique} unique
      </p>
    </div>
  );
}

function ColumnSummary({ analysis }) {
  const [expanded, setExpanded] = useState(false);

  if (!analysis || analysis.length === 0) return null;

  const numeric = analysis.filter((c) => c.type === "numeric");
  const dates = analysis.filter((c) => c.type === "date");
  const categorical = analysis.filter((c) => c.type === "categorical");

  return (
    <div className="w-full mt-6">
      {/* TRIGGER INTERACTIVO */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`w-full flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border transition-all duration-300 ${
          expanded
            ? "bg-white dark:bg-gray-800 border-blue-500 shadow-lg shadow-blue-500/10"
            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm hover:shadow-md"
        }`}
      >
        <div className="flex items-center gap-4">
          {/* Icono Principal con Pulso sutil */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors ${
              expanded
                ? "bg-blue-600 text-white"
                : "bg-blue-50 dark:bg-blue-900/30 text-blue-600"
            }`}
          >
            <FontAwesomeIcon icon={faChartLine} />
          </div>

          <div className="text-left">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
              Data Insights
            </h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {numeric.length > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                  <FontAwesomeIcon icon={faHashtag} /> {numeric.length} NUMERIC
                </span>
              )}
              {dates.length > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/20 text-[10px] font-bold text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800">
                  <FontAwesomeIcon icon={faCalendar} /> {dates.length} DATES
                </span>
              )}
              {categorical.length > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
                  <FontAwesomeIcon icon={faTag} /> {categorical.length}{" "}
                  CATEGORIES
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs font-bold text-gray-400 uppercase tracking-widest">
            {expanded ? "Hide Details" : "View Summary"}
          </span>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
              expanded
                ? "bg-blue-50 border-blue-200 text-blue-600 rotate-180"
                : "bg-gray-50 border-gray-100 text-gray-400"
            }`}
          >
            <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
          </div>
        </div>
      </button>

      {/* CONTENIDO EXPANDIBLE */}
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mt-4 animate-in slide-in-from-top-2 duration-300">
          {analysis.map((col) => {
            if (col.type === "numeric")
              return <NumericCard key={col.name} col={col} />;
            if (col.type === "date")
              return <DateCard key={col.name} col={col} />;
            return <CategoricalCard key={col.name} col={col} />;
          })}
        </div>
      )}
    </div>
  );
}

export default ColumnSummary;
