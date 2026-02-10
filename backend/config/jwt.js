/**
 * CONFIGURACION DE JWT 
 * Este archivo configura funciones para generar y vreficar tokens JWT 
 * Los JWT se usan para autenticar usuarios sin necesidad de sesiones 
 */

// Importar jsonwebtoken para manejar JWT
const jwt = require('jsonwebtoken');

// impotar dotenv para acceder a las variables de entorno
require('dotenv').config();

/**
 * Generar un token JWT para un usuario 
 * 
 * @param {Object} payload - Datos del usuario se incluira en el token (id, email, rol)
 * @return {string} - Token JWT generado 
 */

const generateToken = (payload) => {
    try {
    //jwt.sing() crea y firma un token 
    //Parametros: 
    //1. payload: datos a incluir en el token 
    //2. secret: clave secreta para firmar (desde .env)
    //3. options: opciones adicionales como tiempo de expiracion 
    const token = jwt.sign(
        payload, // datos de usuario
        process.env.JWT_SECRET, // clave secreta desde .env
        { expiresIn: process.env.JWT_EXPIRES_IN } // tiempo de expiracion
     );
    return token;
    } catch (error){
        console.error(' Error al generar el token JWT:', error.message);
        throw new Error('Error al generar token JWT de autenticacion');
    }

    
};

/**
     * Verificar si un token es valido
     * 
     * @param {string} token - Token JWT a verificar
     * @return {object} - datos decodificados del token si es valido 
     * @throws {Error} - si el token es invalido o ha expirado
     */

const verifyToken = (Token) => {
    try {
        // jwt.verify() verifica la firma del token y decodifica
        //Paramentros: 
        //1. token: el token JWT a vetificar 
        //2. secret: la misma clave secreta usada para firmarlo 
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error)
     {
        //Diferentes tipos de errores 
        if (error.name === 'TokenExpiredError') {
            throw new Error('token Expirado ');

        } else if (error.name === 'JsonWebTokenError') {
           throw new Error('Token invalido');

        } else {
            throw new Error('Error al verificar token');
        }

     }
};

/**
 * Extraer el token del header Athorization
 * El token viene en formato "Bearer <token>"
 * 
 * @param {string} authHeader - >Header athorizaton de la peticion 
 * @return {string|null} - Token extraido o null si no existe 
 */

const extractToken = (authHeader) => {
   // verificar que el header existe y empieza con "Bearer "
   if (authHeader && authHeader.startsWith('Bearer ')) {
    // extraer solo el token (quitar "bearer ")
    return authHeader.substring(7);

   }

   return null; // no se encuentra un token valido
};

//Exportar las funciones para usarlas en otros archivos 
module .exports = {
    generateToken,
    verifyToken,
    extractToken
};