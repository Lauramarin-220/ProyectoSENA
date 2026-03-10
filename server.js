/**
 * SERVER.principal del BACKEND 
 * este el archivo principal del servidor del backend
 * configura express, middlewares, rutas, y conexion de base de datos 
 */

// Importaciones 
const express = require('express');

// importar cors para permitir solicitudes desde el frontend
const cors = require('cors');

// importar path para manejar rutas de archivos
const path = require('path');

//importar dotenv para manejar variables de entorno
require('dotenv').config();

//importar configuracion de la base de datos 
const dbConfig = require('./config/db.config');

// importar modelo y asociaciones
const { initAssociations } = require('./models');

// importar seeders
const { runSeeders } = require('./seeders/adminSeeder');

// crear aplicaciones express

const app = express();

// obtener el puerto desde las variables de entorno
const PORT = process.env.PORT || 5000;

// MIDDLEWARES GLOBALES

// cors permite peticiones desde el frontend
// configurar que los dominios pueden hacer peticiones al backend

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // permitir solo el frontend
    Credentials: true, // permitir envio de cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE'], //Metodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'] //headers permitidos
}));

/**
 * express.json() paseae el body de las peticiones en formato JSON
 */

app.use(express.json());

/**
 * express.urlencoded() pasar el body de los formularios
 * las imagenes estaran disponibles 
 */

app.use(express.urlencoded({ extended: true }));

/**
 * servir archivos estaticos imagenes desde la carpeta raiz
 */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// middleware para logging de peticiones
// Muestra en consola cada peticion que llega el servidor 

if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`ok ${req.method} ${req.path}`);
        next();
    });
}

// Rutas

// rutas de raiz verificar que el servidor este funcionando
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor E-commerce, Backend funcionando correctamente',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// rutas de salud verifica que el servidor como esta 
app.get('api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString()
    });
});

// rutas api 

// rutas de autenticacion 
// incluye registro login, perfil
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// rutas del admin
//requierem autenticacion de rol de administrador
const adminRoutes = require('./routes/admin.routes');
app.use('/api/admin', adminRoutes);

// rutas del cliente
const clienteRoutes = require('./routes/cliente.routes');
app.use('/api', clienteRoutes );

// Maneja de rutas no encontradas (404)

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.path
    });
});

// Maneja de errores globales 
app.use((err, req, res) => {
    console.error('Error:', err.message);
    // Error de multer subida de archivos
    if (err.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            message:'Error al subir el archivo',
            error: err.message
        });
    }

    // Otros errores
    res.status(500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) // Mostrar stack solo en desarrollo
    });
});

// Inicializar servidor y base de datos

/**
 * funcion principal para iniciar el servidor 
 * prueba la conexion a MySQL
 * sincroniza los modelos (crea las tablas)
 * inicia el servidor express
 */

const startServer = async () => {
    try {
        // paso 1 prpbar conexion a MySQL
        console.log(' Conectado a MySQL...');
        const dbConnected = await testConnection();

        if (!dbConnected) {
            console.error(' No se pudo conectar a MySQL, verificar XAMPP y el archivo .env');
            process.exit(1); // salir si no hay conexion
        }

        // paso 2 sincronizar modelos (crear tablas)
        console.log(' Sincronizando modelos con la base de datos...');

        // Inicializar asociaciones entre modelos
        initAssociations();

        // en desarrollo alter puede ser true para actualizar la extructura
        // en produccion debe ser false para no perder datos
        const alterTables = process.env.NODE_ENV === 'development';
        const dbSynced = await syncDatabase(false, alterTables);

        if (!dbSynced) {
            console.error('X error al sincronizar la base de datos');
            proccess.exit(1);
        }

        // Paso 3 ejecutar seeders datos iniciales
        await runSeeders();

        // paso 4 iniciar servidor express
        app.listen(PORT, () => {
            console.log('\n ___________________');
            console.log(`Servidor corriendo en el puerto ${PORT}`);
            console.log(`URL: https://localhost:${PORT}`);
            console.log(`base de datos${process.env.DB_NAME}`);
            console.log(`modo: ${process.env.NODE_ENV}`);
            console.log('Servidor listo para realizar peticiones');
        });
    } catch (error) {
        console.error(' X error fatal al iniciar el servidor:', error.message);
        process.exit(1);
    }
};


// Manejo de cierre 
// captura el ctrl+c para cerrar el servidor correctamente

process.on('SIGINT', () => {
    console.log('\n\n cerrando servidor..')
    process.exit(0);
});

// captura errores no manejados

process.on('unhandledRejection', (err) => {
    console.error('x error no manejado', err);
    process.exit(1);
});

//Iniciar servidor
startServer();

//Exportar app para testing 
module.exports = app;
