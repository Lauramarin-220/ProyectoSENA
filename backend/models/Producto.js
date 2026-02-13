/**
 * MODELO PRODUCTO
 * Define la tabla producto en la base de datos 
 * Almacena los productos
 * 
 */

//Importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//importar instancia de sequelize 
const { sequelize } = require('../config/database');

/**
 * Define el modelo de Producto 
 * 
 */

const Producto = sequelize.define('Producto', {
    //Campos de la tabla 
    //Id identificador unico (PRIMARE KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    nombre:{
        type: DataTypes.STRING(200),
        allowNull: false,
        validate:{
            notEmpty:{
                msg: 'El nombre del producto no puede estar vacio'
            },
            len:{
                args:[3, 200],
                msg: 'El nombre del producto debe tener entre 3 y 200 caracteres'
            }
        }
    },

    /**
     * Descripcion detallada del producto
     */
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    // Precio del producto
    precio: {
        type: DataTypes.DECIMAL(10, 2), // hasta 99,999,999.99
        allowNull: false,
        validate: {
            isDecimal: {
                msg: 'El precio debe ser un numero decimal valido'
            },
            min: {
                args: [0],
                msg: 'El precio debe no puede ser negativo'
            } 
        }
    }, 

    // Precio del producto cantidad disponible en inventario
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            isInt: {
                msg: 'El stock debe ser un numero entero valido'
            },
            min: {
                args: [0],
                msg: 'El stock debe no puede ser negativo'
            } 
        }
    }, 
    
    /**
     * imagen nombre del archivo de imagen 
     * se guardara solo el nombre ejemplo: coca-cola-producto.jpg
     * la ruta seria /uploads/coca-cola-producto.jpg
     */
     imagen: {
        type: DataTypes.STRING(255),
        alloNull: true, // la imagen es opcional
        validate: {
            is: {
                args: /\.(jpg|jpeg|png|gif)$/i, // solo permite archivos con estas extensiones
                msg: 'La imagen debe ser un archivo jpg, jpeg, png o gif'
            }
        }
    },

  /**
     * subcategoriaId - ID de la subcategoria a la que pertenece (FOREGIN KEY)
     * Esta es la relacion con la tabla subcategoria 
     *
     */
    subcategoriaId: {
        type: DataTypes.INTEGER,
        allowNull: false, 
        references: {
            model: 'subcategorias', // nombre de la tabla relacionada 
            key: 'id', // campo de la tabla relacionada
        },
        onUpdate: 'CASCADE', // Si se actualiza el id, actualizar aca tambien 
        onDelete: 'CASCADE', // si se elimina la categoria las subcategorias 
        validate: {
            notNull: {
                msg: 'Debe seleccionar a una subcategoria'
            },
        }     
    },

    /**
     * categoriaId - ID de la categoria a la que pertenece (FOREGIN KEY)
     * Esta es la relacion con la tabla categoria 
     *
     */
    categoriaId: {
        type: DataTypes.INTEGER,
        allowNull: false, 
        references: {
            model: 'categorias', // nombre de la tabla relacionada 
            key: 'id', // campo de la tabla relacionada
        },
        onUpdate: 'CASCADE', // Si se actualiza el id, actualizar aca tambien 
        onDelete: 'CASCADE', // si se elimina la categoria las subcategorias 
        validate: {
            notNull: {
                msg: 'Debe seleccionar a una categoria'
            },
        }
        
    },

    /**
     * Activo estado de la subcategoria 
     * si es false los productos de esta subcategoria se ocultan
     */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false, 
        defaultValue: true
    }

}, {
    //opciones del modelo
    tableName: 'productos', 
    timestamps: true, // agrega campos createdAt y updatedAt

    /**
     * indices compuestos para optimizar busquedas
     */
    indexes: [
        {
            //Indice para buscar productos por subcategoria
            fields: ['subcategoriaId']
        },

        {
            //Indice para buscar productos por categoria
            fields: ['categoriaId']
        },

        {
            //Indice para buscar productos activos
            fields: ['activo'],
        },

        {
            //Indice para buscar productos por nombre
            fields: ['nombre'],
        },
    ],

    /**
     * Hooks Acciones automaticas 
     */

    hooks: {
        /**
         * beforeCreate -  se ejecuta antes de crear un producto
         * valida que la subcategoria y que la categoria esten activas 
         */

        beforeCreate: async (producto) => {
            const Categoria = require('./Categoria');
            const subcategoria = require('./subcategoria');

            //Buscar subcategoria padre
            const subcategoria = await subcategoria.findByPk(producto.subcategoriaId);

            if (!subcategoria){
                throw new Error('La subcategoria seleccionada no existe');
            }

            if (!subcategoria.activo){
                throw new Error('No se puede crear un producto para una subcategoria inactiva');
            }

            //Buscar categoria padre
            const categoria = await Categoria.findByPk(producto.categoriaId);

            if (!categoria){
                throw new Error('La categoria seleccionada no existe');
            }

            if (!categoria.activo){
                throw new Error('No se puede crear un producto en una categoria inactiva');
            }

            // validar que la subcategoria pertenezca a una categoria 
            if (subcategoria.categoriaId !== producto.categoriaId)
                {
                throw new Error('la subcategoria no pertenece a la categoria seleccionada');
            }
        },
        /**
         * beforeDestroy: se ejecuta antes de eliminar un producto
         * Elimina la imagen del servidor si existe
         */

        BeforeDestroy: async (producto) => {
            if (producto.imagen) {
                const { deleteFile } = require('../config/multer');
                // intenta eliminar la imagen del servidor
                const eliminado = await deleteFile(producto.imagen);

                if (eliminado) {
                    console.log(`Imagen ${producto.imagen} eliminada del servidor`);
                }
            }
        }
    }
});
 
// METODOS DE INSTACIA 

/**
 * Metodo para obtener la URL completa de la imagen 
 * 
 * @returns {string|null} - URL de imagen
 */

Producto.prototype.obtenerUrlImagen = function() {
   if (this.imagen) {
    return null; 
   }

   const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000'; // URL base del frontend
   return `${baseUrl}/uploads/${this.imagen}`;
};

/**
 * Metodo para verificar si hay stock disponible
 * 
 * @param {number} cantidad - Cantidad deseada 
 * @return {boolean} - True si hay stock suficiente, false si no
 */
Producto.prototype.hayStockDisponible = function (cantidad = 3) {
    return this.stock >= cantidad;
};

/**
 * Metodo para reducir el stock 
 * Util para cuando de una venta 
 * @param {number} cantidad - cantidad a reducir 
 * @return { Promise<Producto>} - producto actualizado 
 */
Producto.prototype.reducirStock = async function (cantidad) {
    if (this.hayStock(cantidad)){
        throw new Error('Stock insuficiente');
    }
    this.stock -= cantidad;
    return await this.save(); 
}

/**
 * Metodo para aumentar el stock
 * Util al cancelar una venta o recibir inventario
 * 
 * @param {number} cantidad - cantidad a aumentar 
 * @return {Promise<Producto>} - producto actualizado
*/
Producto.prototype.aumentarStock = async function (cantidad) {
    this.stock += cantidad;
    return await this.save();
};

//Exportar modelo Producto 
module.exports = Producto;