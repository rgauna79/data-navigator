// display.js
import { displayPage } from "./displayPage.js";
import { createFilterDropdown } from "./helperFunctions.js";

// Function to display data in a paginated table
function displayData(localDataArray, elementPages) {
  let currentPage = 1;
  const section = document.getElementById("dataSection");
  section.innerHTML = "";

  const container = document.createElement("div");
  container.classList.add(
    "container",
    "table-responsive",
    "bg-secondary",
    "p-2",
  );

  // Create the table with data from sheet selected
  const table = document.createElement("table");
  table.classList.add(
    "table",
    "table-sm",
    "table-bordered",
    "table-hover",
    "text-nowrap",
  );
  const thead = document.createElement("thead");
  thead.classList.add("table-dark");
  const tbody = document.createElement("tbody");
  const headers = Object.keys(localDataArray[0]);
  const headerRow = document.createElement("tr");
  for (const header of headers) {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);

  for (const dataItem of localDataArray) {
    const row = document.createElement("tr");
    for (const header of headers) {
      const td = document.createElement("td");
      td.textContent = dataItem[header];
      row.appendChild(td);
    }
    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  container.appendChild(table);

  const totalPages = Math.ceil(localDataArray.length / elementPages);

  // Create the filter dropdown
  const columnNames = Array.isArray(localDataArray[0])
    ? Object.keys(localDataArray[0])
    : Object.keys(localDataArray[0]);
  const filterDropdown = document.getElementById("ulDropDown");
  const columnCheckboxes = [];
  createFilterDropdown(
    columnNames,
    filterDropdown,
    localDataArray,
    columnCheckboxes,
    thead,
    tbody,
  );

  // Create the pagination controls
  const pagination = document.createElement("ul");
  pagination.classList.add("pagination", "justify-content-center");

  const previousItem = document.createElement("li");
  previousItem.classList.add("page-item");
  const previousLink = document.createElement("a");
  previousLink.classList.add("page-link");
  previousLink.href = "#";
  previousLink.textContent = "Previous";
  previousLink.addEventListener("click", function () {
    currentPage = Math.max(currentPage - 1, 1);
    displayPage(currentPage - 1, localDataArray, elementPages);
  });
  previousItem.appendChild(previousLink);
  pagination.appendChild(previousItem);

  for (let i = 1; i <= totalPages; i++) {
    const pageItem = document.createElement("li");
    pageItem.classList.add("page-item");
    const pageLink = document.createElement("a");
    pageLink.classList.add("page-link");
    pageLink.href = "#";
    pageLink.textContent = i;
    pageLink.addEventListener("click", function () {
      displayPage(i, localDataArray, elementPages);
    });

    pageItem.appendChild(pageLink);
    pagination.appendChild(pageItem);
  }
  const nextItem = document.createElement("li");
  nextItem.classList.add("page-item");
  const nextLink = document.createElement("a");
  nextLink.classList.add("page-link");
  nextLink.href = "#";
  nextLink.textContent = "Next";
  nextLink.addEventListener("click", function () {
    currentPage = Math.min(currentPage + 1, totalPages);
    displayPage(currentPage + 1, localDataArray, elementPages);
  });
  nextItem.appendChild(nextLink);
  pagination.appendChild(nextItem);

  container.appendChild(pagination);
  section.appendChild(container);

  // Display the first page of data
  displayPage(1, localDataArray, elementPages);

  // Add an event listener for changes in the select element
  const selectElement = document.getElementById("elementPages");
  selectElement.addEventListener("change", function () {
    const newElementPages = parseInt(selectElement.value, 10);
    displayPage(currentPage, localDataArray, newElementPages);
  });
}

// Export the functions for use in other modules
export { displayData };
