import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

function Modal({ handleClose, columns, data, workbook, selectedSheet }) {
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [typeReport, setTypeReport] = useState("");

  const navigate = useNavigate();

  const handleCheckboxChange = (e) => {
    console.log(selectedOptions);
    const { name, checked } = e.target;
    if (checked) {
      setSelectedColumns([...selectedColumns, name]);
    } else {
      setSelectedColumns(selectedColumns.filter((col) => col !== name));
      setSelectedOptions({ ...selectedOptions, [name]: null });
    }
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setSelectedOptions({ ...selectedOptions, [name]: value });
  };

  const getUniqueValues = (columnName) => {
    const values = data.map((item) => item[columnName]);
    return [...new Set(values)];
  };

  const handleConfirm = () => {
    if (selectedColumns.length > 0) {
      // if there are selected columns and options are selected navigate to charts
      navigate("/charts", {
        state: {
          type: "statistics",
          selectedColumns,
          selectedOptions,
          data,
          workbook,
          selectedSheet,
        },
      });
    } else if (typeReport === "mostRepeated") {
      navigate("/charts", {
        state: {
          type: "mostRepeated",
          selectedOptions,
          data,
          workbook,
          selectedSheet,
        },
      });
    }
    handleClose();
  };

  const handleTypeChange = (e) => {
    setTypeReport(e.target.value);
  };

  return (
    <div className="modal fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center">
      <div className="flex flex-col modal-content bg-white p-4 rounded shadow-lg">
        <span
          className="text-gray-500 hover:text-gray-900 cursor-pointer text-right"
          onClick={handleClose}
        >
          <FontAwesomeIcon icon={faXmark} />
        </span>
        <h2 className="text-lg font-bold mb-2">Select Type of Report:</h2>
        <div className="flex flex-col gap-2">
          <div className="flex items-center mb-2 p-2 bg-gray-200">
            <input
              type="radio"
              name="typeReport"
              value="allColumns"
              onChange={handleTypeChange}
              className="ml-2"
            />
            <label htmlFor="allColumns" className="text-sm text-black p-2">
              All columns
            </label>
            <input
              type="radio"
              name="typeReport"
              value="mostRepeated"
              onChange={handleTypeChange}
              className="ml-2 "
            />
            <label htmlFor="mostRepeated" className="text-sm text-black  p-2">
              Most repeated values
            </label>
          </div>
          {typeReport === "allColumns" && (
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
                  <label
                    htmlFor={column.accessor}
                    className="text-sm text-black"
                  >
                    {column.Header}
                  </label>
                  {selectedColumns.includes(column.Header) && (
                    <select
                      name={column.Header}
                      value={selectedOptions[column.Header] || ""}
                      onChange={handleSelectChange}
                      className="ml-2"
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
              ))}
            </div>
          )}
          {typeReport === "mostRepeated" && (
            <div>
              <label htmlFor="mostRepeated" className="text-sm text-black">
                Select a column
              </label>
              <select
                name="mostRepeated"
                value={selectedOptions.mostRepeated || ""}
                onChange={handleSelectChange}
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
        <button
          onClick={handleConfirm}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded  w-1/2 self-center"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

export default Modal;
