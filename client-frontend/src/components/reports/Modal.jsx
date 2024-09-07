import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useDataContext } from "../../context/DataContext.jsx";

function Modal({ handleClose, columns, data }) {
  const { setSelectedColumns, setSelectedOptions, setTypeReport, setData } = useDataContext();

  const [localSelectedColumns, setLocalSelectedColumns] = useState([]);
  const [localSelectedOptions, setLocalSelectedOptions] = useState({});
  const [localTypeReport, setLocalTypeReport] = useState("");
  const [dateRanges, setDateRanges] = useState({});
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    if (checked) {
      setLocalSelectedColumns([...localSelectedColumns, name]);
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
      setLocalSelectedColumns(localSelectedColumns.filter((col) => col !== name));
      const updatedOptions = { ...localSelectedOptions };
      delete updatedOptions[name];
      setLocalSelectedOptions(updatedOptions);
      const updatedDateRanges = { ...dateRanges };
      delete updatedDateRanges[name];
      setDateRanges(updatedDateRanges);
    }
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setLocalSelectedOptions({ ...localSelectedOptions, [name]: value });
  };

  const handleDateChange = (column, startDate, endDate) => {
    if (startDate > endDate) {
      setError("Start date cannot be after end date.");
      return;
    }

    setError("");
    setDateRanges((prev) => ({
      ...prev,
      [column]: { startDate, endDate },
    }));
    setLocalSelectedOptions((prev) => ({
      ...prev,
      [column]: { from: startDate, to: endDate },
    }));
  };

  const getUniqueValues = (columnName) => {
    const values = data.map((item) => item[columnName]);
    return [...new Set(values)];
  };

  const handleConfirm = () => {
    let isValid = true;

    localSelectedColumns.forEach((column) => {
      if (isDateColumn(column)) {
        const { startDate, endDate } = dateRanges[column] || {};
        if (!startDate || !endDate || startDate > endDate) {
          isValid = false;
          setError("Please select valid date ranges for all date columns.");
          setTimeout(() => setError(""), 5000); // Clear error after 5 seconds
          return;
        }
      }
    });
  
    if (localSelectedColumns.some((column) => !isDateColumn(column))) {
      const selectedOptions = Object.values(localSelectedOptions);
      if (selectedOptions.length !== localSelectedColumns.length) {
        isValid = false;
        setError("Please select a record for all non-date columns.");
        setTimeout(() => setError(""), 5000); // Clear error after 5 seconds
      }
    }

    if (!isValid) {
      return;
    }

    if (localSelectedColumns.length > 0 || localTypeReport === "mostRepeated") {
      // console.log("localSelectedOptions: ",localSelectedOptions);
      // console.log("localSelectedColumns: ",localSelectedColumns);
      // console.log("data: ",data);
      // console.log("localTypeReport: ",localTypeReport);
      setSelectedColumns(localSelectedColumns);
      setSelectedOptions(localSelectedOptions);
      setTypeReport(localTypeReport);
      setData(data);
      navigate("/charts");
    } else
    {
      setError("Must select a record")
      setTimeout(() => setError(""), 5000); // Clear error after 5 seconds
      return;
    }
    handleClose();
  };

  const handleTypeChange = (e) => {
    setLocalTypeReport(e.target.value);
  };

  const isDateColumn = (columnName) => {
    console.log(columnName);
    return data.some((item) => {
      const value = item[columnName];
      console.log(value);
      if (typeof value === 'string' && value.trim() !== '') {
        const parsedDate = new Date(value);
        console.log(!isNaN(parsedDate));
        return !isNaN(parsedDate.getTime());
      }
      return false;
    });
  };

  const getMinMaxDates = (columnName) => {
    const dates = data
      .map((item) => new Date(item[columnName]))
      .filter((date) => !isNaN(date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    return { minDate, maxDate };
  };

  useEffect(() => {
    const initialDateRanges = {};
    const initialSelectedOptions = {};

    localSelectedColumns.forEach((column) => {
      if (isDateColumn(column) && !dateRanges[column]) {
        const { minDate } = getMinMaxDates(column);
        initialDateRanges[column] = { startDate: minDate, endDate: minDate };
        initialSelectedOptions[column] = { from: minDate, to: minDate };
      }
    });

    setDateRanges((prev) => ({
      ...prev,
      ...initialDateRanges,
    }));
    setLocalSelectedOptions((prev) => ({
      ...prev,
      ...initialSelectedOptions,
    }));
  }, [localSelectedColumns]);

  return (
    <div className="modal fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center">
      <div className="modal-content bg-white p-4 rounded shadow-lg overflow-y-auto max-h-full">
        <span
          className="text-gray-500 hover:text-gray-900 cursor-pointer text-right"
          onClick={handleClose}
        >
          <FontAwesomeIcon icon={faTimes} />
        </span>
        <h2 className="text-lg font-bold mb-2">Select Type of Report:</h2>
        <div className="flex flex-col gap-2">
          <div className="flex items-center mb-2 p-2 bg-gray-200">
            <input
              type="radio"
              name="typeReport"
              value="statistics"
              onChange={handleTypeChange}
              className="ml-2"
              id="typeReportAllColumns"
            />
            <label htmlFor="typeReportAllColumns" className="text-sm text-black p-2">
              All columns
            </label>
            <input
              type="radio"
              name="typeReport"
              value="mostRepeated"
              onChange={handleTypeChange}
              className="ml-2"
              id="typeReportMostRepeated"
            />
            <label htmlFor="typeReportMostRepeated" className="text-sm text-black p-2">
              Most repeated values
            </label>
          </div>
          {localTypeReport === "statistics" && (
            <div>
              {columns.map((column) => (
                <div key={column.accessor} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={column.accessor}
                    value={column.accessor}
                    onChange={handleCheckboxChange}
                    className="mr-2"
                    name={column.Header}
                  />
                  <label htmlFor={column.accessor} className="text-sm text-black">
                    {column.Header}
                  </label>
                  {localSelectedColumns.includes(column.Header) && (
                    <div className="flex flex-col gap-2">
                      {isDateColumn(column.accessor) ? (
                        <div className="flex flex-col">
                          <label className="text-sm text-black">Date Range:</label>
                          <div className="flex gap-2">
                          <DatePicker
                            selected={dateRanges[column.Header]?.startDate || null}
                            onChange={(date) =>
                              handleDateChange(column.Header, date, dateRanges[column.Header]?.endDate)
                            }
                            selectsStart
                            startDate={dateRanges[column.Header]?.startDate || null}
                            endDate={dateRanges[column.Header]?.endDate || null}
                            className="bg-gray-100 p-2 rounded"
                          />
                          <DatePicker
                            selected={dateRanges[column.Header]?.endDate || null}
                            onChange={(date) =>
                              handleDateChange(column.Header, dateRanges[column.Header]?.startDate, date)
                            }
                            selectsEnd
                            startDate={dateRanges[column.Header]?.startDate || null}
                            endDate={dateRanges[column.Header]?.endDate || null}
                            className="bg-gray-100 p-2 rounded"
                            minDate={dateRanges[column.Header]?.startDate || null}
                          />
                          </div>
                        </div>
                      ) : (
                        <select
                          name={column.Header}
                          value={localSelectedOptions[column.Header] || ""}
                          onChange={handleSelectChange}
                          className="ml-2 bg-gray-100 p-2 rounded"
                        >
                          <option value="">Select a record</option>
                          {getUniqueValues(column.accessor).map((value) => (
                            <option key={value} value={value}>
                              {value}
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
            <div>
              <label htmlFor="mostRepeated" className="text-sm text-black">
                Select a column
              </label>
              <select
                name="mostRepeated"
                value={localSelectedOptions.mostRepeated || ""}
                onChange={handleSelectChange}
                id="mostRepeatedSelect"
                className="ml-2 bg-gray-100 p-2 rounded"
              >
                <option value="">Select</option>
                {columns.map((column) => (
                  <option key={column.accessor} value={column.accessor}>
                    {column.Header}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <button
          onClick={handleConfirm}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-1/2 self-center"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

export default Modal;
