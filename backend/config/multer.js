/**
 * Configuracion de subida de archivos 
 * 
 * Multer es un middleware para manejar la subida de archivos 
 * Este archivo configura como y donde se guardan las imagenes 
 */

// Importar multer para manejar archivos 
const multer = require('multer');

// impotar path para trabajar con rutas de archivos
const path = require('path');

//impotar fs para vereficar /crear directorios 
const fs = require('fs');

// importar dotenv para variables de entorno
require('dotenv').config();

// obtener la ruta donde se guardara los archivos 
const uploadPath = process.env.UPLOAD_PATH || './uploads';

//verificar si la carpeta uploads existe, si no existe, crearla
if (!fs.existsSync(uploadPath)){
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log(`Carpeta ${uploadPath} creada exitosamente`);
}

/**
 * configuracion de almacenamiento de multer 
 * Define donde y como se guardaran los archivos 
 */

const storage = multer.diskStorage({
    /**
     * Destination: define la carpeta destino donde se guardara el archivo 
     * 
     * @param {object} req - objeto de peticion HTTP
     * @param {object} file - archivo que esta subiendo
     * @param {function} cb - Callback para llama con (error, destination)
     */

    destination: (req, file, cb) => {
        //cb(null, ruta) -> sin error, ruta = carpeta destino 
        cb(null, uploadPath);
    },

  /**
  * filename: define el nombre con el que se guardara el archivo 
  * formato: timestamp-nombreoriginal.ext
  * 
  * @param {object} req - objeto de peticion HTTP
  * @param {object} file - archivo que esta subiendo
  * @param {function} cb - Callback que se llama con (error, filename)
  */

  filename: function (req, file, cb) {
    //Generar nombre unico usando timestamp + nombre original 
    //Date.now() -> genera un timestamp unico 
    // path.extname() extrae la extension del archivo (.jpg, .png, etc)
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null,uniqueName);
  }

});

/**
 * Filtro para validar el tipo de archivo 
 * solo permite imagenes (jpg, jpeg, png, gif)
 * 
 * @param {object} req - objeto de peticion HTTP
 * @param {object} file - archivo que esta subiendo
 * @param {function} cb - Callback que se llama con (error, acceptFile)
 */
