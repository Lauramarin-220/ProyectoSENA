/**
 * MODELO USUARIO
 * Define la tabla Usuario en la base de datos 
 * Almacena la informacion de los usuarios del sistema
 */

//Importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//importar bcrypt para encriptar contraseñas
const bcrypt = require ('bcrypt');

//importar instancia de sequelize 
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs/dist/bcrypt');

/**
 * Define el modelo de usuario
 */

const Usuario = sequelize.define('Usuario', {
    //Campos de la tabla 
    //Id identificador unico (PRIMARE KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre:{
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El nombre no puede estar vacio'
            },
            len: {
                args: [2, 100],
                msg: 'El nombre debe tener entre 2 y 100 caracteres'
            }
        },
    },

    email:{
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            msg: 'Este email ya esta registrado'
        },
        validate: {
            isEmail: {
                msg: 'debe ser un email valido'
            },
            notEmpty: {
                msg: 'El email no puede estar vacio'
            }
        }
    },

    password:{
        type: DataTypes.STRING(255), // candena 
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'la contraseña no puede estar vacia'
            },
            len: {
                args: [6, 255],
                msg: 'La contraseña debe tener al menos 6 caracteres'
            }
        }
    },
    
    //rol del usuario (cliente, auxiliar o administrador)
    rol:{
        type: DataTypes.ENUM('cliente', 'auxiliar', 'administrador'), // tres roles disponibles
        allowNull: false,
        defaultValue: 'cliente', // por defecto es cliente
        validate: {
            isInt: {
                args: [['cliente', 'auxiliar', 'administrador']],
                msg: 'el rol debe ser cliente auxiliar o administador'
            },
        }
    },

    //Telefono del usuario es opcional
    telefono:{
        type: DataTypes.STRING(20),
        allowNull: true, // es opcional
        validate: {
            args: /^[0-9+\-\s()]*$/, //solo numeros,espacios, guiones, y parentesis
            notEmpty: {
                msg: 'El telefono soo puede contener numeros, espacios, numeros y caracteres validos'
            }
        }
    },

    /**
     * direccion del usuario es opcional 
     */
    direccion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    /**
     * Activo estado del usuario
     * 
     */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false, 
        defaultValue: true // por defecto activo
    }

}, {
    //opciones del modelo

    tableName: 'usuarios', 
    timestamps: true, // agrega campos createdAt y updatedAt

    /**
     * Scopes consultas predefinidas  
     */

    defaultScope: {
        /**
         * por defecto excluir el password de todas las consultas 
         */
        attributes: { exclude: ['password']}
    },
    scopes: {
       // scope para incluir el password cuando sea necesario (ejemplo en login)
       withPassword: {
        attributes: {} //incluir todos los atributos
       }
    },

    /**
     * hooks funciones que se ejecuten en momentos especificos 
     */
    hooks: {
      /**
       * beforeCreate se ejecuta antes de crear un nuevo usuario 
       * Encripta la contraseña antes de guardarla en la base de datos 
       */

        beforeCreate: async (usuario) => {
            if (uduario.password) {
                //generar un salt (semilla aleatoria) con factor de costo de 10
                const salt = await bcrypt.genSalt(10);
                //Encriptar la contraseña 
                usuario.password = await bcrypt.hash (usuario.password, salt);
            }
        },

         /**
         * beforeUpdate se ejecuta antes de actualizar un usuario
         * Encriptar la contraseña si fue modificada 
         */

        BeforeUpdate: async (usuario) => {
            //verificar si la contraseña fue modificada
            if (usuario.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                usuario.password = await bcrypt.hash(usuario.password, salt);
            }
        }
     }
});
 
// METODOS DE INSTACIA 

/**
 * Metodo para comparar contraseñas 
 * comparar una contraseña en texto plano con el hash guardado 
 * @param {string } passwordIngresado -contraseña en texto plano 
 * @returns {Promise<boolean>} - true si coinciden, false si no
 */
Usuario.prototype.compararPassword = async function(passwordIngresado){
   return await bcrypt.compare(passwordIngresado, this.password);
};

/**
 * Metodo para obtener el numero publicos del usuario (sin contraseña)
 * 
 * @returns {object} - objetos con datos publicos del usuario 
 */
Usuario.prototype.toJSON = function() {
   const valores = Object.assign({}, this.get());

   // Eliminar la contraseña del objeto 
   delete valores.password;
   return valores;
};

//Exportar modelo usuario 
module.exports = Usuario;