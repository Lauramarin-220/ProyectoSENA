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

const fileFilter = (req, file, cb) => {

  // Tiempos Mime permitidos para imagenes
   const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

   //Verificar si el tipo del archivo esta en la lista permitida
   if (allowedTypes.includes(file.mimetype)) {
  // cb(null, true) -> aceptar el archivo
  cb(null, true);
 } else {
  // cb(error)-> recharzar el archivo 
  cb(new Error('Solo se permite imagenes (jpg, jpeg, png, gif)'), false);
 }
};

/**
 * Configurar multer con las opciones definidas
 */

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    //limite de tamaño del archivo
    //por defecto 5MB (5 * 1024) 5242800 bytes
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242800

  }
});

/**
 * Funcion para eliminar el archivo del servidor 
 * Util cuando se actualiza o elimina un producto y se necesita eliminar la imagen asociada 
 * 
 * @param {strig} filename - nombre del archivo a eliminar
 * @return {Boolean} - true si se elimino correctamente, false si no se pudo eliminar
 */

const deleteFile = (filename) => {
  try {
    // Construir la ruta completa del archivo
    const flePath = path.join(uploadPath, filename);

    // verificar si el archivo existe
    if (fs.existsSync(filePath)) {
      //Eliminar el archivo
      fs.unlinkSync(filePath);
       console.log(`Archivo eliminado: ${filename}`);
      return true;
    } else {
      console.log(`Archivo no encontrado: ${filename}`);
      return false;

    }
} catch (error) {
    console.error('Error al eliminar el archivo:', error.message);
    return false;
   }

};

// Exportar configuracion de multer y funcion de eliminacion 
module.exports = {
  upload,
  deleteFile
};
