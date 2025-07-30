import React, { useState } from 'react';
import { MessageCircle, Send, Clock, CheckCircle, XCircle, Play, Pause, Stop } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  name: string;
  category?: string;
  isActive: boolean;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
}

interface MessageManagerProps {}

const MessageManager: React.FC<MessageManagerProps> = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [showAddMessage, setShowAddMessage] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [newMessage, setNewMessage] = useState({ text: '', name: '', category: '' });
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '' });
  const [sendingStatus, setSendingStatus] = useState<'idle' | 'sending' | 'paused' | 'completed'>('idle');
  const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0 });

  const addMessage = () => {
    if (newMessage.text.trim() && newMessage.name.trim()) {
      const message: Message = {
        id: `message-${Date.now()}`,
        text: newMessage.text.trim(),
        name: newMessage.name.trim(),
        category: newMessage.category.trim() || undefined,
        isActive: true
      };
      setMessages([...messages, message]);
      setNewMessage({ text: '', name: '', category: '' });
      setShowAddMessage(false);
    }
  };

  const addTemplate = () => {
    if (newTemplate.name.trim() && newTemplate.content.trim()) {
      // Extraer variables del contenido (ej: {{nombre}}, {{empresa}})
      const variableRegex = /\{\{([^}]+)\}\}/g;
      const variables: string[] = [];
      let match;
      while ((match = variableRegex.exec(newTemplate.content)) !== null) {
        variables.push(match[1]);
      }

      const template: MessageTemplate = {
        id: `template-${Date.now()}`,
        name: newTemplate.name.trim(),
        content: newTemplate.content.trim(),
        variables: [...new Set(variables)] // Eliminar duplicados
      };
      setTemplates([...templates, template]);
      setNewTemplate({ name: '', content: '' });
      setShowAddTemplate(false);
    }
  };

  const removeMessage = (messageId: string) => {
    setMessages(messages.filter(message => message.id !== messageId));
  };

  const removeTemplate = (templateId: string) => {
    setTemplates(templates.filter(template => template.id !== templateId));
  };

  const toggleMessageStatus = (messageId: string) => {
    setMessages(messages.map(message => 
      message.id === messageId 
        ? { ...message, isActive: !message.isActive }
        : message
    ));
  };

  const startMassSend = async () => {
    setSendingStatus('sending');
    // Aquí se implementará la lógica de envío masivo
    console.log('Iniciando envío masivo...');
  };

  const pauseMassSend = () => {
    setSendingStatus('paused');
    console.log('Envío pausado');
  };

  const stopMassSend = () => {
    setSendingStatus('idle');
    setSendProgress({ sent: 0, total: 0 });
    console.log('Envío detenido');
  };

  const activeMessages = messages.filter(message => message.isActive);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-whatsapp-dark">Gestión de Mensajes</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddTemplate(true)}
            className="whatsapp-button flex items-center space-x-2"
          >
            <MessageCircle size={16} />
            <span>Nueva Plantilla</span>
          </button>
          <button
            onClick={() => setShowAddMessage(true)}
            className="whatsapp-button flex items-center space-x-2"
          >
            <Send size={16} />
            <span>Nuevo Mensaje</span>
          </button>
        </div>
      </div>

      {/* Mass Send Control */}
      {activeMessages.length > 0 && (
        <div className="whatsapp-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Control de Envío Masivo</h3>
            <div className="flex space-x-2">
              {sendingStatus === 'idle' && (
                <button
                  onClick={startMassSend}
                  className="whatsapp-button flex items-center space-x-2"
                >
                  <Play size={16} />
                  <span>Iniciar Envío</span>
                </button>
              )}
              {sendingStatus === 'sending' && (
                <>
                  <button
                    onClick={pauseMassSend}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Pause size={16} />
                    <span>Pausar</span>
                  </button>
                  <button
                    onClick={stopMassSend}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Stop size={16} />
                    <span>Detener</span>
                  </button>
                </>
              )}
              {sendingStatus === 'paused' && (
                <button
                  onClick={startMassSend}
                  className="whatsapp-button flex items-center space-x-2"
                >
                  <Play size={16} />
                  <span>Reanudar</span>
                </button>
              )}
            </div>
          </div>
          
          {sendingStatus !== 'idle' && (
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Progreso</span>
                <span className="text-sm text-gray-600">
                  {sendProgress.sent} / {sendProgress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-whatsapp-green h-2 rounded-full transition-all duration-300"
                  style={{ width: `${sendProgress.total > 0 ? (sendProgress.sent / sendProgress.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message Templates */}
      <div className="whatsapp-card">
        <h3 className="text-lg font-semibold mb-4">Plantillas de Mensajes</h3>
        {templates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle size={48} className="mx-auto mb-4" />
            <p>No hay plantillas configuradas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{template.name}</h4>
                  <button
                    onClick={() => removeTemplate(template.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-2">{template.content}</p>
                {template.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((variable) => (
                      <span
                        key={variable}
                        className="text-xs bg-whatsapp-green text-white px-2 py-1 rounded"
                      >
                        {variable}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Messages */}
      <div className="whatsapp-card">
        <h3 className="text-lg font-semibold mb-4">
          Mensajes Activos ({activeMessages.length})
        </h3>
        {activeMessages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Send size={48} className="mx-auto mb-4" />
            <p>No hay mensajes activos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeMessages.map((message) => (
              <div
                key={message.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-whatsapp-green"></div>
                  <div>
                    <p className="font-medium">{message.name}</p>
                    <p className="text-sm text-gray-600">{message.text}</p>
                    {message.category && (
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                        {message.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleMessageStatus(message.id)}
                    className="text-yellow-500 hover:text-yellow-700"
                    title="Desactivar mensaje"
                  >
                    <CheckCircle size={16} />
                  </button>
                  <button
                    onClick={() => removeMessage(message.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Eliminar mensaje"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Message Modal */}
      {showAddMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Nuevo Mensaje</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Mensaje
                </label>
                <input
                  type="text"
                  value={newMessage.name}
                  onChange={(e) => setNewMessage({...newMessage, name: e.target.value})}
                  className="whatsapp-input"
                  placeholder="Ej: Promoción Fisora"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenido del Mensaje
                </label>
                <textarea
                  value={newMessage.text}
                  onChange={(e) => setNewMessage({...newMessage, text: e.target.value})}
                  className="whatsapp-input"
                  rows={4}
                  placeholder="Escribe tu mensaje aquí..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría (opcional)
                </label>
                <input
                  type="text"
                  value={newMessage.category}
                  onChange={(e) => setNewMessage({...newMessage, category: e.target.value})}
                  className="whatsapp-input"
                  placeholder="Ej: Fisora Embarrados"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowAddMessage(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={addMessage}
                className="whatsapp-button"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Template Modal */}
      {showAddTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Nueva Plantilla</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Plantilla
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                  className="whatsapp-input"
                  placeholder="Ej: Promoción Fisora"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenido de la Plantilla
                </label>
                <textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                  className="whatsapp-input"
                  rows={6}
                  placeholder="Hola {{nombre}}, te invitamos a conocer nuestros productos {{empresa}}..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usa {{variable}} para crear variables dinámicas
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowAddTemplate(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={addTemplate}
                className="whatsapp-button"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageManager; 