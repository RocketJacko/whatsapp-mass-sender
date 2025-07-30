const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const DatabaseManager = require('../database/database.js');

// Store para las instancias
const instances = new Map();
let db;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    titleBarStyle: 'default',
    show: false
  });

  // Cargar la aplicación
  mainWindow.loadURL('http://localhost:5178');
  mainWindow.webContents.openDevTools();

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  return mainWindow;
}

// Función para crear una nueva instancia de WhatsApp
function createWhatsAppInstance(instanceId, instanceName) {
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: instanceId
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    }
  });

  // Eventos del cliente
  client.on('qr', (qr) => {
    console.log('QR RECEIVED for instance:', instanceId, qr);
    // Enviar QR al renderer
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('qr-received', { instanceId, qr });
    }
  });

  client.on('ready', async () => {
    console.log('Client is ready for instance:', instanceId);
    // Actualizar estado en la base de datos
    await db.updateInstanceStatus(instanceId, 'connected');
    
    // Enviar estado al renderer
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      console.log('Sending client-ready event to renderer for instance:', instanceId);
      mainWindow.webContents.send('client-ready', { instanceId });
      
      // Forzar actualización después de un delay
      setTimeout(() => {
        mainWindow.webContents.send('client-ready', { instanceId });
      }, 1000);
    } else {
      console.log('No mainWindow found when client is ready');
    }
  });

  client.on('authenticated', async () => {
    console.log('Client is authenticated for instance:', instanceId);
    // Actualizar estado en la base de datos
    await db.updateInstanceStatus(instanceId, 'connected');
    
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      console.log('Sending client-authenticated event to renderer for instance:', instanceId);
      mainWindow.webContents.send('client-authenticated', { instanceId });
      
      // Forzar actualización después de un delay
      setTimeout(() => {
        mainWindow.webContents.send('client-authenticated', { instanceId });
      }, 1000);
    } else {
      console.log('No mainWindow found when client is authenticated');
    }
  });

  client.on('auth_failure', async (msg) => {
    console.log('Auth failure for instance:', instanceId, msg);
    // Actualizar estado en la base de datos
    await db.updateInstanceStatus(instanceId, 'error');
    
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('auth-failure', { instanceId, message: msg });
    }
  });

  client.on('disconnected', async (reason) => {
    console.log('Client was disconnected for instance:', instanceId, reason);
    // Actualizar estado en la base de datos
    await db.updateInstanceStatus(instanceId, 'disconnected');
    
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('client-disconnected', { instanceId, reason });
    }
  });

  // Inicializar el cliente
  client.initialize();

  // Guardar la instancia
  instances.set(instanceId, {
    client,
    name: instanceName,
    status: 'connecting'
  });

  return client;
}

app.whenReady().then(async () => {
  // Inicializar base de datos
  db = new DatabaseManager();
  await db.initDatabase();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Cerrar base de datos
    if (db) {
      db.close();
    }
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('create-instance', async (event, { instanceId, instanceName }) => {
  try {
    // Crear instancia en la base de datos
    await db.createInstance({
      id: instanceId,
      name: instanceName,
      status: 'connecting'
    });
    
    // Crear instancia de WhatsApp
    createWhatsAppInstance(instanceId, instanceName);
    return { success: true };
  } catch (error) {
    console.error('Error creating instance:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('disconnect-instance', async (event, { instanceId }) => {
  try {
    const instance = instances.get(instanceId);
    if (instance) {
      instance.client.destroy();
      instances.delete(instanceId);
    }
    
    // Marcar como inactiva en la base de datos
    await db.deleteInstance(instanceId);
    return { success: true };
  } catch (error) {
    console.error('Error disconnecting instance:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-all-instances', async (event) => {
  try {
    const instances = await db.getAllInstances();
    return { success: true, instances };
  } catch (error) {
    console.error('Error getting instances:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('send-message', async (event, { instanceId, phoneNumber, message }) => {
  try {
    const instance = instances.get(instanceId);
    if (instance && instance.client) {
      const chatId = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
      
      // Guardar mensaje en la base de datos
      const messageResult = await db.createMessage(instanceId, phoneNumber, message);
      
      const result = await instance.client.sendMessage(chatId, message);
      
      // Actualizar estado del mensaje
      await db.updateMessageStatus(messageResult.lastInsertRowid, 'sent');
      
      return { success: true, result };
    }
    return { success: false, error: 'Instance not found or not ready' };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('check-number', async (event, { instanceId, phoneNumber }) => {
  try {
    const instance = instances.get(instanceId);
    if (instance && instance.client) {
      const chatId = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
      const contact = await instance.client.getContactById(chatId);
      return { success: true, exists: !!contact, contact };
    }
    return { success: false, error: 'Instance not found or not ready' };
  } catch (error) {
    console.error('Error checking number:', error);
    return { success: false, error: error.message };
  }
}); 