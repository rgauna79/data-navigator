import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faChartBar, faChartPie } from "@fortawesome/free-solid-svg-icons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useDataContext } from "../../context/DataContext.jsx";

function Modal({ handleClose, columns, data }) {
  const { setSelectedColumns, setSelectedOptions, setTypeReport, setData } = useDataContext();
  const navigate = useNavigate();

  const [localSelectedColumns, setLocalSelectedColumns] = useState([]);
  const [localSelectedOptions, setLocalSelectedOptions] = useState({});
  const [localTypeReport, setLocalTypeReport] = useState("");
  const [dateRanges, setDateRanges] = useState({});
  const [error, setError] = useState("");

  const isDateColumn = (columnName) =>
    data.some((item) => {
      const value = item[columnName];
      if (typeof value === "string" && value.trim() !== "") {
        return !isNaN(new Date(value).getTime());
      }
      return false;
    });

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
    [...new Set(data.map((item) => item[columnName]))];

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    if (checked) {
      setLocalSelectedColumns((prev) => [...prev, name]);
      if (isDateColumn(name) && !dateRanges[name]) {
        const { minDate, maxDate } = getMinMaxDates(name);
        setDateRanges((prev) => ({ ...prev, [name]: { startDate: minDate, endDate: maxDate } }));
        setLocalSelectedOptions((prev) => ({ ...prev, [name]: { from: minDate, to: maxDate } }));
      }
    } else {
      setLocalSelectedColumns((prev) => prev.filter((col) => col !== name));
      setLocalSelectedOptions((prev) => { const u = { ...prev }; delete u[name]; return u; });
      setDateRanges((prev) => { const u = { ...prev }; delete u[name]; return u; });
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
    setLocalSelectedOptions((prev) => ({ ...prev, [column]: { from: startDate, to: endDate } }));
  };

  const handleConfirm = () => {
    // Validate date columns
    for (const column of localSelectedColumns) {
      if (isDateColumn(column)) {
        const { startDate, endDate } = dateRanges[column] || {};
        if (!startDate || !endDate || startDate > endDate) {
          setError("Please select valid date ranges for all date columns.");
          setTimeout(() => setError(""), 5000);
          return;
        }
      }
    }

    // Validate non-date columns have a selection
    const nonDateCols = localSelectedColumns.filter((col) => !isDateColumn(col));
    if (nonDateCols.some((col) => !localSelectedOptions[col])) {
      setError("Please select a record for all selected columns.");
      setTimeout(() => setError(""), 5000);
      return;
    }

    if (localSelectedColumns.length === 0 && localTypeReport !== "mostRepeated") {
      setError("Must select at least one column.");
      setTimeout(() => setError(""), 5000);
      return;
    }

    setSelectedColumns(localSelectedColumns);
    setSelectedOptions(localSelectedOptions);
    setTypeReport(localTypeReport);
    setData(data);
    handleClose();
    navigate("/charts");
  };

  useEffect(() => {
    localSelectedColumns.forEach((column) => {
      if (isDateColumn(column) && !dateRanges[column]) {
        const { minDate, maxDate } = getMinMaxDates(column);
        setDateRanges((prev) => ({ ...prev, [column]: { startDate: minDate, endDate: maxDate } }));
        setLocalSelectedOptions((prev) => ({ ...prev, [column]: { from: minDate, to: maxDate } }));
      }
    });
  }, [localSelectedColumns]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Generate Report</h2>
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Report type selector */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Report type</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "statistics", label: "Statistics", icon: faChartBar },
                { value: "mostRepeated", label: "Most repeated", icon: faChartPie },
              ].map(({ value, label, icon }) => (
                <label
                  key={value}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors text-sm ${
                    localTypeReport === value
                      ? "bg-blue-50 dark:bg-blue-900/30 border-blue-400 text-blue-700 dark:text-blue-300"
                      : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="typeReport"
                    value={value}
                    onChange={(e) => setLocalTypeReport(e.target.value)}
                    className="sr-only"
                  />
                  <FontAwesomeIcon icon={icon} className="text-xs" />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Statistics: column checkboxes */}
          {localTypeReport === "statistics" && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select columns to filter</p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {columns.map((column) => (
                  <div key={column.accessor} className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name={column.Header}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{column.Header}</span>
                    </label>

                    {localSelectedColumns.includes(column.Header) && (
                      <div className="ml-6">
                        {isDateColumn(column.accessor) ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Date range</span>
                            <div className="flex gap-2">
                              <DatePicker
                                selected={dateRanges[column.Header]?.startDate || null}
                                onChange={(date) => handleDateChange(column.Header, date, dateRanges[column.Header]?.endDate)}
                                selectsStart
                                startDate={dateRanges[column.Header]?.startDate}
                                endDate={dateRanges[column.Header]?.endDate}
                                className="w-full text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-gray-900 dark:text-white"
                              />
                              <DatePicker
                                selected={dateRanges[column.Header]?.endDate || null}
                                onChange={(date) => handleDateChange(column.Header, dateRanges[column.Header]?.startDate, date)}
                                selectsEnd
                                startDate={dateRanges[column.Header]?.startDate}
                                endDate={dateRanges[column.Header]?.endDate}
                                minDate={dateRanges[column.Header]?.startDate}
                                className="w-full text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                        ) : (
                          <select
                            name={column.Header}
                            value={localSelectedOptions[column.Header] || ""}
                            onChange={handleSelectChange}
                            className="w-full text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select a value</option>
                            {getUniqueValues(column.accessor).map((value) => (
                              <option key={value} value={value}>{value}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Most repeated: column selector */}
          {localTypeReport === "mostRepeated" && (
            <div>
              <label htmlFor="mostRepeatedSelect" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Select column to analyze
              </label>
              <select
                name="mostRepeated"
                id="mostRepeatedSelect"
                value={localSelectedOptions.mostRepeated || ""}
                onChange={handleSelectChange}
                className="w-full text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a column</option>
                {columns.map((column) => (
                  <option key={column.accessor} value={column.accessor}>{column.Header}</option>
                ))}
              </select>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!localTypeReport}
            className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;