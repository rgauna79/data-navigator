import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faChartBar,
  faChartPie,
  faHashtag,
  faTag,
  faListOl, // ✅ Corregido: faListNumbered no existe, se usa faListOl
} from "@fortawesome/free-solid-svg-icons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useDataContext } from "../../context/DataContext.jsx";

function Modal({ handleClose, columns, data }) {
  const { setSelectedColumns, setSelectedOptions, setTypeReport, setData } =
    useDataContext();
  const navigate = useNavigate();

  const [localSelectedColumns, setLocalSelectedColumns] = useState([]);
  const [localSelectedOptions, setLocalSelectedOptions] = useState({});
  const [localTypeReport, setLocalTypeReport] = useState("mostRepeated");
  const [limitMostRepeated, setLimitMostRepeated] = useState(5);
  const [dateRanges, setDateRanges] = useState({});
  const [error, setError] = useState("");

  // --- Lógica de detección de columnas ---
  const isDateColumn = (columnName) =>
    data.some((item) => {
      const value = item[columnName];
      if (typeof value === "string" && value.trim() !== "") {
        return !isNaN(new Date(value).getTime());
      }
      return false;
    });

  const isNumericColumn = (columnName) => {
    const vals = data
      .map((r) => r[columnName])
      .filter((v) => v !== "" && v !== null && v !== undefined);
    if (vals.length === 0) return false;
    const numCount = vals.filter(
      (v) => !isNaN(parseFloat(v)) && isFinite(v)
    ).length;
    return numCount / vals.length > 0.6;
  };

  const getMinMaxDates = (columnName) => {
    const dates = data
      .map((item) => new Date(item[columnName]))
      .filter((d) => !isNaN(d));
    return {
      minDate: new Date(Math.min(...dates)),
      maxDate: new Date(Math.max(...dates)),
    };
  };

  const getUniqueValues = (columnName) =>
    [
      ...new Set(
        data
          .map((item) => item[columnName])
          .filter((v) => v !== "" && v !== null)
      ),
    ].slice(0, 100);

  // --- Handlers ---
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    if (checked) {
      setLocalSelectedColumns((prev) => [...prev, name]);
      if (isDateColumn(name) && !dateRanges[name]) {
        const { minDate, maxDate } = getMinMaxDates(name);
        setDateRanges((prev) => ({
          ...prev,
          [name]: { startDate: minDate, endDate: maxDate },
        }));
        setLocalSelectedOptions((prev) => ({
          ...prev,
          [name]: { from: minDate, to: maxDate },
        }));
      }
    } else {
      setLocalSelectedColumns((prev) => prev.filter((col) => col !== name));
      setLocalSelectedOptions((prev) => {
        const u = { ...prev };
        delete u[name];
        return u;
      });
    }
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setLocalSelectedOptions((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (column, startDate, endDate) => {
    if (startDate > endDate) {
      setError("Start date cannot be after end date.");
      return;
    }
    setError("");
    setDateRanges((prev) => ({ ...prev, [column]: { startDate, endDate } }));
    setLocalSelectedOptions((prev) => ({
      ...prev,
      [column]: { from: startDate, to: endDate },
    }));
  };

  const handleConfirm = () => {
    if (!localTypeReport) {
      setError("Please select a report type.");
      return;
    }

    if (
      localTypeReport === "mostRepeated" &&
      !localSelectedOptions.mostRepeated
    ) {
      setError("Please select a column to analyze.");
      setTimeout(() => setError(""), 4000);
      return;
    }

    if (localTypeReport === "statistics" && localSelectedColumns.length === 0) {
      setError("Please select at least one column to filter.");
      setTimeout(() => setError(""), 4000);
      return;
    }

    const finalOptions = { ...localSelectedOptions };
    if (localTypeReport === "mostRepeated") {
      finalOptions.limit = limitMostRepeated;
    }

    setSelectedColumns(localSelectedColumns);
    setSelectedOptions(finalOptions);
    setTypeReport(localTypeReport);
    setData(data);
    handleClose();
    navigate("/charts");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Generate Report
          </h2>
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Report type selection */}
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                value: "statistics",
                label: "Statistics",
                icon: faChartBar,
                desc: "Filter values",
              },
              {
                value: "mostRepeated",
                label: "Most repeated",
                icon: faChartPie,
                desc: "Top values",
              },
            ].map(({ value, label, icon, desc }) => (
              <label
                key={value}
                className={`flex flex-col gap-1 px-3 py-3 rounded-xl border cursor-pointer transition-colors ${
                  localTypeReport === value
                    ? "bg-blue-50 dark:bg-blue-900/30 border-blue-400 text-blue-700"
                    : "border-gray-200 dark:border-gray-600 text-gray-500"
                }`}
              >
                <input
                  type="radio"
                  name="typeReport"
                  value={value}
                  onChange={(e) => setLocalTypeReport(e.target.value)}
                  className="sr-only"
                  checked={localTypeReport === value}
                />
                <span className="flex items-center gap-2 text-sm font-medium">
                  <FontAwesomeIcon icon={icon} className="text-xs" /> {label}
                </span>
                <span className="text-xs opacity-70">{desc}</span>
              </label>
            ))}
          </div>

          {/* Statistics View */}
          {localTypeReport === "statistics" && (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {columns.map((column) => (
                <div key={column.accessor} className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name={column.Header}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {column.Header}
                    </span>
                  </label>
                  {localSelectedColumns.includes(column.Header) && (
                    <div className="ml-6">
                      {isDateColumn(column.accessor) ? (
                        <div className="flex gap-2">
                          <DatePicker
                            selected={dateRanges[column.Header]?.startDate}
                            onChange={(d) =>
                              handleDateChange(
                                column.Header,
                                d,
                                dateRanges[column.Header]?.endDate
                              )
                            }
                            className="w-full text-xs bg-gray-50 dark:bg-gray-700 border rounded px-2 py-1"
                          />
                          <DatePicker
                            selected={dateRanges[column.Header]?.endDate}
                            onChange={(d) =>
                              handleDateChange(
                                column.Header,
                                dateRanges[column.Header]?.startDate,
                                d
                              )
                            }
                            className="w-full text-xs bg-gray-50 dark:bg-gray-700 border rounded px-2 py-1"
                          />
                        </div>
                      ) : (
                        <select
                          name={column.Header}
                          value={localSelectedOptions[column.Header] || ""}
                          onChange={handleSelectChange}
                          className="w-full text-sm bg-gray-50 dark:bg-gray-700 border rounded-lg px-3 py-1.5"
                        >
                          <option value="">Select a value...</option>
                          {getUniqueValues(column.accessor).map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Most Repeated View */}
          {localTypeReport === "mostRepeated" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Column to analyze
                </label>
                <select
                  name="mostRepeated"
                  value={localSelectedOptions.mostRepeated || ""}
                  onChange={handleSelectChange}
                  className="w-full text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select a column...</option>
                  {columns
                    .filter(
                      (col) =>
                        !isNumericColumn(col.accessor) &&
                        !isDateColumn(col.accessor)
                    )
                    .map((column) => (
                      <option key={column.accessor} value={column.accessor}>
                        {column.Header}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Number of top values
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={limitMostRepeated}
                    onChange={(e) =>
                      setLimitMostRepeated(parseInt(e.target.value) || 1)
                    }
                    className="w-full text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-9 pr-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <FontAwesomeIcon
                    icon={faListOl}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200">
              {error}
            </p>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm active:scale-95 transition-all"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
