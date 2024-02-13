import React from "react";

function FileInputComponent({ handleFileChange }) {
  return (
    <div className="mb-2 flex items-center">
      <input
        type="file"
        className="form-control rounded mr-2"
        id="fileInput"
        aria-describedby="readFile"
        accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={handleFileChange}
      />
      <span className="text-center" id="loadingMessage"></span>
    </div>
  );
}

export default FileInputComponent;
