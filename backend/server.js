/**
 * SERVIDOR PRINCIPAL DEL BACKEND
 * este archivo principal del servidor del backend
 * configura express. middlewares, rutas y conexion de base de datos
 */

//IMPORTACIONES

//Importar express para crear el servidor
const express = require('express');

//importar cors para permitir solicitudes desde el frontend
const cors = require('cors');

//importar path para manejar rutas de achivos
const path = require('path');

//Importar dotenv para manejar variables de entorno
require('dotenv').config();

//Importar conexion de la base de datos y utilidades
const { sequelize, testConnection, syncDataBase } = require('./config/database'); 

//importar modelos y asociaciones
const { initAssociations } = require('./models');

//Importaar seeders
let runSeeders = async () => {}
try {
    ({ runSeeders } = require('./seeders/adminSeeder'));
} catch (error) {
    console.warn('seeders de administrador no encontrado, se omite la carga inicial');
}

//Crear alicaciones express

const app = express();

//Obtener el puerto desde la variable de entorno
const PORT = process.env.PORT || 5000;

// MIDDLEWARE GLOBALES

//cors permite peticiones desde el frontend 
//configura que los dominios pueden hacer peticiones al backend

app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://localhost:3000', //url del frontend
    credentials: true, //permite envio de cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], //Metodos permitiddos
    allowedHeaders: ['Content-Type', 'Authorization']// Headers permitidos
}));

/**
 * express.json() parsear el body de las peticioes en fromato JSON
 */

app.use(express.json());

/**
 * express.urlencoded() pasar el body de los formularios
 * las imagenes estaran en formato disponibles
 */

app.use(express.urlencoded({ extended: true }));

/**
 * servir archivos estaticos imagenes desde la carpeta raiz
 */
app.use('/uploads', express.static(path.join(__dirname,'uploads')));

//middleware para logging de peticiones
//Muestra en consola cada peticion qe lñega el servidor

if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`Ok ${req.method} ${req.path}`);
        next();
    });
}

//RUTAS

//Ruta raiz verificar que el servidor esta corriendo 

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor E-commerce Backend corriendo correctamente',
        version: '1.0.0',
        timeStamp: new Date().toISOString()
    });
});

// Ruta de salud verifica que el servidor como esta
app.get('/api/health', (req, res) => {
    res.json({
        success: true, 
        status: 'healthy',
        database: 'connected',
        timeStamp: new Date().toISOString()
    });
});

//rutas api

//rutas de autenticacion
// incluye registro login, perfil

const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

//Ruta del administrador
//Requieren autenticacion y rol de admin

const adminRoutes = require('./routes/admin.routes');
app.use('/api/admin', adminRoutes);

//Ruta del cliente

const clienteRoutes = require('./routes/cliente.routes');
app.use('/api', clienteRoutes);

//Manejo de rutas no encontradas (404)

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.path,
    });
});

//Manejo de rtas flobales

app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    //Error de multer subida de archivos
    if (err.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            message: 'Error al subir el archivo',
            error: err.message,
        });
    }

    // Otros errores
    res.status(500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

//Inicializar servidor y base de datos

/**
 * funcion principal para iniciar el servidor
 * prueba la conexion a MySQL
 * sincroniza los modelos ( crea las tablas )
 * inicia el servidor express
 */

const startServer = async () => {
    try {
        //paso 1 probar la conexion con MySQL
        console.log('Conectando a MySQL...');
        const dnConnected = await testConnection();

        if (!dnConnected) {
            console.error( 'No se pudo conectar a MySQL verificar XAMPP y el archivo .env');
            process.exit(1);//Salir di no hay conexion
        }

        //paso 2 sincronizar modelos (crear tablas)
        console.log('Sincronizando modelos con la base de datos...'),

        //Inicializar asociaciones entre los modelos
        initAssociations();

        // en desarrollo alter puede ser true para actualizar la extructura
        // en produccion debe ser false para no perder datos
        const alterTables = process.env.NODE_ENV === 'development';
        const dbSynced = await syncDataBase(false, alterTables);

        if (!dbSynced) {
            console.error('X error al sincronizar la base de datos');
            process.exit(1);
        }

        //Paso 3 ejecutar seeders datos iniciales
        await runSeeders();

        // Paso 4 iniciar servidor express 
        app.listen(PORT, () => {
            console.log('\n______________________');
            console.log(`Servidor corriendo en el puerto ${PORT}`);
            console.log(`URL: https://localhost:${PORT}`);
            console.log(`Base de datos ${process.env.DB_NAME}`);
            console.log(`Modo: ${process.env.NODE_ENV}`);
            console.log('Servidor listo para realizar peticiones');
        });
    } catch (error) {
        console.error('X Error falta al iniciar el servidor:', error.message);
        process.exit(1);
    }
};

//Manejo de cierre 
//captura el ctrl+c para cerrra el servidor correctamente

process.on('SIGINT', () => {
    console.log('\n\n cerrando servidor...');
    process.exit(0);
});

// Capturar errores no manejados

process.on('unhandledRejection', (err) => {
    console.error('X Error no manejados', err);
    process.exit(1);
});

// Solo iniciar el servidor cuando este archivo se ejecute directamente.
// Al requerirlo desde los tests (jest) no queremos levantar un servidor extra.
if (require.main === module) {
    startServer();
}

// exportar app para testing 
module.exports = app;