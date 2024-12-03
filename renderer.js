const { ipcRenderer } = require('electron');

const selectFileButton = document.getElementById('select-file');
const processFileButton = document.getElementById('process-file');
const filePathElement = document.getElementById('file-path');
const statusElement = document.getElementById('status');

let selectedFilePath = null;

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

processFileButton.addEventListener('click', () => {
  if (selectedFilePath) {
    ipcRenderer.send('process-file', { csvFilePath: selectedFilePath });
    statusElement.textContent = 'Processing...';
  }
});

ipcRenderer.on('processing-complete', (event, { message }) => {
  statusElement.textContent = message;
});
