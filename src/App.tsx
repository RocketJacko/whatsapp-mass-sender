import React, { useState, useEffect } from 'react';
import { MessageCircle, Users, Settings, Plus, Trash2, Play, Pause, Square, X } from 'lucide-react';
import QRCode from 'qrcode';

interface WhatsAppInstanceData {
  id: string;
  name: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  qrCode?: string;
  phoneNumber?: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<'instances' | 'contacts' | 'messages' | 'settings'>('instances');
  const [instances, setInstances] = useState<WhatsAppInstanceData[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState<{ instanceId: string; qr: string } | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string>('');

  useEffect(() => {
    // Escuchar eventos de WhatsApp desde el proceso principal
    const { ipcRenderer } = require('electron');

    // Cargar instancias existentes al iniciar
    const loadExistingInstances = async () => {
      try {
        const result = await ipcRenderer.invoke('get-all-instances');
        if (result.success) {
          const dbInstances = result.instances.map((dbInstance: any) => ({
            id: dbInstance.id,
            name: dbInstance.name,
            status: dbInstance.status as 'disconnected' | 'connecting' | 'connected' | 'error',
            phoneNumber: dbInstance.phone_number,
            description: dbInstance.description
          }));
          setInstances(dbInstances);
        }
      } catch (error) {
        console.error('Error loading instances:', error);
      }
    };

    // Cargar instancias al iniciar
    loadExistingInstances();

    const handleQRReceived = async (event: any, data: any) => {
      console.log('QR received:', data);
      setQrData(data);
      setShowQRModal(true);
      
      // Generar QR visual
      try {
        const qrImage = await QRCode.toDataURL(data.qr, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrImageUrl(qrImage);
      } catch (error) {
        console.error('Error generating QR:', error);
      }
      
      // Actualizar estado de la instancia
      setInstances(prev => prev.map(inst => 
        inst.id === data.instanceId 
          ? { ...inst, status: 'connecting', qrCode: data.qr }
          : inst
      ));
    };

    const handleClientReady = (event: any, data: any) => {
      console.log('Client ready event received in renderer:', data);
      setInstances(prev => prev.map(inst => 
        inst.id === data.instanceId 
          ? { ...inst, status: 'connected' }
          : inst
      ));
      setShowQRModal(false);
      setQrData(null);
      setQrImageUrl('');
    };

    const handleClientAuthenticated = (event: any, data: any) => {
      console.log('Client authenticated event received in renderer:', data);
      setInstances(prev => prev.map(inst => 
        inst.id === data.instanceId 
          ? { ...inst, status: 'connected' }
          : inst
      ));
      setShowQRModal(false);
      setQrData(null);
      setQrImageUrl('');
    };

    const handleAuthFailure = (event: any, data: any) => {
      console.log('Auth failure:', data);
      setInstances(prev => prev.map(inst => 
        inst.id === data.instanceId 
          ? { ...inst, status: 'error' }
          : inst
      ));
      setShowQRModal(false);
      setQrData(null);
      setQrImageUrl('');
    };

    const handleClientDisconnected = (event: any, data: any) => {
      console.log('Client disconnected:', data);
      setInstances(prev => prev.map(inst => 
        inst.id === data.instanceId 
          ? { ...inst, status: 'disconnected' }
          : inst
      ));
    };

    // Agregar listeners
    ipcRenderer.on('qr-received', handleQRReceived);
    ipcRenderer.on('client-ready', handleClientReady);
    ipcRenderer.on('client-authenticated', handleClientAuthenticated);
    ipcRenderer.on('auth-failure', handleAuthFailure);
    ipcRenderer.on('client-disconnected', handleClientDisconnected);

    return () => {
      ipcRenderer.removeListener('qr-received', handleQRReceived);
      ipcRenderer.removeListener('client-ready', handleClientReady);
      ipcRenderer.removeListener('client-authenticated', handleClientAuthenticated);
      ipcRenderer.removeListener('auth-failure', handleAuthFailure);
      ipcRenderer.removeListener('client-disconnected', handleClientDisconnected);
    };
  }, []);

  const addNewInstance = async () => {
    const newInstance: WhatsAppInstanceData = {
      id: `instance-${Date.now()}`,
      name: `Instancia ${instances.length + 1}`,
      status: 'connecting'
    };
    
    setInstances([...instances, newInstance]);
    setSelectedInstance(newInstance.id);

    // Crear la instancia en el proceso principal
    try {
      const { ipcRenderer } = require('electron');
      const result = await ipcRenderer.invoke('create-instance', {
        instanceId: newInstance.id,
        instanceName: newInstance.name
      });
      
      if (!result.success) {
        console.error('Error creating instance:', result.error);
        setInstances(prev => prev.map(inst => 
          inst.id === newInstance.id 
            ? { ...inst, status: 'error' }
            : inst
        ));
      }
    } catch (error) {
      console.error('Error creating instance:', error);
      setInstances(prev => prev.map(inst => 
        inst.id === newInstance.id 
          ? { ...inst, status: 'error' }
          : inst
      ));
    }
  };

  const removeInstance = async (instanceId: string) => {
    try {
      const { ipcRenderer } = require('electron');
      await ipcRenderer.invoke('disconnect-instance', { instanceId });
    } catch (error) {
      console.error('Error disconnecting instance:', error);
    }
    
    setInstances(instances.filter(inst => inst.id !== instanceId));
    if (selectedInstance === instanceId) {
      setSelectedInstance(null);
    }
  };

  const forceUpdateInstance = (instanceId: string) => {
    setInstances(prev => prev.map(inst => 
      inst.id === instanceId 
        ? { ...inst, status: 'connected' }
        : inst
    ));
    setShowQRModal(false);
    setQrData(null);
    setQrImageUrl('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      case 'error': return 'Error';
      default: return 'Desconectado';
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">WhatsApp Mass Sender</h1>
          <p className="text-sm text-gray-600">Gestión de envíos masivos</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveTab('instances')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'instances' 
                    ? 'bg-green-500 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MessageCircle size={20} />
                <span>Instancias</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('contacts')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'contacts' 
                    ? 'bg-green-500 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Users size={20} />
                <span>Contactos</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('messages')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'messages' 
                    ? 'bg-green-500 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MessageCircle size={20} />
                <span>Mensajes</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'settings' 
                    ? 'bg-green-500 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Settings size={20} />
                <span>Configuración</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Add Instance Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={addNewInstance}
            className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus size={20} />
            <span>Nueva Instancia</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {activeTab === 'instances' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Instancias de WhatsApp</h2>
              {instances.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay instancias creadas</p>
                  <p className="text-sm text-gray-400">Haz clic en "Nueva Instancia" para comenzar</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {instances.map((instance) => (
                    <div key={instance.id} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">{instance.name}</h3>
                          <p className={`text-sm ${getStatusColor(instance.status)}`}>
                            Estado: {getStatusText(instance.status)}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button className="p-2 text-green-600 hover:bg-green-50 rounded">
                            <Play size={16} />
                          </button>
                          <button className="p-2 text-yellow-600 hover:bg-yellow-50 rounded">
                            <Pause size={16} />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                            <Square size={16} />
                          </button>
                          <button 
                            onClick={() => removeInstance(instance.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                          {instance.status === 'connecting' && (
                            <button 
                              onClick={() => forceUpdateInstance(instance.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="Forzar conexión"
                            >
                              <MessageCircle size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'contacts' && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Contactos</h2>
              <p className="text-gray-600">Aquí podrás gestionar tus listas de contactos</p>
            </div>
          )}
          {activeTab === 'messages' && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Mensajes</h2>
              <p className="text-gray-600">Aquí podrás gestionar tus plantillas de mensajes</p>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Configuración</h2>
              <p className="text-gray-600">Configuración de la aplicación</p>
            </div>
          )}
        </div>
      </div>

      {/* QR Modal */}
      {showQRModal && qrData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Escanear Código QR</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Escanea este código QR con tu WhatsApp para conectar la instancia
              </p>
              {qrImageUrl ? (
                <div className="flex justify-center mb-4">
                  <img 
                    src={qrImageUrl} 
                    alt="QR Code" 
                    className="border border-gray-300 rounded-lg"
                    style={{ width: '300px', height: '300px' }}
                  />
                </div>
              ) : (
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <div className="text-xs font-mono text-gray-700 break-all">
                    {qrData.qr}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500">
                Instancia: {qrData.instanceId}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 