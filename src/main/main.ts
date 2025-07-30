const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  // Cargar la aplicación
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  return mainWindow;
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers para comunicación con el renderer
ipcMain.handle('get-stored-instances', () => {
  return store.get('whatsapp-instances', []);
});

ipcMain.handle('save-instance', (event, instance) => {
  const instances = store.get('whatsapp-instances', []);
  instances.push(instance);
  store.set('whatsapp-instances', instances);
  return true;
});

ipcMain.handle('remove-instance', (event, instanceId) => {
  const instances = store.get('whatsapp-instances', []);
  const filteredInstances = instances.filter((inst) => inst.id !== instanceId);
  store.set('whatsapp-instances', filteredInstances);
  return true;
}); 