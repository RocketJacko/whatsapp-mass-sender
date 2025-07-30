const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'data', 'whatsapp_instances.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Verificando contenido de la base de datos...\n');

// Verificar instancias
db.all('SELECT * FROM instances', (err, rows) => {
  if (err) {
    console.error('❌ Error al consultar instancias:', err);
  } else {
    console.log('📱 INSTANCIAS ALMACENADAS:');
    console.log('========================');
    if (rows.length === 0) {
      console.log('❌ No hay instancias almacenadas');
    } else {
      rows.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id}`);
        console.log(`   Nombre: ${row.name}`);
        console.log(`   Estado: ${row.status}`);
        console.log(`   Teléfono: ${row.phone_number || 'No registrado'}`);
        console.log(`   Creado: ${row.created_at}`);
        console.log(`   Última conexión: ${row.last_connected_at || 'Nunca'}`);
        console.log('   ---');
      });
    }
  }

  // Verificar mensajes
  db.all('SELECT * FROM instance_messages', (err, messages) => {
    if (err) {
      console.error('❌ Error al consultar mensajes:', err);
    } else {
      console.log('\n💬 MENSAJES ALMACENADOS:');
      console.log('========================');
      if (messages.length === 0) {
        console.log('❌ No hay mensajes almacenados');
      } else {
        messages.forEach((msg, index) => {
          console.log(`${index + 1}. Instancia: ${msg.instance_id}`);
          console.log(`   Teléfono: ${msg.phone_number}`);
          console.log(`   Estado: ${msg.status}`);
          console.log(`   Enviado: ${msg.sent_at}`);
          console.log('   ---');
        });
      }
    }

    // Cerrar conexión
    db.close();
    console.log('\n✅ Verificación completada');
  });
}); 