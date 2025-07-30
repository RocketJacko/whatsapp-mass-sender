const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build del ejecutable...\n');

try {
  // 1. Limpiar directorios de build anteriores
  console.log('📁 Limpiando directorios de build...');
  const dirsToClean = ['dist', 'dist-electron'];
  dirsToClean.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`✅ Limpiado: ${dir}`);
    }
  });

  // 2. Instalar dependencias si es necesario
  console.log('\n📦 Verificando dependencias...');
  if (!fs.existsSync('node_modules')) {
    console.log('Instalando dependencias...');
    execSync('npm install', { stdio: 'inherit' });
  }

  // 3. Build del renderer (React)
  console.log('\n⚛️  Construyendo aplicación React...');
  execSync('npm run build:renderer', { stdio: 'inherit' });

  // 4. Build del main process
  console.log('\n🔧 Construyendo proceso principal...');
  execSync('npm run build:main', { stdio: 'inherit' });

  // 5. Crear directorio de datos si no existe
  console.log('\n🗄️  Preparando directorio de datos...');
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✅ Directorio de datos creado');
  }

  // 6. Generar ejecutable
  console.log('\n🎯 Generando ejecutable...');
  execSync('npm run dist', { stdio: 'inherit' });

  console.log('\n✅ ¡Build completado exitosamente!');
  console.log('\n📁 Archivos generados:');
  console.log('   - dist-electron/ (ejecutables)');
  console.log('   - dist/ (archivos de la aplicación)');
  
  // Mostrar información del ejecutable
  const distDir = path.join(__dirname, 'dist-electron');
  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir);
    files.forEach(file => {
      if (file.endsWith('.exe')) {
        console.log(`   📄 ${file}`);
      }
    });
  }

  console.log('\n🎉 ¡Tu aplicación está lista para distribuir!');
  console.log('💡 Los usuarios solo necesitan ejecutar el .exe, no instalar nada más.');

} catch (error) {
  console.error('\n❌ Error durante el build:', error.message);
  process.exit(1);
} 