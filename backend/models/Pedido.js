/**
 * MODELO PEDIDO
 * Define la tabla pedido en la base de datos 
 * Almacena la informacion de los pedidos realizados por usuarios
 */

//Importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//importar instancia de sequelize 
const { sequelize } = require('../config/database');

/**
 * Define el modelo Pedido
 */

const Pedido = sequelize.define('pedido', {
    //Campos de la tabla 
    //Id identificador unico (PRIMARE KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    // UsuarioId del usuario que realizo el pedido 
    UsuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // no se puede eliminar un usuario con pedidos
        validate: {
            notNull: {
                msg: 'Debe especificar un usuario'
            }
        }
    },

    // Total monto total del pedido 
    tottal: {
        type: DataTypes.DECIMAL (10, 2),
        allowNull: false,
        validate: {
            isDecimal: {
                msg: 'El total debe ser un numero decimal valido'
            },
            min: {
                args: [0],
                msg: 'El total no puede ser negativo'
            }
        }
    },

    /**
     * Estado- estado actual del pedido
     * valores posibles: 
     * pendiente: pedido creado, esperando pago
     * pagado: pedido pagado, en preparacion
     * enviado: pedido enviado al cliente
     * cancelado: pedido cancelado
     */
    estado: {
        type: DataTypes.ENUM('pendiente', 'Pagado', 'enviado', 'cancelado'),
        allowNull: false,
        defaultValue: 'pendiente',
        validate: {
            isIn: {
                args:[['pendiente', 'pagado','enviado', 'cancelado']],
            }
        }
    },

    // Direccion de envio del pedido
    direccionEnvio: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'La direccion de envio es obligatoria'
            }
        }
    },
    
    // telefono de contacto par el envio
    telefonoContacto: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'el telefono es obligatorio'
            }
        }
    },

    // notas adicionales del pedido (opcional)
    notas: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    //Fecha de pago
    fechaPago: {
        type: DataTypes.DATE,
        allowNull: true,
    },

    //Fecha de envio
    fechaEnvio: {
        type: DataTypes.DATE,
        allowNull: true,
    },

    //Fecha de Entrega
    fechaEntrega: {
        type: DataTypes.DATE,
        allowNull: true,
    },

}, {
    //Opciones de modelo
    
    tableName: 'Pedidos', 
    timestamps: true,
    // Indices para mejorar las busquedas 
    indexes: [
        {
            //Indice para buscar carrito por usuario
            fields: ['usuarioId']
        },

        {
            //Indice para buscar pedidos por estado
            fields: ['estado']
        },

        {
            //Indice para buscar pedidos por fecha
            fields: ['createdAt']
        },
    ],

    /**
     * Hooks Acciones automaticas 
     */

    hooks: {
        /**
         * beforeCreate -  se ejecuta antes de crear un item en el carrito 
         * valida que este esta activo y tenga stock suficiente 
        
         beforeCreate: async (itemCarrito) => {
            const Producto = require('./Categoria');

            //Buscar el producto 
            const producto  = await Producto.findByPk(itemCarrito.productoId);

            if (!producto){
                throw new Error('El producto no existe');
            }

            if (!producto.activo){
                throw new Error('no se puede agregar un producto inactivo al carrito');
            }

            if (!producto.hayStock(itemCarrito.cantidad)) {
                throw new Error(`Stock insuficiente. Solo hay ${producto.stock} unidades disponibles`);

            }

            // Guarda el precio actual del producto 
            itemCarrito.precioUnitario = producto.precio
        },
        */

        /**
         * afterUpdate: se ejecuta despues de actualizar un pedido
         * actualiza las fechas segun el estado 
         */

            afterUpdate: async (pedido) => {
                // Si es estado cambio a pagaddo guarda la fecha de pago
                if (pedido.changed('estado') && pedido.estado === 'pagado') {
                    pedido.fechaPago = new Date();
                    await pedido.save ({ hooks: false}); // Guardar sin ejecutar hooks
                }
                // Si el estado cambio a enviado guarda la fecha de envio 
                if (!pedido.changed('estado') && pedido.estado === 'enviado' && !pedido.fechaEnvio) {
                    pedido.fechaEnvio = new Date();
                    await pedido.save ({ hooks: false }); // Guardar sin ejecutar hooks
                }

                // Si el estado cambio a enviado guarda la fecha de entregado
                if (!pedido.changed('estado') && pedido.estado === 'entregado' && !pedido.fechaEntrega) {
                    pedido.fechaEntrega = new Date();
                    await pedido.save ({ hooks: false }); // Guardar sin ejecutar hooks
                }
            },

            /**
             * beforeDestory: se ejecuta antes de eliminar un pedido
             */
            beforeDestroy: async () => {
                throw new Error('No se puede eliminar pedidos, use el estado cancelado en su lugar');
            }
        }
    });
 
