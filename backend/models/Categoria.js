/**
 * MODELO CATEGORIA
 * define la tabla Categoria en la base de daos
 * Almacena las categorias principales de los productos
 */

//Importar DataType de sequelize 
const { DataTypes } = require('sequelize');

//importar instancia de sequelize
const { sequelize } = require('../config/database');

/**
 * Definir el modelo de Categoria
 */
const Categoria = sequelize.define('Categoria', {
    //Campos de la tablas
    //Id Identificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    nombre: {
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
                msg: 'El nombre de la categoria debe tener netre 2 y 100 caracteres'
            }
        }
    },

    /**
     * Descripcion dee la categoria 
     */
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    /**
     * activo estado de la categoria 
     * si es false la categoria y todas sus sibcategorias y productos se ocultan
     */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }

}, {
    // Opciones dek modelo

    tableName: 'categorias',
    timestamps: true, //Agrega campos de createdAT y updateAT

    /**
     * Hooks Acciones automaticas 
     */

    hooks: {
        /**
         * afterUpdate: se ejecuta despues de actualizar una categoria
         * si se desactiva una categoria se descativan todas sus subcategorias y productos
         */
        afterUpdate: async (categoria, options) => {
            //Verificar si el campo activo cambio
            if (categoria.changed('activo') && !categoria.activo) {
                console.log(`Desactivando categoria: ${categoria.nombre}`);

                // Importar modelos (aqui para evitat dependecias circulares)
                const Subcategoria = require('./Subcategoria');
                const Producto = require('./Producto');

                try {
                    // Paso 1 desactivar las subcategorias de esta categoria
                    const subcategorias = await Subcategoria.findAll({
                        where: { categoriaId: categoria.id}
                    });

                    for (const subcategoria of subcategorias) {
                        await subcategoria.update({
                            activo: false}, {transaction: options.transaction});
                            console.log(`Subcategoria desactivada: ${subcategoria.nombre}`);
                }
                // Paso 2 desactivas los productos de esta categoria
                const productos = await Producto.findAll({
                        where: { categoriaId: categoria.id}
                    });

                    for (const producto of productos) {
                        await producto.update({ activo: false}, {transaction: options.transaction});
                            console.log(`Producto desactivada: ${producto.nombre}`);
                }

                console.log('Categoria y elementos reaccionados desactivados correctamente');
                } catch (error) {
                console.error('Error al descativar elementos relacionados:', error.message);
                throw error;
                }
            }
            // Si se activa una categoria no se activam auomaticamente las subcategorias y productos
        }
    }
});

// METODOS DE INSTACIA 
/**
 * Metodo para contar subcategorias de esta categoria
 * 
 * @returns {Promise<number>} - numero de subcategoria
 */
Categoria.prototype.contarSubcategorias = async function() {
    const Subcategoria= require('./Subcategoria');
    return await Subcategoria.count({ 
        where: { categoriaId: this.id} });
};

/**
 * Metodo para contar productos de esta categoria
 * 
 * @returns {Promise<number>} - numero de productos
 */
Categoria.prototype.contarProductos = async function() {
    const Producto = require('./Producto');
    return await Producto.count({ 
        where: { categoriaId: this.id} });
};

//Exportar modelo Categoria
module.exports = Categoria;