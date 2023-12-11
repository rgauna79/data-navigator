// fileUtils.js
import * as XLSX from 'xlsx';

// Function to read a file and invoke a callback with its content
function readFile(fileInput, callback) {
    const file = fileInput.files[0];
  
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const content = event.target.result;
        callback(content);
      };
  
      reader.readAsText(file);
    }
  }
  
  // Function to parse the content of a tab-separated text file
  function parseTextFile(content) {
    const lines = content.split('\n');
    const headers = lines[0].trim().split('\t');
    const localDataArray = [];
  
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].trim().split('\t');
      const record = {};
  
      for (let j = 0; j < headers.length; j++) {
        record[headers[j]] = values[j];
      }
  
      localDataArray.push(record);
    }
  
    return localDataArray;
  }
  
 // Function to read a file and invoke a callback with its content
function readFileExcel(fileInput, callback) {
  const file = fileInput.files[0];

  if (file) {
      const reader = new FileReader();

      reader.onload = function (event) {
          const content = event.target.result;
          callback(content);
      };

      reader.readAsBinaryString(file); // Use readAsBinaryString for Excel files
  }
}
 
 // Function to parse the content of an Excel file
function parseExcelFile(content) {
  const workbook = XLSX.read(content, { type: 'binary' });
    const sheetNames = workbook.SheetNames;
    return sheetNames;
  };

  function excelDateToJSDate(excelDate) {
    // Excel's date system starts from December 30, 1899
    const excelStartDate = new Date('1899-12-30T00:00:00Z');

    // Convert days to milliseconds and add to the start date
    const jsDate = new Date(excelStartDate.getTime() + excelDate * 24 * 60 * 60 * 1000);

    return jsDate;
}
  // Function to parse the content of a specific sheet in an Excel file
function parseSelectedSheet(content, selectedSheetName) {
  const workbook = XLSX.read(content, { type: 'binary' });
  const excelData = XLSX.utils.sheet_to_json(workbook.Sheets[selectedSheetName], { raw: false });

  // Convert Excel dates to JavaScript Date objects
  excelData.forEach((row) => {
      Object.keys(row).forEach((key) => {
          if (typeof row[key] === 'number' && XLSX.SSF.parse_date_code(row[key])) {
              row[key] = excelDateToJSDate(row[key]);
          }
      });
  });

  return excelData;
}

  // Export the functions for use in other modules
  export { readFile, parseTextFile, readFileExcel, parseExcelFile, parseSelectedSheet };
  