// METODOS DE INSTACIA 

/**
 * Metodo para cambiar el estado del pedido
 * @param {string} nuevoEstado - nuevo estado del pedido
 * @returns {number} - sub total (precio * cantidad)
 */

Pedido.prototype.cambiarEstado =async function(nuevoEstado) {
   const estadosValidos = ['pendiente', 'pagado', 'enviado', 'cancelado'];

   if (!estadosValidos.includes(nuevoEstado)) {
    throw new Error('Estado invalido')
   }

    this.estado = nuevoEstado;
    return await this.save();
};

/**
 * Metodo para verificar si el pedido puede ser cancelado 
 * solo se puede cancelar si esta en estado pendiente o pagado
 * @returns {boolean} - true si se puede cancelar y false si no
 */

Pedido.prototype.puedeCancelar = function() {
    return ['pendiente', 'pagado'].includes(this.estado);
};

/**
 * Metodo para cancelar pedido
 * @returns {Promise<Pedido>} - Pedido cancelado
 */
Pedido.prototype.cancelar = async function () {
    if (!this.puedeCancelar()) {
        throw new Error('Este pedido no puede ser cancelado');
    }

    // importar modelos
    const DetallePedido = require('./DetallePedido');
    const Producto = require('./Producto');

    //obtener detalles del pedido
    const detalles = await DetallePedido.findAll({
        where: { pedidoId: this.id}
    });
    
    //devolver el stock de cada producto 
    for (const detalle of detalles) {
        const producto = await Producto.findByPk(detalle.productoId);
        if (producto) {
            await producto.aumentarStock(detalle.cantidad);
            console.log(` Stock devuelto: ${detalle.cantidad} X ${producto.nombre}`);
        }
    }

    // Cambiar estado a cancelado 
    this.estado ='cancelado';
    return await this.save();
};

/**
 * Metodo para obtener detalle del pedido con productos
 * @returns {Promise<Array>} - detalle pedido
 */
Pedido.prototype.obtenerDetalle = async function() {
    const DetallePedido = require('./DetallePedido');
    const Producto = require('./Producto');

    return await DetallePedido.findAll ({
        where: { pedidoId: this.id},
        include: [
            {
                model: Producto,
                as: 'producto'
            }
        ]
    });
};

/**
 * Metodo para obtener el total pedidos por estado 
 * @param {string} estado - estado a filtrar
 * @returns {Promise<Array>} - pedidos filtrados 
 */
Pedido.obtenerPorEstado = async function(estado){
    const Usuario = require ('./Usuario');
    return await this.findAll({
        where: { estado },
        incluide: [
            {
                model: Usuario,
                as: 'usuario',
                attributes: ['id', 'nombre', 'email', 'telefono' ]
            }
        ],
        order: [['creatdAt', 'DESC']]
    });
};

/**
 * Metodo para obtener historial de pedidos de un usuario
 * @param {number} usuarioId - id del usuario
 * @returns {Promise<Array>} - pedidos del usuario
 */
Pedido.obtenerHistoralusuario = async function(usuarioId){
    return await this.findAll({
        where: { usuarioId },
        order: [['creatdAt', 'DESC']]
    });
};
// Expotar modelo
module.exports = Pedido;
