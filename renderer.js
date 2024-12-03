const { ipcRenderer } = require('electron');

const selectFileButton = document.getElementById('select-file');
const processFileButton = document.getElementById('process-file');
const filePathElement = document.getElementById('file-path');
const statusElement = document.getElementById('status');
const selectCtgoPathButton = document.getElementById('select-ctgo-path');
const selectJsonPathButton = document.getElementById('select-json-path');
const ctgoPathElement = document.getElementById('ctgo-path');
const jsonPathElement = document.getElementById('json-path');

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
