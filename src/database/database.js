const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseManager {
  constructor() {
    // Determinar la ruta de la base de datos según el entorno
    let dbDir;
    
    if (process.env.NODE_ENV === 'development') {
      // En desarrollo, usar el directorio actual
      dbDir = path.join(process.cwd(), 'data');
    } else {
      // En producción (ejecutable), usar el directorio de la aplicación
      const { app } = require('electron');
      dbDir = path.join(app.getPath('userData'), 'data');
    }
    
    // Crear directorio de base de datos si no existe
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Inicializar base de datos
    this.dbPath = path.join(dbDir, 'whatsapp_instances.db');
    this.db = new sqlite3.Database(this.dbPath);
    // initDatabase es ahora llamado con await en main.js
  }

  initDatabase() {
    return new Promise((resolve, reject) => {
      // Habilitar foreign keys
      this.db.run('PRAGMA foreign_keys = ON');

      // Crear tabla de instancias
      this.db.run(`
        CREATE TABLE IF NOT EXISTS instances (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          status TEXT CHECK(status IN ('disconnected', 'connecting', 'connected', 'error')) DEFAULT 'disconnected',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_connected_at DATETIME NULL,
          phone_number VARCHAR(20) NULL,
          description TEXT NULL,
          is_active BOOLEAN DEFAULT 1,
          settings TEXT NULL
        )
      `, (err) => {
        if (err) {
          console.error('Error creating instances table:', err);
          reject(err);
          return;
        }

        // Crear tabla de sesiones
        this.db.run(`
          CREATE TABLE IF NOT EXISTS instance_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            instance_id VARCHAR(255),
            session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
            session_end DATETIME NULL,
            status VARCHAR(50),
            error_message TEXT NULL,
            FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE
          )
        `, (err) => {
          if (err) {
            console.error('Error creating sessions table:', err);
            reject(err);
            return;
          }

          // Crear tabla de mensajes
          this.db.run(`
            CREATE TABLE IF NOT EXISTS instance_messages (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              instance_id VARCHAR(255),
              phone_number VARCHAR(20),
              message_text TEXT,
              sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              status TEXT CHECK(status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
              error_message TEXT NULL,
              FOREIGN KEY (instance_id) REFERENCES instances(id) ON DELETE CASCADE
            )
          `, (err) => {
            if (err) {
              console.error('Error creating messages table:', err);
              reject(err);
              return;
            }

            // Crear tabla de listas de contactos
            this.db.run(`
              CREATE TABLE IF NOT EXISTS contact_lists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) NOT NULL,
                description TEXT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1
              )
            `, (err) => {
              if (err) {
                console.error('Error creating contact_lists table:', err);
                reject(err);
                return;
              }

              // Crear tabla de contactos
              this.db.run(`
                CREATE TABLE IF NOT EXISTS contacts (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  list_id INTEGER,
                  phone_number VARCHAR(20) NOT NULL,
                  name VARCHAR(255) NULL,
                  email VARCHAR(255) NULL,
                  notes TEXT NULL,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (list_id) REFERENCES contact_lists(id) ON DELETE CASCADE
                )
              `, (err) => {
                if (err) {
                  console.error('Error creating contacts table:', err);
                  reject(err);
                  return;
                }

                // Crear tabla de plantillas de mensajes
                this.db.run(`
                  CREATE TABLE IF NOT EXISTS message_templates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(255) NOT NULL,
                    template_text TEXT NOT NULL,
                    variables TEXT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT 1
                  )
                `, (err) => {
                  if (err) {
                    console.error('Error creating templates table:', err);
                    reject(err);
                    return;
                  }

                  // Crear índices para mejor rendimiento
                  const indexes = [
                    'CREATE INDEX IF NOT EXISTS idx_instances_status ON instances(status)',
                    'CREATE INDEX IF NOT EXISTS idx_instances_active ON instances(is_active)',
                    'CREATE INDEX IF NOT EXISTS idx_sessions_instance ON instance_sessions(instance_id)',
                    'CREATE INDEX IF NOT EXISTS idx_messages_instance ON instance_messages(instance_id)',
                    'CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON instance_messages(sent_at)',
                    'CREATE INDEX IF NOT EXISTS idx_contacts_list ON contacts(list_id)',
                    'CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone_number)'
                  ];

                  let completed = 0;
                  indexes.forEach((index, i) => {
                    this.db.run(index, (err) => {
                      if (err) {
                        console.error('Error creating index:', err);
                      }
                      completed++;
                      if (completed === indexes.length) {
                        console.log('Base de datos inicializada correctamente');
                        resolve();
                      }
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  // Métodos para instancias
  createInstance(instanceData) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO instances (id, name, status, description)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run([
        instanceData.id,
        instanceData.name,
        instanceData.status || 'connecting',
        instanceData.description || null
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastInsertRowid: this.lastID });
        }
      });
      
      stmt.finalize();
    });
  }

  updateInstanceStatus(instanceId, status, phoneNumber = null) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        UPDATE instances 
        SET status = ?, 
            updated_at = CURRENT_TIMESTAMP,
            last_connected_at = CASE WHEN ? = 'connected' THEN CURRENT_TIMESTAMP ELSE last_connected_at END,
            phone_number = CASE WHEN ? IS NOT NULL THEN ? ELSE phone_number END
        WHERE id = ?
      `);
      
      stmt.run([status, status, phoneNumber, phoneNumber, instanceId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
      
      stmt.finalize();
    });
  }

  getAllInstances() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM instances 
        WHERE is_active = 1 
        ORDER BY created_at DESC
      `, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  getInstanceById(instanceId) {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT * FROM instances WHERE id = ?
      `, [instanceId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  deleteInstance(instanceId) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        UPDATE instances SET is_active = 0 WHERE id = ?
      `);
      
      stmt.run([instanceId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
      
      stmt.finalize();
    });
  }

  // Métodos para sesiones
  createSession(instanceId, status) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO instance_sessions (instance_id, status)
        VALUES (?, ?)
      `);
      
      stmt.run([instanceId, status], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastInsertRowid: this.lastID });
        }
      });
      
      stmt.finalize();
    });
  }

  updateSession(sessionId, status, errorMessage = null) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        UPDATE instance_sessions 
        SET status = ?, 
            session_end = CASE WHEN ? IN ('disconnected', 'error') THEN CURRENT_TIMESTAMP ELSE NULL END,
            error_message = ?
        WHERE id = ?
      `);
      
      stmt.run([status, status, errorMessage, sessionId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
      
      stmt.finalize();
    });
  }

  // Métodos para mensajes
  createMessage(instanceId, phoneNumber, messageText) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO instance_messages (instance_id, phone_number, message_text, status)
        VALUES (?, ?, ?, 'pending')
      `);
      
      stmt.run([instanceId, phoneNumber, messageText], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastInsertRowid: this.lastID });
        }
      });
      
      stmt.finalize();
    });
  }

  updateMessageStatus(messageId, status, errorMessage = null) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        UPDATE instance_messages 
        SET status = ?, error_message = ?
        WHERE id = ?
      `);
      
      stmt.run([status, errorMessage, messageId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
      
      stmt.finalize();
    });
  }

  // Métodos para listas de contactos
  createContactList(name, description = null) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO contact_lists (name, description)
        VALUES (?, ?)
      `);
      
      stmt.run([name, description], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastInsertRowid: this.lastID });
        }
      });
      
      stmt.finalize();
    });
  }

  addContactToList(listId, phoneNumber, name = null, email = null, notes = null) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO contacts (list_id, phone_number, name, email, notes)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run([listId, phoneNumber, name, email, notes], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastInsertRowid: this.lastID });
        }
      });
      
      stmt.finalize();
    });
  }

  getContactsByList(listId) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM contacts WHERE list_id = ?
      `, [listId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Métodos para plantillas
  createMessageTemplate(name, templateText, variables = null) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO message_templates (name, template_text, variables)
        VALUES (?, ?, ?)
      `);
      
      stmt.run([name, templateText, variables ? JSON.stringify(variables) : null], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastInsertRowid: this.lastID });
        }
      });
      
      stmt.finalize();
    });
  }

  getAllTemplates() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM message_templates WHERE is_active = 1
      `, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Métodos de estadísticas
  getInstanceStats(instanceId) {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT 
          COUNT(*) as total_messages,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_messages,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_messages,
          SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read_messages,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_messages
        FROM instance_messages 
        WHERE instance_id = ?
      `, [instanceId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Método para cerrar la base de datos
  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = DatabaseManager; 