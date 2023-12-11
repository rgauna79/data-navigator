// dataDisplay.js
import { displayPage, updateVisiblePages } from './displayPage.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';


// Function to display data in a paginated table
function displayData(localDataArray, elementPages) {
    let currentPage = 1;
    const section = document.getElementById('dataSection');
    section.innerHTML = '';

    const container = document.createElement('div');
    container.classList.add('container', 'table-responsive');

    const filterDropdown = document.getElementById('ulDropDown');

    const columnNames = Array.isArray(localDataArray[0])
    ? Object.keys(localDataArray[0])
    : Object.keys(localDataArray[0]);

    filterDropdown.innerHTML = '';
    const columnCheckboxes = [];

    for (let i = 0; i < columnNames.length; i++) {
        const filterLi = document.createElement('li');
        const filterOption = document.createElement('div');
        filterOption.classList.add('form-check');

        const checkbox = document.createElement('input');
        checkbox.classList.add('form-check-input');
        checkbox.type = 'checkbox';
        checkbox.id = `checkbox-${i}`;
        checkbox.checked = true; // By default, all columns are selected
        checkbox.setAttribute('data-column', i);
        checkbox.addEventListener('change', function () {
        updateVisibleColumns(localDataArray);
    });

    const label = document.createElement('label');
    label.classList.add('form-check-label');
    label.htmlFor = `checkbox-${i}`;
    label.textContent = columnNames[i];

    filterOption.appendChild(checkbox);
    filterOption.appendChild(label);
    filterLi.appendChild(filterOption);
    filterDropdown.appendChild(filterLi);

    columnCheckboxes.push(checkbox);
    }


    const table = document.createElement('table');
    table.classList.add('table', 'table-sm', 'table-bordered', 'table-hover', 'text-nowrap');

    const thead = document.createElement('thead');
    thead.classList.add('table-dark');
    const tbody = document.createElement('tbody');
    const headers = Object.keys(localDataArray[0]);

    const headerRow = document.createElement('tr');
    for (const header of headers) {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    for (const dataItem of localDataArray) {
        const row = document.createElement('tr');
    for (const header of headers) {
        const td = document.createElement('td');
        td.textContent = dataItem[header];
        row.appendChild(td);
    }
        tbody.appendChild(row);
    }

    table.appendChild(tbody);
    container.appendChild(table);

    const totalPages = Math.ceil(localDataArray.length / elementPages); 

    const pagination = document.createElement('ul');
    pagination.classList.add('pagination', 'justify-content-center');

    const previousItem = document.createElement('li');
    previousItem.classList.add('page-item');
    const previousLink = document.createElement('a');
    previousLink.classList.add('page-link');
    previousLink.href = '#';
    previousLink.textContent = 'Previous';
    previousLink.addEventListener('click', function() {
        currentPage = Math.max(currentPage - 1, 1);
        displayPage(currentPage - 1, localDataArray, elementPages);
    });
    previousItem.appendChild(previousLink);
    pagination.appendChild(previousItem);

    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.classList.add('page-item');

        const pageLink = document.createElement('a');
        pageLink.classList.add('page-link');
        pageLink.href = '#';
        pageLink.textContent = i;

        pageLink.addEventListener('click', function() {
        displayPage(i, localDataArray, elementPages);
        });

        pageItem.appendChild(pageLink);
        pagination.appendChild(pageItem);
    }

    const nextItem = document.createElement('li');
    nextItem.classList.add('page-item');
    const nextLink = document.createElement('a');
    nextLink.classList.add('page-link');
    nextLink.href = '#';
    nextLink.textContent = 'Next';
    nextLink.addEventListener('click', function() {
    currentPage = Math.min(currentPage + 1, totalPages);
    displayPage(currentPage + 1, localDataArray, elementPages);
    });
    nextItem.appendChild(nextLink);
    pagination.appendChild(nextItem);

    container.appendChild(pagination);
    section.appendChild(container);

    displayPage(1, localDataArray, elementPages);

    function updateVisibleColumns(dataArray) {
    const selectedColumns = columnCheckboxes
        .filter(checkbox => checkbox.checked)
        .map(checkbox => parseInt(checkbox.getAttribute('data-column')));

    //Update the table headers
    const updateHeaders = selectedColumns.map(column => columnNames[column]);

    //Update the table body
    const updateDataArray = dataArray.map(item => {
        const updateItem = {};
        selectedColumns.forEach(column => {
            updateItem[columnNames[column]] = item[columnNames[column]];
        });
        return updateItem;
    });

    updateTable(updateHeaders, updateDataArray);
  }

  function updateTable(headers, dataArray){
    //clear existing table content
    thead.innerHTML = '';
    tbody.innerHTML = '';

    //update table headers
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // //update table body
    dataArray.forEach(dataItem => {
        const row = document.createElement('tr');
        headers.forEach(header => {
          const td = document.createElement('td');
          td.textContent = dataItem[header];
          row.appendChild(td);
        });
        tbody.appendChild(row);
      });

      displayPage(1, dataArray, elementPages)
  }

// Add an event listener for changes in the select element
const selectElement = document.getElementById('elementPages');
selectElement.addEventListener('change', function () {
    const newElementPages = parseInt(selectElement.value, 10);
    displayPage(currentPage, localDataArray, newElementPages);
});

};

// Export the functions for use in other modules
export { displayData, displayPage, updateVisiblePages };
