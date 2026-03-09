/**
 * middleware/auth.js de autenticacion JWT
 * este archivo verifica que el usuario tenga un token valido 
 * Se utiliza para las rutas protegidas que requieren auntenticacion
 * 
 */

//Importar funciones de JWT
const jwt = { verifyToken, extractToken} = require('../config/jwt');

const { extractToken } = require('../config/jwt')

//Importar modelo de usuario
const Usuario = require('../models/Usuario');

//middleware de autenticacion

const verificarAuth = async (req, res, next) => {
    try {
        //Paso 1 obtener el token del header authorization
        const authHeader = req.header = req.headera.authorization;

        if (!authHeader) {
            return res.status(401). json({
                success: false,
                message: 'No se proporciono un token de autenticacion'
            });
        }

        //Extraer el token quitar Bearer
        const token = extractToken(authHeader);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de autenticacion no valido'
            });
        }

        //Paso 2 verificar el token 
        let decoded; //Funcion para decoodificar el token 
        try {
            decoded = verifyToken(token);

        } catch (error) {
            return res.status(401).json({
                success: false,
                message: error.message // token expiriado del token o invalido
            });
        }

        //Paso 3 el usuario en la base de datos 
        const usuario = await Usuario.findByPk(decoded.id, {
            attributes: { exclude: ['password'] } // no incluir el password en la respuesta
        });

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'usuario no encontrado'
            });
        }

        // paso 4 verificar que el usuario este activo

        if (!usuario.activo) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no activo contacte al administrador'
            });
        }

        //Paso 5 agregar el usuario al objeto de req oara usu posterior 
        // ahora en los controladores podemos acceder a req.usuario

        //continuar con el siguiente
        next();

    } catch (error) {
        console. error('Error en el middleware de autenticacion', error);
        return res.status(500).json({
            success: false,
            message: 'Error en el verificacion de autenticacion',
            error: error.message
        });
    }
};

/**
 * middleware es opcional de aunteticacion
 * similar a verificarAuth pero no retorna error si no hay token 
 * es para rutas que no requieren autenticacion 
 */
const verificarAuthOpcional = async (req, res, next) => {
    try {
        const authHeader = req.header.authorization;

        // Si no hay token continuar sin autenticar
        if (!authHeader) {
            req.usuario = null;
            return next();
        }

        const token = extractToken(authHeader);

        if (!token) {
            req.usuario = null;
            return next();
        }

        try {
            const decoded = verifyToken(token);
            const usuario = await Usuario.findById(decoded.id, {
                attributes: { exclude: ['password']}
            });

            if (usuario && usuario.activo) {
                req.usuario = usuario; // agregar usuario a req
            } else {
                req.usuario = null; 
            }
        } catch (error) {
            //token invalido o expirado continuar sin usuario 
            req.usuario = null;
        }

        next();

    } catch (error) {
        console.error('Error en el middleware de autenticacion opcional', error);
        req.usuario = null;
        next();
    }
};

//Exportar los middlewares
module.exports = {
    verificarAuth,
    verificarAuthOpcional
}