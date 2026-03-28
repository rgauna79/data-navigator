import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faChartBar,
  faChartPie,
  faObjectGroup,
  faListOl,
} from "@fortawesome/free-solid-svg-icons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useDataContext } from "../../context/DataContext.jsx";

function Modal({ handleClose, columns, data }) {
  const {
    setSelectedColumns,
    setSelectedOptions,
    setTypeReport,
    setData,
    columnAnalysis,
  } = useDataContext();
  const navigate = useNavigate();

  const [localSelectedColumns, setLocalSelectedColumns] = useState([]);
  const [localSelectedOptions, setLocalSelectedOptions] = useState({});
  const [localTypeReport, setLocalTypeReport] = useState("statistics");
  const [limitMostRepeated, setLimitMostRepeated] = useState(10);
  const [dateRanges, setDateRanges] = useState({});
  const [error, setError] = useState("");

  const isDateColumn = (headerName) =>
    columnAnalysis?.find((c) => c.name === headerName)?.type === "date";
  const isNumericColumn = (headerName) =>
    columnAnalysis?.find((c) => c.name === headerName)?.type === "numeric";

  const getMinMaxDates = (headerName) => {
    const col = columnAnalysis?.find((c) => c.name === headerName);
    if (col && col.type === "date" && col.min && col.max)
      return { minDate: col.min, maxDate: col.max };
    const accessor = columns.find((c) => c.Header === headerName)?.accessor;
    const dates = data
      .map((item) => new Date(item[accessor]))
      .filter((d) => !isNaN(d));
    return {
      minDate: new Date(Math.min(...dates)),
      maxDate: new Date(Math.max(...dates)),
    };
  };

  const getUniqueValues = (accessor) =>
    [
      ...new Set(
        data
          .map((item) => item[accessor])
          .filter((v) => v !== "" && v !== null && v !== undefined)
      ),
    ]
      .sort()
      .slice(0, 100);

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setLocalSelectedOptions((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (colAccessor, startDate, endDate) => {
    if (startDate > endDate) {
      setError("Start date cannot be after end date.");
      return;
    }
    setError("");
    setDateRanges((prev) => ({
      ...prev,
      [colAccessor]: { startDate, endDate },
    }));
    setLocalSelectedOptions((prev) => ({
      ...prev,
      [colAccessor]: { from: startDate, to: endDate },
    }));
  };

  const handleConfirm = () => {
    if (!localTypeReport) return setError("Please select a report type.");
    if (
      localTypeReport === "mostRepeated" &&
      !localSelectedOptions.mostRepeated
    )
      return setError("Select a column.");
    if (localTypeReport === "statistics" && localSelectedColumns.length === 0)
      return setError("Select at least one filter.");
    if (
      localTypeReport === "groupBy" &&
      (!localSelectedOptions.groupByCol || !localSelectedOptions.calcCol)
    )
      return setError("Select both columns.");

    const finalOptions = { ...localSelectedOptions };
    if (localTypeReport === "mostRepeated" || localTypeReport === "groupBy")
      finalOptions.limit = limitMostRepeated;
    if (localTypeReport === "groupBy" && !finalOptions.aggregation)
      finalOptions.aggregation = "sum";

    setSelectedColumns(localSelectedColumns);
    setSelectedOptions(finalOptions);
    setTypeReport(localTypeReport);
    setData(data);
    handleClose();
    navigate("/charts");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                value: "statistics",
                label: "Statistics",
                icon: faChartBar,
                desc: "Overview",
              },
              {
                value: "mostRepeated",
                label: "Top Values",
                icon: faChartPie,
                desc: "Frequencies",
              },
              {
                value: "groupBy",
                label: "Pivot Table",
                icon: faObjectGroup,
                desc: "Cross Data",
              },
            ].map(({ value, label, icon, desc }) => (
              <label
                key={value}
                className={`flex flex-col gap-1 px-3 py-3 rounded-xl border cursor-pointer transition-all ${
                  localTypeReport === value
                    ? "bg-blue-50 border-blue-400 text-blue-700 shadow-sm"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
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
                <span className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
                  <FontAwesomeIcon icon={icon} /> {label}
                </span>
                <span className="text-[10px] text-center opacity-70">
                  {desc}
                </span>
              </label>
            ))}
          </div>

          {localTypeReport === "statistics" && (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {columns.map((column) => (
                <div key={column.accessor} className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded-md transition-colors">
                    <input
                      type="checkbox"
                      checked={localSelectedColumns.includes(column.accessor)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const colAcc = column.accessor;
                        const colHead = column.Header;
                        if (checked) {
                          setLocalSelectedColumns((prev) => [...prev, colAcc]);
                          if (isDateColumn(colHead) && !dateRanges[colAcc]) {
                            const { minDate, maxDate } =
                              getMinMaxDates(colHead);
                            setDateRanges((prev) => ({
                              ...prev,
                              [colAcc]: {
                                startDate: minDate,
                                endDate: maxDate,
                              },
                            }));
                            setLocalSelectedOptions((prev) => ({
                              ...prev,
                              [colAcc]: { from: minDate, to: maxDate },
                            }));
                          }
                        } else {
                          setLocalSelectedColumns((prev) =>
                            prev.filter((c) => c !== colAcc)
                          );
                          setLocalSelectedOptions((prev) => {
                            const u = { ...prev };
                            delete u[colAcc];
                            return u;
                          });
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {column.Header}
                    </span>
                  </label>
                  {localSelectedColumns.includes(column.accessor) && (
                    <div className="ml-6 mt-1 mb-3">
                      {isDateColumn(column.Header) ? (
                        <div className="flex gap-2">
                          <DatePicker
                            selected={dateRanges[column.accessor]?.startDate}
                            onChange={(d) =>
                              handleDateChange(
                                column.accessor,
                                d,
                                dateRanges[column.accessor]?.endDate
                              )
                            }
                            className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                            placeholderText="Start Date"
                          />
                          <DatePicker
                            selected={dateRanges[column.accessor]?.endDate}
                            onChange={(d) =>
                              handleDateChange(
                                column.accessor,
                                dateRanges[column.accessor]?.startDate,
                                d
                              )
                            }
                            className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                            placeholderText="End Date"
                          />
                        </div>
                      ) : (
                        <select
                          name={column.accessor}
                          value={localSelectedOptions[column.accessor] || ""}
                          onChange={handleSelectChange}
                          className="w-full text-sm font-medium bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select a value to filter...</option>
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

          {localTypeReport === "mostRepeated" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">
                  Column to analyze
                </label>
                <select
                  name="mostRepeated"
                  value={localSelectedOptions.mostRepeated || ""}
                  onChange={handleSelectChange}
                  className="w-full text-sm font-medium bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select a column...</option>
                  {columns.map((column) => (
                    <option key={column.accessor} value={column.accessor}>
                      {column.Header}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">
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
                    className="w-full text-sm font-medium bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <FontAwesomeIcon
                    icon={faListOl}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {localTypeReport === "groupBy" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">
                  1. Group by
                </label>
                <select
                  name="groupByCol"
                  value={localSelectedOptions.groupByCol || ""}
                  onChange={handleSelectChange}
                  className="w-full text-sm font-medium bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select grouping column...</option>
                  {columns.map((column) => (
                    <option key={column.accessor} value={column.accessor}>
                      {column.Header}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">
                    2. Calculate
                  </label>
                  <select
                    name="calcCol"
                    value={localSelectedOptions.calcCol || ""}
                    onChange={handleSelectChange}
                    className="w-full text-sm font-medium bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Numeric column...</option>
                    {columns
                      .filter((c) => isNumericColumn(c.Header))
                      .map((column) => (
                        <option key={column.accessor} value={column.accessor}>
                          {column.Header}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">
                    3. Operation
                  </label>
                  <select
                    name="aggregation"
                    value={localSelectedOptions.aggregation || "sum"}
                    onChange={handleSelectChange}
                    className="w-full text-sm font-medium bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="sum">Sum</option>
                    <option value="avg">Average</option>
                    <option value="count">Count</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-600 text-[11px] font-bold bg-red-50 px-3 py-2 rounded-lg border border-red-200">
              {error}
            </p>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-2 justify-end mt-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm active:scale-95"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
