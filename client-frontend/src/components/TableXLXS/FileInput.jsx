import React from "react";

function FileInputComponent({ handleFileChange }) {
  return (
    <div className="mb-2 flex items-center justify-center">
      <input
        type="file"
        className="p-2 border-gray-300 border bg-white rounded mr-2 w-full"
        id="fileInput"
        aria-describedby="readFile"
        accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={handleFileChange}
      />
    </div>
  );
}

export default FileInputComponent;
