const { ipcRenderer } = require('electron');

const selectFileButton = document.getElementById('select-file');
const processFileButton = document.getElementById('process-file');
const filePathElement = document.getElementById('file-path');
const statusElement = document.getElementById('status');
const selectCtgoPathButton = document.getElementById('select-ctgo-path');
const selectJsonPathButton = document.getElementById('select-json-path');
const ctgoPathElement = document.getElementById('ctgo-path');
const jsonPathElement = document.getElementById('json-path');
const dragDropArea = document.getElementById('drag-drop-area');
const fileDraggedPath = document.getElementById('file-dragged-path');

// Highlight the drag-and-drop area when a file is dragged over it
dragDropArea.addEventListener('dragover', (event) => {
  event.preventDefault();
  dragDropArea.style.borderColor = 'blue';
});

// Reset the style when the file leaves the drag-and-drop area
dragDropArea.addEventListener('dragleave', () => {
  dragDropArea.style.borderColor = '#ccc';
});

// Handle the file drop event
dragDropArea.addEventListener('drop', (event) => {
  event.preventDefault();
  dragDropArea.style.borderColor = '#ccc';

  // Check if a file was dropped
  if (event.dataTransfer.files.length > 0) {
    const file = event.dataTransfer.files[0];

    // Check if the file has a .csv extension
    if (file.name.endsWith('.csv')) {
      selectedFilePath = file.path;
      filePathElement.textContent = `Selected File: ${selectedFilePath}`;
      fileDraggedPath.textContent = `File dragged and selected: ${selectedFilePath}`;
      processFileButton.disabled = false;
    } else {
      fileDraggedPath.textContent = 'Error: Please drop a valid CSV file.';
      fileDraggedPath.style.color = 'red';
    }
  }
});

let selectedFilePath = null;
let selectedCtgoPath = null;
let selectedJsonPath = null;

selectFileButton.addEventListener('click', async () => {
  selectedFilePath = await ipcRenderer.invoke('select-csv');
  if (selectedFilePath) {
    filePathElement.textContent = `Selected File: ${selectedFilePath}`;
    processFileButton.disabled = false;
  } else {
    filePathElement.textContent = 'No file selected.';
    processFileButton.disabled = true;
  }
});

selectCtgoPathButton.addEventListener('click', async () => {
  selectedCtgoPath = await ipcRenderer.invoke('select-output', { defaultFileName: 'Template', extension: 'ctgo' });
  if (selectedCtgoPath) {
    ctgoPathElement.textContent = `CTGO Output: ${selectedCtgoPath}`;
  } else {
    ctgoPathElement.textContent = 'No file selected.';
  }
});

selectJsonPathButton.addEventListener('click', async () => {
  selectedJsonPath = await ipcRenderer.invoke('select-output', { defaultFileName: 'Template', extension: 'json' });
  if (selectedJsonPath) {
    jsonPathElement.textContent = `JSON Output: ${selectedJsonPath}`;
  } else {
    jsonPathElement.textContent = 'No file selected.';
  }
});

processFileButton.addEventListener('click', () => {
  if (selectedFilePath && selectedCtgoPath && selectedJsonPath) {
    ipcRenderer.send('process-file', {
      csvFilePath: selectedFilePath,
      ctgoPath: selectedCtgoPath,
      jsonPath: selectedJsonPath,
    });
    statusElement.textContent = 'Processing...';
  } else {
    statusElement.textContent = 'Please select all file paths.';
  }
});

ipcRenderer.on('processing-complete', (event, { message }) => {
  statusElement.textContent = message;
});

ipcRenderer.on('processing-error', (event, { message }) => {
  statusElement.textContent = message;
});
