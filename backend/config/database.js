/**CONFIGURACION DE LA BASE DE DATOS */

//importar sequelize
const { port } = require('pg/lib/defaults');
const { Sequelize } = require('sequelize')

//importar dotenv para variables de entorno
require('dotenv').config();

//crear instancias de secualize
const sequelize =  new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
       host:process.env.DB_HOST,
       port:process.env.DB_PORT,


       //configuracion de pool de conex
       //mantiene las conexiones abiertas para mejorar el rendimiento
       pool: {
        max: 5, //numero maximo de conexiones en el pool
        min: 0,
        acquire:30000, //tiwmpo maximo para obtener una conexion de pool
        idle:10000 //tiempo maximo que una conexion puede estar inactiva antes de ser liberada
       },

       //configuracion de logging
       //permite ver las consultas mysql por consola 
       logging: process.env.NODE_ENV ==='development' ? console.log : false,

       //zona horaria 
       timezone: '.05:00',//zona horaria de colombia

       //opciones adicionales 
       define: {
        // timestamps: true crea automaticamente los campos createAt y updateAt 
        timestramps: true,

        //underscored: true usa snake_case para nombres de las columnas 
        underscored: false,
        
        //frazeTableName: true usa el nombre del modelo cual para la tabla
        freezeTableName: true
       }



    }
);

/* Funcion para probar la conexion de la base de datos esta funcion se llamara al iniciar el servidor */
const testConnection = async () => {
    try {
        //intentar autenticar con la base de datos
        await sequelize.authenticate();
        console.log('conexion a mysql establecida correctamente');
        return true;

    } catch (error){
        console.error('X Error al conectar con MySQL:', error.message);
        console.error('verefica que XAMP este corriendo y las credencials en .env sean correctas');
        return false;
    }
};

/*
/**Funcion para sincronizar los modelos con la base de datos
* esta funcion creara las tablas automaticamente basandose en los modelos 
* @param {bolean} force - si es true, elimina y recrea todas las tablas 
* @param {bolean} alter - si es true, modifica las tablas existentes para que coincidan con los modelos
*/

const syncDataBase = async (force = false, alter = false) => {
    try {
        // sincronizar todos los modelos con la base de datos 
        await sequelize.sync({force, alter});

        if (force) {
            console.log('Base de datos sincronizada todas las tablas eliminadas y recreadas');
        }  else if (alter){
        console.log('Base de datos sincronizada tablas alteradas segun los modelos');
        } else {
            console.log('Base de datos sincronizada correctamente');
        
        } 
        return true;
    } catch (error){
        console.error('X Error al sincronizar la base de datos:', error.message);
        return false;
    }
};

//exportar la instancia  de sequelize y las funciones 
module.exports = {
    sequelize,
    testConnection,
    syncDataBase,
};

