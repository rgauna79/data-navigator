import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Modal({ handleClose, columns, data }) {
  const [selectedColumns, setSelectedColumns] = useState([]);
  const navigate = useNavigate();

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedColumns([...selectedColumns, value]);
    } else {
      setSelectedColumns(selectedColumns.filter((col) => col !== value));
    }
  };

  const handleConfirm = () => {
    if (selectedColumns.length > 0) {
      // Si hay columnas seleccionadas, se redirige a la página de gráficos
      navigate("/charts", { state: { selectedColumns, data } });
    }
    handleClose();
  };

  return (
    <div className="modal fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center">
      <div className="modal-content bg-white p-4 rounded shadow-lg">
        <span
          className="close absolute top-0 right-0 m-2 text-gray-500 hover:text-gray-900 cursor-pointer"
          onClick={handleClose}
        >
          &times;
        </span>
        <h2 className="text-lg font-bold mb-4">Select columns to include:</h2>
        <div className="flex flex-col">
          {columns.map((column) => (
            <div key={column.accessor} className="flex items-center mb-2">
              <input
                type="checkbox"
                id={column.accessor}
                value={column.accessor}
                onChange={handleCheckboxChange}
                className="mr-2"
              />
              <label htmlFor={column.accessor} className="text-sm text-black">
                {column.Header}
              </label>
            </div>
          ))}
        </div>
        <button
          onClick={handleConfirm}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

export default Modal;
