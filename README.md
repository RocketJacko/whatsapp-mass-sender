# WhatsApp Mass Sender

Una aplicación de escritorio para envío masivo de mensajes de WhatsApp construida con Electron, React y TypeScript.

## 🚀 Características

- **Envío Masivo**: Envía mensajes a múltiples contactos simultáneamente
- **Gestión de Instancias**: Maneja múltiples sesiones de WhatsApp con persistencia
- **Verificación de Números**: Detecta si un número tiene WhatsApp activo
- **Gestión de Contactos**: Crea y categoriza listas de contactos
- **Importación desde Excel**: Importa contactos desde archivos Excel
- **Persistencia de Sesiones**: No necesitas escanear QR cada vez
- **Interfaz Intuitiva**: Diseño inspirado en WhatsApp 2.0

## 🛠️ Tecnologías

- **Electron**: Framework para aplicaciones de escritorio
- **React**: Biblioteca para interfaces de usuario
- **TypeScript**: Tipado estático para JavaScript
- **Tailwind CSS**: Framework CSS utilitario
- **WhatsApp Web.js**: Librería para interactuar con WhatsApp Web
- **SQLite**: Base de datos local para persistencia
- **Vite**: Herramienta de construcción rápida

## 📦 Instalación

### Prerrequisitos

- Node.js (versión 18 o superior)
- npm o yarn

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/whatsapp-mass-sender.git
   cd whatsapp-mass-sender
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Ejecutar en modo desarrollo**
   ```bash
   npm run dev
   ```

4. **Construir para producción**
   ```bash
   npm run build
   npm run dist
   ```

## 🎯 Uso

### Crear una Instancia

1. Abre la aplicación
2. Ve a la pestaña "Instancias"
3. Haz clic en "Nueva Instancia"
4. Escanea el código QR con tu WhatsApp
5. La instancia se guardará automáticamente

### Enviar Mensajes

1. Selecciona una instancia conectada
2. Ve a la pestaña "Mensajes"
3. Ingresa el número de teléfono
4. Escribe tu mensaje
5. Haz clic en "Enviar"

### Gestionar Contactos

1. Ve a la pestaña "Contactos"
2. Crea una nueva lista
3. Importa contactos desde Excel
4. Selecciona la lista para envío masivo

## 🗄️ Base de Datos

La aplicación utiliza SQLite para almacenar:

- **Instancias**: Información de sesiones de WhatsApp
- **Mensajes**: Historial de mensajes enviados
- **Contactos**: Listas y contactos importados
- **Plantillas**: Mensajes predefinidos

### Verificar Base de Datos

```bash
node check-db.js
```

## 📁 Estructura del Proyecto

```
whatsapp-mass-sender/
├── src/
│   ├── main/
│   │   └── main.js          # Proceso principal de Electron
│   ├── database/
│   │   └── database.js      # Gestión de base de datos SQLite
│   ├── components/          # Componentes React
│   └── App.tsx             # Componente principal
├── data/                   # Base de datos SQLite
├── assets/                 # Iconos y recursos
├── package.json
├── vite.config.js
└── README.md
```

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
NODE_ENV=development
```

### Configuración de Electron

El archivo `package.json` contiene la configuración de Electron Builder para generar ejecutables:

```json
{
  "build": {
    "appId": "com.whatsapp.masssender",
    "productName": "WhatsApp Mass Sender",
    "directories": {
      "output": "dist-electron"
    },
    "files": [
      "dist/**/*",
      "node_modules/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    }
  }
}
```

## 🚨 Solución de Problemas

### Error de SQLite

Si encuentras errores con SQLite:

```bash
npm rebuild sqlite3
```

### Puerto en uso

Si el puerto de desarrollo está ocupado, Vite automáticamente buscará otro puerto disponible.

### Problemas de renderizado

Si la aplicación no se renderiza:

1. Verifica que todas las dependencias estén instaladas
2. Limpia la caché: `npm run clean`
3. Reinstala dependencias: `npm install`

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas o preguntas:

1. Revisa los issues existentes
2. Crea un nuevo issue con detalles del problema
3. Incluye logs de error si es posible

## 🔮 Roadmap

- [ ] Sistema de respuestas automáticas con IA
- [ ] Estadísticas detalladas por instancia
- [ ] Programación de mensajes
- [ ] Integración con APIs externas
- [ ] Modo oscuro
- [ ] Soporte para múltiples idiomas

---

**Nota**: Esta aplicación es para uso educativo y personal. Respeta las políticas de uso de WhatsApp y las leyes locales sobre spam y privacidad. 