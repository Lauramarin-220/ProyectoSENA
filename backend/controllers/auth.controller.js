/**
 * Controlador de autenticacion
 * maneja es regitro. login y obtecion del perfil de usuarios
*/

/**
 * Importar modelos
 */

const Usuario = require('../models/Usuario');
const { generateToken } = require('../config/jwt');

/**
 * obtener todas los usuarios
 * GET/ api/usuarios
 * query params:
 * Activo true/false (filtrar por estado)
 * 
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const Registrar = async (req, res) => {
    try {
        const { nombre, apellido, email, password, telefono, direccion } = req.query;

        //Validacion 1 verificar que todos los campos requeridos esten presentes
        if (!nombre || !apellido || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: nombre, apellido, email, password son obligatorios'
            });
        }

        //Validacion 2 verificar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de email invalido' 
            });
        }

          //Validacion 3 verificar la longitud de la contraseña
        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caractares' 
            });
        }

          //Validacion 4 verificar que el email no este registrado
          const usuarioExistente = await Usuario.findOne({ where: { email }});
        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: 'El email ya esta registrado' 
            });
        }

/**
 * Crear nuevo usuario
 * el hook BeforeCreate en el modelo se encarga de hashear la contraseña antes de guardarala 
 * en el rol por defecto es cliente
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
    
        // Crear usuario
        const nuevoUsuario = await Usuario.create({
            nombre,
            apellido, 
            email, 
            password, // el modelo se encargara de hashear la contraseña
            telefono: telefono || null,
            direccion: direccion || null,
            rol: 'cliente' //por defecto
        });

        //Generar token JWT
        const token = generateToken({ id: 
            nuevoUsuario.id, 
            email: nuevoUsuario.email, 
            rol: nuevoUsuario.rol 
        });

        //Respuesta exitosa
        const UsuarioRespuesta = nuevoUsuario.toJSON();
        delete UsuarioRespuesta.password; //Eliminar el campo de contraseña de la respuesta 

        //Respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
               usuario: UsuarioRespuesta,
               token
            }
        });
    } catch (error) {
    console.error('Error en Registrar: ', error)
        return res.status(400).json({
        success: false,
        message: 'Error al registrar usuario',
        errors: error.message
        });
     }
};

/**
 * iniciar sesion
 * autenticacio usuario con email y contraseña
 * retornar el usuario y un token JWT si las credenciales son correctas
 * POST/api/auth/login
 * body: { email. password }
 */

const login = async (req, res) => {
    try {
        //Extraer credenciales del body
        const { email, password } = req.body;

        //Validacion 1 verificar que se proporcione email y contraseña (password)
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridas'
            })
        }

        //Validacion 2: buscar usuario por email
        // Necesitamos incluir el password aqui normalmente se excluye por seguridad 
        const usuario = await Usuario.scope('withPassword').findOne({ where: { email }
        });

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales invalidas'
            });
        }

        //Validacion 3: verificar que el usuario este activo
        if (!usuario.activo) {
            return res.status(401).json({
                success: false,
                message: 'Tu cuenta esta inactiva. contacta al administrador'
            })
        }

        //Validacion 4: verificar la contraseña
        //Usamos el metodo compararPassword definido del modelo usuario
        const passwordValida = await usuario.compararPassword(password);

        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales Invalidas'
            });
        }

        //Generar token JWT con datos del usuario
        const token = generarToken({
            id: usuario.id,
            email: usuario.email,
            rol: usuario.rol
        });

        //preparar respuesta sin password
        const usuarioSinPassword = usuario.toJSON();
        delete usuarioSinPassword.password; //eliminar campo de contraseña

       //Respuesta existosa
        res.json({
            success: true,
            message: 'inicio de sesion existoso',
            data: {
                usuario: usuarioSinPassword,
                token
            }
        });
    } catch (error) {
        console.error('Error en login: ', error);
        return res.status(500).json({
            success: false,
            message: 'Error al iniciar sesion, intente nuevamente',
            error: error.message
        });
    }
};

/**
 * Obtener perfil del usuario autenticado
 * requiere middleware verificarAuth 
 * get/api/auth/me
 * headers: { Authorization: 'Bearer TOKEN' } 
 */

const getMe= async (req, res) => {
    try {
        
        //El usuario ya esta en req.usuario 
       const usuario = await Usuario.findByPk(req.usuario.id,{
        attributes: { exclude: ['password']}
       });

       if(!usuario) {
        return res.status(404).json({
            success: false,
            message: 'usuario no encontrado'
            });
        }

        //respuesta exitosa
        res.json({
            success: true,
            message: 'perfil obtenido exitosamente',
            data: {
                usuario
            }
        });

    } catch (error) {
    console.error('Error en getMe: ', error);
        return res.status(500).json({
             success: false,
             message: 'Error de validacion',
             errors: error.errors.map(e => e.message)
        });
    }
};

/**
 * actualizar perfil de usuario autenticado
 * permite al usuario actualizar si informacion personal
 * PUT/api/auth/me
 * 
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const UpdateMe = async (req, res) =>{
    try {
        const { nombre, apellido, telefono, direccion } = req.body;

        //Buscar usuario
        const usuario = await Usuario.findByPk(req.usuario.id);

        if(!usuario) {
            return res.status(404).json({
                success: false, 
                message: 'Usuario no encontrado'
            });
        }
          //Actualizar campos
        if (nombre !== undefined) usuario.nombre = nombre;
        if (apellido !== undefined) usuario.apellido = apellido;
        if (telefono !== undefined) usuario.telefono = telefono;
        if (direccion !== undefined) usuario.direccion = direccion;

        //guardar cambios
        await usuario.save();

        //respuesta exitosa
        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            data: {
                usuario: usuario.toJSON()
            }
        });

    } catch (error) {
        console.error('Error en UPDATEME: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar perfil',
            error: error.message
        });
    }
};

/**
 * cambiar contraseña del usuario autenticado
 * permite el usuario cambiar su contraseña 
 * require su contraseña por seguridad
 * PUT/api/auth/change-password
 */
const changePassword = async (req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body;

        //Validacion 1 verificar que se proporcione ambas contraseñas
        if (!passwordActual || !passwordNueva) {
            return res.status(400).json({
                success: false,
                message: 'se requiere contraseña actual y nueva contraseña'
            });
        }

        //Validacion 2  verificar si la Actual contraseña tiene 6 caracteres o mas 
         if (passwordActual.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'la Actual contraseña debe tener al menos 6 carcateres'
            });
        }

        //validacion 3 buscar usuario con password incluido
        const usuario = await Usuario.scope('withPassword').
        findByPk(req.usuario.id);
        if (!usuario) {
            return res.status(400).json({
                success: false,
                message: 'usuario no encontrado'
            });
        }

        //validacion 4 verificar que la contraseña actual sea correcta
        const passwordValida = await usuario.compararPassword(passwordActual);
        if (!passwordValida) {
            return res.status(400).json({
                success: false,
                message: 'contraseña actual incorrecta'
            });
        }

        //Actualizar contraseña 
        usuario.password = passwordNueva; 
        await usuario.save();

        //respuesta exitosa
        res.json({
            success: true,
            message: 'contraseña actualizada exitosamente'

        });

    } catch(error) {
        console.error('Error en changePassword: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar contraseña',
            error: error.message
        });
    }
};
//Exportar todos los controladores
module.exports = {
    Registrar,
    login,
    getMe,
    UpdateMe,
    changePassword
};