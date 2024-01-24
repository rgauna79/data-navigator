function createFilterDropdown(
  columnNames,
  filterDropdown,
  localDataArray,
  columnCheckboxes,
  thead,
  tbody,
) {
  // Create the filter dropdown
  filterDropdown.innerHTML = "";

  for (let i = 0; i < columnNames.length; i++) {
    const filterLi = document.createElement("li");
    const filterOption = document.createElement("div");
    filterOption.classList.add("form-check");

    const checkbox = document.createElement("input");
    checkbox.classList.add("form-check-input");
    checkbox.type = "checkbox";
    checkbox.id = `checkbox-${i}`;
    checkbox.checked = true; // By default, all columns are selected
    checkbox.setAttribute("data-column", i);
    checkbox.addEventListener("change", function () {
      updateVisibleColumns(localDataArray);
    });

    const label = document.createElement("label");
    label.classList.add("form-check-label");
    label.htmlFor = `checkbox-${i}`;
    label.textContent = columnNames[i];

    filterOption.appendChild(checkbox);
    filterOption.appendChild(label);
    filterLi.appendChild(filterOption);
    filterDropdown.appendChild(filterLi);

    columnCheckboxes.push(checkbox);
  }

  // Function to update the visible columns
  function updateVisibleColumns(dataArray) {
    const selectedColumns = columnCheckboxes
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => parseInt(checkbox.getAttribute("data-column")));

    //Update the table headers
    const updateHeaders = selectedColumns.map((column) => columnNames[column]);

    //Update the table body
    const updateDataArray = dataArray.map((item) => {
      const updateItem = {};
      selectedColumns.forEach((column) => {
        updateItem[columnNames[column]] = item[columnNames[column]];
      });
      return updateItem;
    });

    updateTable(updateHeaders, updateDataArray);
  }

  function updateTable(headers, dataArray) {
    //clear existing table content
    thead.innerHTML = "";
    tbody.innerHTML = "";

    //update table headers
    const headerRow = document.createElement("tr");
    headers.forEach((header) => {
      const th = document.createElement("th");
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // //update table body
    dataArray.forEach((dataItem) => {
      const row = document.createElement("tr");
      headers.forEach((header) => {
        const td = document.createElement("td");
        td.textContent = dataItem[header];
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });

    // displayPage(1, dataArray, elementPages);
  }
}
export { createFilterDropdown };
