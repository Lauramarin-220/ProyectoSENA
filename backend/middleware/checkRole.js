/**
 * middleware de verificar roles
 * este middleware verifica que el usuario tenga un rol requerido 
 * debe usuarse despues de middleware de aunteticacion
 */
const esAdministrador = (req, res, next) => {
    try {
        //verificar que exista re.usuario ( viene de la autenticacion)
        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'usuario no auntenticado por favor inicia sesion'
            });
        }

        //verificar que el rol del usuario sea admin
        if (req.usuario.rol !== 'administrador') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado, se requiere rol de administrador'
            });
        }

        // el usuario es administrador continuar
        next();

    } catch (error) {
        console.error('Error en el mddleware de verificacion EsAdministrador', error);
        return res.status(500).json({
            success: false,
            message: 'Error en la verificacion permisos',
            error: error.message
        });
    }
};

/**
 * middleware para verificar si el usuario es cliente
 */
const esCliente = (req, res, next) => {
    try {
        //verificar que exista re.usuario ( viene de la autenticacion)
        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'usuario no auntenticado por favor inicia sesion'
            });
        }

        //verificar que el rol del usuario sea cliente
        if (req.usuario.rol !== 'cliente') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado, se requiere rol de cliente'
            });
        }

        // el usuario es cliente continuar
        next();
    } catch (error) {
        console.error('Error en el mddleware de verificacion de rol de cliente', error);
        return res.status(500).json({
            success: false,
            message: 'Error en la verificacion de rol',
            error: error.message
        });
    }
};

/**
 * middleware flexible para verificar multiples roles
 * permite verificar varios roles validos 
 * util para cuando una ruta tiene varios roles permitidos 
 */
const tieneRol = (rolesPermitidos = []) => {
    return (req, res, next) => {
        try {
            //verificar que exista req.usuario ( viene de la autenticacion)
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'usuario no auntenticado por favor inicia sesion'
                });
            }

            //verificar que el rol del usuario este en la lista de roles permitida
            if (!rolesPermitidos.includes(req.usuario.rol)) {
                return res.status(403).json({
                    success: false,
                    message: `Acceso denegado, se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}`
                });
            }

            // el usuario tiene un rol permitido continuar
            next();
        } catch (error) {
            console.error('Error en el mddleware de tiene rol', error);
            return res.status(500).json({
                success: false,
                message: 'Error en la verificacion de rol no tiene permisos',
                error: error.message
            });
        }
    };
};

/**
 * middleware para verificar que el usuario accede a sus propios datos
 * verificar que el usuario ID en los parametros conciden con el usuario autenticado
 */
const esPropioUsuarioOAdmin = (req, res, next) => {
    try {
            //verificar que exista re.usuario ( viene de la autenticacion)
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'usuario no auntenticado por favor inicia sesion'
                });
            }

            //los administradores puede acceder a datos de cualquier usuario
            if (req.usuario.rol === 'administrador') {
                return next();
            }

            // Obtener el id del usuarioId de los parametros de la ruta
            const usuarioIdParam = req.params.usuarioId || req.params.id; 

            //verificar que el usuarioId conciden con el usuario autenticado
            if (parseInt(usuarioIdParam) !== req.usuario.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado no puedes acceder a datos de otros usuarios'
                });
            }

            // el usuario accede a sus propios datos continuar
            next();
    } catch (error) {
            console.error('Error en el mddleware esPropioUsuarioOAdmin', error);
            return res.status(500).json({
                success: false,
                message: 'Error en la verificacion de permisos',
                error: error.message
         });
     }
};

/**
 * middleware para verificar que el usuario es administrador o auxiliar 
 * permite al acceso a usuarios con el rol administrador o auxiliar 
 */
 const esAdminOAuxiliar = (req, res, next) => {
    try {
            //verificar que exista req.usuario ( viene de la autenticacion)
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'usuario no auntenticado por favor inicia sesion'
                });
            }

            //verificar que el usuario sea administrador o auxiliar
            if (!['administrador', 'auxiliar'].includes(req.usuario.rol)) {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado, se requiere permisos de administrador o auxiliar'
                });
            }

            // el usuario es administrador o auxiliar continuar
            next();

    } catch (error) {
            console.error('Error en el mddleware esAdminOAuxiliar', error);
            return res.status(500).json({
                success: false,
                message: 'Error en la verificacion de permisos',
                error: error.message
         });
    }
};

/**
 * mddleware para verificar que el usuario es solo adminnistrador no auxiliar
 * bloquea el acceso a operaciones como eliminar
 */
 const soloAdministrador = (req, res, next) => {
    try {
            //verificar que exista req.usuario ( viene de la autenticacion)
            if (!req.usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'usuario no auntenticado por favor inicia sesion'
                });
            }

            //verificar que el rol sea administrador
            if (req.usuario.rol !== 'administrador') {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado solo administradores puede realizar esta operacion'
                });
            }

            // el usuario es administrador 
            next();

    } catch (error) {
            console.error('Error en el mddleware soloAdministrador', error);
            return res.status(500).json({
                success: false,
                message: 'Error en la verificacion de permisos',
                error: error.message
         });
    }
};

//Exportar los middlewares
module.exports = {
    esAdministrador,
    esCliente,
    tieneRol,
    esPropioUsuarioOAdmin,
    esAdminOAuxiliar,
    soloAdministrador
}; 