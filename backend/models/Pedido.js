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

       // ProductoId del Producto en el carrito 
    ProductoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Productos',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // se elimina el producto del carrito
        validate: {
            notNull: {
                msg: 'Debe especificar un producto'
            }
        }
    },

    // cantidad de este producto en el carrito 
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            isInt: {
                msg: 'La cantidad debe ser un numero entero'
            },
            min: {
                args: [1],
                msg: 'La cantidad  debe ser al menos 1' 
            }
        }
    },
    /**
     * Precio Unitario del producto al momento de agregarlo al carrito
     * Se guarda para mantener el precio aunque el producto cambie de precio 
     */
    precioUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: {
                msg: 'El precio debe ser un numero decimal'
            },
            min: {
                args: [0],
                msg: 'El precio no puede ser negativo'
            }
        }
    },
}, {
    //Opciones de modelo
    
    tableName: 'carritos', 
    timestamps: true,

    // Indices para mejorar las busquedas 
    indexes: [
        {
        //Indice para buscar carrito por usuario
        fields: ['usuarioId']
    },
    {
    //Indice compuesto: un usuario no puede tener el mismo producto duplicado
    unique: true,
        fields: ['usuarioId', 'productoId'],
        name: 'usuario_producto_unique'
    } 
    ],
        /**
     * Hooks Acciones automaticas 
     */

    hooks: {
        /**
         * beforeCreate -  se ejecuta antes de crear un item en el carrito 
         * valida que este esta activo y tenga stock suficiente 
         */
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

        /**
         * BeforeUpdate: se ejecuta antes de actualizar un carrito
         * Valida que haya stock suficiente si se aumenta la cantidad 
         */

        BeforeUpdate: async (itemCarrito) => {
            
            if (itemCarrito.changed('cantidad')) {
                const Producto = require('./Producto');
                const producto = await Producto.findByPk (itemCarrito.productoId);

                if (!producto) {
                    throw new Error('El producto no existe');
                }

                if (!producto.hayStock(itemCarrito.cantidad)) {
                    throw new Error (`Error insufciente. solo hay ${producto.stock} unidades disponibles`);
                }
            }
        }
    }
});
 
// METODOS DE INSTACIA 

/**
 * Metodo para calcular el precio subtotal de este item
 * @returns {number} - Subtotal (precio * cantidad)
 */

Carrito.prototype.calcularSubtotal = function() {
   return parseFloat(this.precioUnitario) * this.cantidad;
};

/**
 * Metodo para actualizar la cantidad 
 * 
 * @param {number} nuevaCantidad - nueva cantidad
 * @return {Promise} item actualizado 
 */
Carrito.prototype.actualizarCantidad = async function (nuevaCantidad) {
    const Producto = require('./Producto');

    const producto = await Producto.findByPk(this.productoId);

    if (!producto.hayStock(nuevaCantidad)) {
        throw new Error(`Stock insuficiente. solo hay ${producto.stock} unidades disponibles`);
    }

    this.cantidad = nuevaCantidad;
    return await this.save();
};

/**
 * Metodo para obtener el carrito completo de un usuario 
 * incluye informacion de los productos 
 * @param {number} usuarioId - id del usuario
 * @return {Promise<Array>} - item del carrito con productos 
 */
Carrito.obtenerCarritoUsuario = async function (usuarioId) {
    const Producto = require('./Producto')

    return await this.findAll({
        where: {usuarioId},
        include: [
        {
            model: Producto,
            as: 'producto'
        }
    ],
     order: [['createdAt', 'DESC']]
    }); 
};


/**
 * Metodo para calcular el total del carrito de un usuario
 * @param {number} usuarioId - id del usuario
 * @return {Promise<number>} - total del carrito
 */
Carrito.calcularTotalCarrito = async function(usuarioId)
{
    const items = await this.findAll({
        where: {usuarioId}
    });

    let total = 0;
    for (const item of items) {
        total += item.calcularSubtotal();
    }
    return total;
};

/**
 * Metodo para vaciar el carrito de un usuario
 * util despues de realizar el pedido 
 * 
 * @param {number} usuarioId - id del usuario
 * @returns {Promise<number>} - numero de items eliminados
 */
Carrito.vaciarCarrito = async function(usuarioId){
    return await this.destroy({
        where: { usuarioId }
    });
};

// Expotar modelo
module.exports = Carrito;
