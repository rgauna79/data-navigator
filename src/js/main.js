import {
  readFileExcel,
  parseExcelFile,
  parseSelectedSheet,
} from "./utils/fileUtils.js";
import { displayData } from "./display/display.js";
import { showHeadersOptions } from "./utils/statics.js";

const rowsPerPage = document.getElementById("elementPages").value;
const toolBar = document.getElementById("tools");
const inputContainer = document.getElementById("inputContainer");
const sheetDropdown = document.getElementById("sheetDropdown");
const readFileBtn = document.getElementById("readFile");
const fileInput = document.getElementById("fileInput");

function handleFileInputChange() {
  const sheetLoaderContainer = document.getElementById("sheetLoaderContainer");
  const loadingMessage = document.getElementById("loadingMessage");

  loadingMessage.classList.add(
    "d-flex",
    "justify-content-center",
    "align-items-center",
    "p-3"
  );
  loadingMessage.innerHTML = `Loading<div class="spinner-border m-2" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>`;

  if (fileInput.files.length === 0) {
    return;
  }
  console.log("Before reading file: " + loadingMessage.innerHTML);

  readFileExcel(fileInput)
    .then((content) => {
      console.log("Reading file: " + loadingMessage.innerHTML);
      const sheetNames = parseExcelFile(content);
      populateSheetDropDown(sheetNames);
      sheetLoaderContainer.classList.add(
        "d-flex",
        "justify-content-start",
        "gap-4"
      );
      inputContainer.classList.remove("input-group");
      inputContainer.style.display = "none";
      //loadingMessage.textContent = "";
      setTimeout(() => {
        loadingMessage.innerHTML = "";
      }, 500);
    })
    .catch((error) => {
      console.error("Error reading file:", error);
    });
}

function handleReadFileBtnClick() {
  readFileBtn.disabled = true; // Disable the button
  readFileBtn.innerHTML = `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        <span role="status">Loading...</span>`;

  readFileExcel(fileInput)
    .then((content) => {
      const selectedSheetName = sheetDropdown.value;
      const localDataArray = parseSelectedSheet(content, selectedSheetName);
      toolBar.style.display = "block";
      displayData(localDataArray, rowsPerPage);
    })
    .catch((error) => {
      console.error("Error reading file:", error);
    })
    .finally(() => {
      // Re-enable the button once the loading is complete
      readFileBtn.disabled = false;
      readFileBtn.innerHTML = "Load sheet";
    });
}

function populateSheetDropDown(sheetNames) {
  sheetDropdown.innerHTML = "";
  sheetNames.forEach((sheetName) => {
    const option = document.createElement("option");
    option.value = sheetName;
    option.text = sheetName;
    sheetDropdown.appendChild(option);
  });
}

function resetContent() {
  const sheetLoaderContainer = document.getElementById("sheetLoaderContainer");
  const loadingMessage = document.getElementById("loadingMessage");
  const inputContainer = document.getElementById("inputContainer");
  const toolBar = document.getElementById("tools");
  sheetLoaderContainer.classList.remove(
    "d-flex",
    "justify-content-start",
    "gap-4"
  );
  //loadingMessage.textContent = "";
  inputContainer.classList.add("input-group");
  inputContainer.style.display = "flex";
  toolBar.style.display = "none";
  sheetLoaderContainer.classList.remove(
    "d-flex",
    "justify-content-start",
    "gap-4"
  );
  document.getElementById("dataSection").innerHTML = "";
  fileInput.value = "";
}

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");

  const restartApp = document.getElementById("resetFile");
  const showHeadersBtn = document.getElementById("showHeadersBtn");

  fileInput.addEventListener("change", handleFileInputChange);
  readFileBtn.addEventListener("click", handleReadFileBtnClick);
  restartApp.addEventListener("click", resetContent);
  showHeadersBtn.addEventListener("click", showHeadersOptions);
});

// Update the current year dynamically
document.getElementById("currentYear").textContent = new Date().getFullYear();
