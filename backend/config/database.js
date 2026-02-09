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
)
