/**
 * MODELO CARRITO
 * Define la tabla carrito en la base de datos 
 * Almacena los productosque cada usuario ha agregado a su carrito
 * 
 */

//Importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//importar instancia de sequelize 
const { sequelize } = require('../config/database');

/**
 * Define el modelo de carrito
 */

const Carrito = sequelize.define('Carrito', {
    //Campos de la tabla 
    //Id identificador unico (PRIMARE KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    // UsuarioId del usuario dueño del carrito 
    UsuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Si elimina el usuario se elimina su carrito
        validate: {
            notNull: {
                msg: 'Debe especificar un usuario'
            }
        }
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
         * beforeCreate -  se ejecuta antes de crear una subcategoria 
         * verifica que la categoria padrr este activa 
         */
        beforeCreate: async (subcategoria) => {
            const Categoria = require('./Categoria');

            //Buscar categoria padre
            const categoria = await Categoria.findByPk(subcategoria.categoriaId);

            if (!categoria){
                throw new Error('La categoria seleccionada no existe');
            }

            if (!categoria.activo){
                throw new Error('No se puede crear una subcategoria para una categoria inactiva');
            }
        },
        /**
         * afterUpdate: se ejecuta despues de actualizar una subcategoria
         * Si se desactiva una subcategoria se desactiva todos sus productos
         */
        afterUpdate: async (subcategoria, options) => {
            //verificar si el campo activo cambio 
            if (subcategoria.changed('activo') && !subcategoria.activo) {
           console.log(`Desactivando subcategoria ${subcategoria.nombre}`);

           // Importar modelos (aqui para evitar dependecias circulares) 
           const Producto = require('./Producto'); 
           
           try {    
              // Paso 1: desactivar los productos de esta subcategorias 
              const productos = await Producto.findAll({ where: { subcategoriaId: subcategoria.id } });

             for (const producto of productos) {
                await producto.update({
                    activo: false}, {transaction: options.transaction});
                    console.log(`Desactivando producto ${producto.nombre}`);
              }
              console.log('Subcategoria y productos relacionados desactivados correctamente');
            }catch (error){
                console.error('Error al desactivar elementos relacionados:', error.message);
                throw error;
            }
        }
     // Si se activa una categoria no se activa automaticamente las subcategorias y productos
    }
  }
});
 
// METODOS DE INSTACIA 

/**
 * Metodo para contar productos de esta subcategoria 
 * 
 * @returns {Promise<number>} -numero de productos
 */

subcategoria.prototype.contarProductos = async function() {
   const Producto = require('./Producto');
   return await Producto.count({ where: { subcategoriaId: this.id } });
};

    nombre:{
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            msg: 'Ya existe una categoria con ese nombre'
        },
        validate: {
            notEmpty: {
                msg: 'El nombre de la categoria no puede estar vacio'
            },
            len: {
                args: [2, 100],
                msg: 'El nombre de la categoria debe tener entre 2 y 100 caracteres'
            }
        }
},

    /**
     * Descripcion de la categoria 
     */
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
);
