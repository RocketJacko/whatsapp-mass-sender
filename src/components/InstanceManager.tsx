import React, { useState } from 'react';
import { Play, Pause, Stop, Trash2, QrCode, Smartphone } from 'lucide-react';
import WhatsAppInstance from './WhatsAppInstance';

interface WhatsAppInstanceData {
  id: string;
  name: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  qrCode?: string;
  phoneNumber?: string;
}

interface InstanceManagerProps {
  instances: WhatsAppInstanceData[];
  selectedInstance: string | null;
  onSelectInstance: (instanceId: string) => void;
  onRemoveInstance: (instanceId: string) => void;
}

const InstanceManager: React.FC<InstanceManagerProps> = ({
  instances,
  selectedInstance,
  onSelectInstance,
  onRemoveInstance
}) => {
  const [showQR, setShowQR] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'error':
        return 'Error';
      default:
        return 'Desconectado';
    }
  };

  const handleConnect = (instanceId: string) => {
    // Aquí se implementará la lógica de conexión con WhatsApp Web JS
    console.log('Conectando instancia:', instanceId);
  };

  const handleDisconnect = (instanceId: string) => {
    // Aquí se implementará la lógica de desconexión
    console.log('Desconectando instancia:', instanceId);
  };

  const handleStop = (instanceId: string) => {
    // Aquí se implementará la lógica de parada
    console.log('Parando instancia:', instanceId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-whatsapp-dark">Gestión de Instancias</h2>
        <div className="text-sm text-gray-600">
          {instances.length} instancia{instances.length !== 1 ? 's' : ''} configurada{instances.length !== 1 ? 's' : ''}
        </div>
      </div>

      {instances.length === 0 ? (
        <div className="whatsapp-card text-center py-12">
          <Smartphone size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay instancias configuradas</h3>
          <p className="text-gray-600">Crea una nueva instancia para comenzar a usar WhatsApp</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instances.map((instance) => (
            <div
              key={instance.id}
              className={`whatsapp-card cursor-pointer transition-all duration-200 ${
                selectedInstance === instance.id
                  ? 'ring-2 ring-whatsapp-green shadow-lg'
                  : 'hover:shadow-md'
              }`}
              onClick={() => onSelectInstance(instance.id)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{instance.name}</h3>
                  {instance.phoneNumber && (
                    <p className="text-sm text-gray-600">{instance.phoneNumber}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(instance.status)}`}></div>
                  <span className="text-xs text-gray-600">{getStatusText(instance.status)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  {instance.status === 'disconnected' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnect(instance.id);
                      }}
                      className="p-2 bg-whatsapp-green text-white rounded-lg hover:bg-whatsapp-dark transition-colors"
                      title="Conectar"
                    >
                      <Play size={16} />
                    </button>
                  )}
                  
                  {instance.status === 'connected' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDisconnect(instance.id);
                        }}
                        className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                        title="Pausar"
                      >
                        <Pause size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStop(instance.id);
                        }}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title="Detener"
                      >
                        <Stop size={16} />
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveInstance(instance.id);
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar instancia"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Escanear Código QR</h3>
            <div className="text-center">
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <QrCode size={200} className="mx-auto text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Abre WhatsApp en tu teléfono y escanea el código QR
              </p>
              <button
                onClick={() => setShowQR(null)}
                className="whatsapp-button"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstanceManager; 