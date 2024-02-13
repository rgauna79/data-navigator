import React from "react";

function PaginationComponent({
  pageIndex,
  pageSize,
  data,
  canPreviousPage,
  canNextPage,
  pageOptions,
  pageCount,
  nextPage,
  previousPage,
  setPageSize,
}) {
  return (
    <div className="pagination mt-4 flex justify-content-between align-items-center">
      <div className="ml-2">
        Showing {pageIndex * pageSize + 1} to{" "}
        {Math.min((pageIndex + 1) * pageSize, data.length)} of {data.length}{" "}
        records
      </div>
      <div className="ml-2">
        Rows per page:
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          {[15, 25, 50, 100].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              {pageSize}
            </option>
          ))}
        </select>
      </div>
      <div className="ml-auto flex items-center">
        <button
          className="px-3 py-1 mr-2 bg-blue-500 text-white rounded"
          onClick={() => previousPage()}
          disabled={!canPreviousPage}
        >
          {"<"}
        </button>
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded"
          onClick={() => nextPage()}
          disabled={!canNextPage}
        >
          {">"}
        </button>
        <span className="ml-2">
          Page{" "}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{" "}
        </span>
      </div>
    </div>
  );
}

export default PaginationComponent;
