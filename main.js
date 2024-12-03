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

ipcMain.on('process-file', (event, { csvFilePath }) => {
  const desktopPath = path.join(require('os').homedir(), 'Desktop');
  const outputCtgoPath = path.join(desktopPath, 'output.ctgo');
  const outputJsonPath = path.join(desktopPath, 'output.json');

  processCsvAndGenerateJson(csvFilePath, outputCtgoPath, outputJsonPath);

  event.reply('processing-complete', {
    message: `Files saved to Desktop: \nTemplate.ctgo\nTemplate.json`,
  });
});
