import React, { useState } from 'react';
import { Users, Plus, Upload, Download, Trash2, Edit, FolderOpen } from 'lucide-react';

interface Contact {
  id: string;
  phoneNumber: string;
  name?: string;
  category: string;
  hasWhatsApp?: boolean;
}

interface ContactListProps {}

const ContactList: React.FC<ContactListProps> = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [categories, setCategories] = useState<string[]>(['General']);
  const [selectedCategory, setSelectedCategory] = useState<string>('General');
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newContact, setNewContact] = useState({ phoneNumber: '', name: '', category: 'General' });
  const [newCategory, setNewCategory] = useState('');

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
      setShowAddCategory(false);
    }
  };

  const addContact = () => {
    if (newContact.phoneNumber.trim()) {
      const contact: Contact = {
        id: `contact-${Date.now()}`,
        phoneNumber: newContact.phoneNumber.trim(),
        name: newContact.name.trim() || undefined,
        category: newContact.category
      };
      setContacts([...contacts, contact]);
      setNewContact({ phoneNumber: '', name: '', category: 'General' });
      setShowAddContact(false);
    }
  };

  const removeContact = (contactId: string) => {
    setContacts(contacts.filter(contact => contact.id !== contactId));
  };

  const removeCategory = (category: string) => {
    if (category !== 'General') {
      setCategories(categories.filter(cat => cat !== category));
      setContacts(contacts.filter(contact => contact.category !== category));
      if (selectedCategory === category) {
        setSelectedCategory('General');
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const newContacts: Contact[] = lines.map((line, index) => {
          const [phoneNumber, name] = line.split(',').map(item => item.trim());
          return {
            id: `contact-upload-${Date.now()}-${index}`,
            phoneNumber: phoneNumber || '',
            name: name || undefined,
            category: selectedCategory
          };
        });
        setContacts([...contacts, ...newContacts]);
      };
      reader.readAsText(file);
    }
  };

  const exportContacts = () => {
    const csvContent = contacts
      .filter(contact => contact.category === selectedCategory)
      .map(contact => `${contact.phoneNumber},${contact.name || ''}`)
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contactos-${selectedCategory}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredContacts = contacts.filter(contact => contact.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-whatsapp-dark">Gestión de Contactos</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddCategory(true)}
            className="whatsapp-button flex items-center space-x-2"
          >
            <FolderOpen size={16} />
            <span>Nueva Categoría</span>
          </button>
          <button
            onClick={() => setShowAddContact(true)}
            className="whatsapp-button flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Agregar Contacto</span>
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="whatsapp-card">
        <h3 className="text-lg font-semibold mb-4">Categorías</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-whatsapp-green text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category}
              {category !== 'General' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCategory(category);
                  }}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Contact List */}
      <div className="whatsapp-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Contactos - {selectedCategory} ({filteredContacts.length})
          </h3>
          <div className="flex space-x-2">
            <label className="whatsapp-button flex items-center space-x-2 cursor-pointer">
              <Upload size={16} />
              <span>Importar Excel</span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={exportContacts}
              className="whatsapp-button flex items-center space-x-2"
            >
              <Download size={16} />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {filteredContacts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users size={48} className="mx-auto mb-4" />
            <p>No hay contactos en esta categoría</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-whatsapp-green"></div>
                  <div>
                    <p className="font-medium">{contact.phoneNumber}</p>
                    {contact.name && (
                      <p className="text-sm text-gray-600">{contact.name}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {contact.hasWhatsApp !== undefined && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      contact.hasWhatsApp 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {contact.hasWhatsApp ? 'WhatsApp' : 'No WhatsApp'}
                    </span>
                  )}
                  <button
                    onClick={() => removeContact(contact.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Agregar Contacto</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Teléfono
                </label>
                <input
                  type="tel"
                  value={newContact.phoneNumber}
                  onChange={(e) => setNewContact({...newContact, phoneNumber: e.target.value})}
                  className="whatsapp-input"
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre (opcional)
                </label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                  className="whatsapp-input"
                  placeholder="Nombre del contacto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={newContact.category}
                  onChange={(e) => setNewContact({...newContact, category: e.target.value})}
                  className="whatsapp-input"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowAddContact(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={addContact}
                className="whatsapp-button"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Nueva Categoría</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Categoría
              </label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="whatsapp-input"
                placeholder="Ej: Fisora Embarrados"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowAddCategory(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={addCategory}
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

export default ContactList; 