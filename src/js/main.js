// main.js

import { readFileExcel, parseExcelFile, parseSelectedSheet } from './utils/fileUtils.js';
import { displayData } from './display/display.js';
import { showHeadersOptions } from './utils/statics.js';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap/dist/js/bootstrap.bundle.min.js';


const elementPage = document.getElementById('elementPages');
const rowsPerPage = elementPage.value;
const toolBar = document.getElementById('tools');
let dataArrayStatics = [];
//const txtDocument = "./src/test.txt"
//load an example txt on load
// fetch(txtDocument)
//     .then(rsp => rsp.text())
//     .then((data) => {
//         const localDataArray = parseTextFile(data);
//         displayData(localDataArray, rowsPerPage);
//     })

const sheetDropdown = document.getElementById('sheetDropdown'); // Assuming you have a dropdown in your HTML

function handleFileInputChange(){
    readFileExcel(fileInput, (content) => {
        const sheetNames = parseExcelFile(content);
        populateSheetDropDown(sheetNames);
    });
}

function handleReadFileBtnClick(){
    readFileExcel(fileInput, (content) => {
            const selectedSheetName = sheetDropdown.value;
            const localDataArray = parseSelectedSheet(content, selectedSheetName);
            dataArrayStatics = localDataArray;
            toolBar.style.display = "block";
            displayData(localDataArray, rowsPerPage);
    });
}

function populateSheetDropDown(sheetNames) {
    sheetDropdown.innerHTML = '';
    sheetNames.forEach((sheetName) => {
        const option = document.createElement('option');
        option.value = sheetName;
        option.text = sheetName;
        sheetDropdown.appendChild(option);
    });
};
    
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const readFileBtn = document.getElementById('readFile');
    const staticsBtn = document.getElementById('staticsBtn');
    
    fileInput.addEventListener('change', handleFileInputChange);
    readFileBtn.addEventListener('click', handleReadFileBtnClick);
    // staticsBtn.addEventListener('click', generateStatics(dataArrayStatics));

    const showHeadersBtn = document.getElementById('showHeadersBtn');
    showHeadersBtn.addEventListener('click', function () {
        // Llama a una función para mostrar los encabezados y opciones
        showHeadersOptions();
    });

});




