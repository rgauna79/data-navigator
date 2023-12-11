let currentPage = 1;


// Function to display a specific page of data
function displayPage(pageNumber, localDataArray, rowsPerPage) {
  // const rowsPerPage = rowsPage;
  const startIndex = (pageNumber - 1) * rowsPerPage;
  const tableRows = document.querySelectorAll('#dataSection table tbody tr');

 // Check if startIndex exceeds the total number of rows
  if (startIndex >= tableRows.length) {
    return;
  }

  const endIndex = Math.min(startIndex + parseInt(rowsPerPage), tableRows.length);


  tableRows.forEach((row, index) => {
    // Check if the index is within the valid range
    if (index >= startIndex && index < endIndex) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });

  const totalPages = Math.ceil(localDataArray.length / rowsPerPage);
  currentPage = Math.min(pageNumber, totalPages); // Ensure currentPage doesn't exceed totalPages

  const previousLink = document.querySelector('.pagination li:first-child a');
  const nextLink = document.querySelector('.pagination li:last-child a');

  previousLink.classList.toggle('disabled', currentPage === 1);
  nextLink.classList.toggle('disabled', currentPage === totalPages);

  updateVisiblePages(pageNumber, localDataArray.length, localDataArray, rowsPerPage);
}

// Function to update visible pages in pagination
function updateVisiblePages(currentPage, totalItems, localDataArray, rowsPerPage) {
  // Existing updateVisiblePages logic
  const maxVisiblePages = 5;
  const pagination = document.querySelector('.pagination');
  const totalPages = Math.ceil(totalItems / rowsPerPage);


  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  pagination.innerHTML = '';
  const previousItem = document.createElement('li');
  previousItem.classList.add('page-item');
  const previousLink = document.createElement('a');
  previousLink.classList.add('page-link');
  previousLink.href = '#';
  previousLink.textContent = 'Previous';
  previousLink.addEventListener('click', function() {
    displayPage(currentPage - 1, localDataArray, rowsPerPage);
  });
  previousItem.appendChild(previousLink);
  pagination.appendChild(previousItem);

  for (let i = startPage; i <= endPage; i++) {
    const pageItem = document.createElement('li');
    pageItem.classList.add('page-item');
    pageItem.classList.toggle('active', i === currentPage);

    const pageLink = document.createElement('a');
    pageLink.classList.add('page-link');
    pageLink.href = '#';
    pageLink.textContent = i;

    pageLink.addEventListener('click', function() {
      displayPage(i, localDataArray, rowsPerPage);
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
    displayPage(currentPage + 1, localDataArray, rowsPerPage);
  });
  nextItem.appendChild(nextLink);
  pagination.appendChild(nextItem);

  previousLink.classList.toggle('disabled', currentPage === 1);
  nextLink.classList.toggle('disabled', currentPage === totalPages);
}

export { displayPage, updateVisiblePages };