const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { processCsvAndGenerateJson } = require('./TemplateScript'); // Import your logic

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // Enable Node.js in renderer
      contextIsolation: false, // Allow Node.js modules
    },
  });

  mainWindow.loadFile('index.html');
});

ipcMain.handle('select-csv', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'CSV Files', extensions: ['csv'] }],
  });
  return result.filePaths[0]; // Return selected file path
});

ipcMain.handle('select-output', async (_, { defaultFileName, extension }) => {
  const result = await dialog.showSaveDialog({
    defaultPath: path.join(require('os').homedir(), 'Desktop', defaultFileName),
    filters: [{ name: `${extension.toUpperCase()} Files`, extensions: [extension] }],
  });
  return result.filePath; // Return selected file path
});

ipcMain.on('process-file', async (event, { csvFilePath, ctgoPath, jsonPath }) => {
  try {
    processCsvAndGenerateJson(csvFilePath, ctgoPath, jsonPath);
    event.reply('processing-complete', {
      message: `Files saved:\n${ctgoPath}\n${jsonPath}`,
    });
  } catch (error) {
    event.reply('processing-error', { message: `Error: ${error.message}` });
  }
});
