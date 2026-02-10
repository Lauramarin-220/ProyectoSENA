/**
 * Script de inicializacion de la base de datos
 * este script crea la base de datas si no existe 
 * y luego ejecutarse una sola vez antes de iniciar el servidor 
 */

// importar mysql2 para la conexion directa
const mysql = require('mysql2/promise');

// impotar dotenv para cargar las variables de entorno
require('dotenv').config();

// funcion para crear la base de datos 
const createDatabase = async () => {
   let connection;

   try {
    console.log('iniciando creacion de la base de datos ...\n');

    //conectar a MySQL sin especificar la base de datos
    console.log('Conectando a MySQL ...');
    connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    });
   
    console.log('Conexion a MySQL establecida\n');

    //crear la base de datos si no existe
    const dbName = process.env.DB_NAME || 'ecommerce_db';
    console.log(`Creando base de datos: ${dbName}...`);


    await connection.query(`CREATE DATABASE IF NOT EXISTS \`'${dbName}' creada/verificada existosamente\n'`);

    //cerrar la conexion
    await connection.end();

    console.log(' ¡proceso completado! ahora puedes iniciar el servidor con: npm start\n');
   } catch (error) {
  
    console.error('Error al crear la base de datos:', error.message);
    console.error('\n verifica que:');
    console.error('1. XAMP este corriendo');
    console.error('2. MySQL este iniciando en XAMPP');
    console.error('3. las credenciales en .env sean correctas\n');

    if (connection) {
        await connection.end();
   }

    process.exit(1);

   }
};

//ejecutar la funcion
createDatabase();