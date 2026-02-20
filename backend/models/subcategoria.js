/**
 * MODELO SUBCATEGORIA
 * Define la tabla subcategoria en la base de datos 
 * Almacena las subcategorias de las categorias principales de los productos 
 * 
 */

//Importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//importar instancia de sequelize 
const { sequelize } = require('../config/database');

/**
 * Define el modelo de Subcategoria 
 * 
 */

const Subcategoria = sequelize.define('Subcategoria', {
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
        unique: {
            msg: 'Ya existe una subcategoria con ese nombre'
        },
        validate: {
            notEmpty: {
                msg: 'El nombre de la subcategoria no puede estar vacio'
            },
            len: {
                args: [2, 100],
                msg: 'El nombre de la subcategoria debe tener entre 2 y 100 caracteres'
            }
        }
    },

    /**
     * Descripcion de la subcategoria 
     */
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
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
    tableName: 'subcategorias', 
    timestamps: true, // agrega campos createdAt y updatedAt

    /**
     * indices compuestos para optimizar busquedas
     */
    indexes: [
        {
            //Indice para buscar subcategorias por categoria 
            fields: ['categoriaId']
        },
        {
            //Indice compuesto: nombre unico por categoria
            //permite que dos categorias diferentes tenga subcategorias con el mismo nombre 
            unique: true,
            fields: ['nombre','categoriaId'],
            name: 'nombre_categoria_unique'
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

/**
 * Metodo para obtener la categoria padre 
 * 
 * @returns {Promise<Categoria>} - categoria padre 
 */
subcategoria.prototype.obtenerCategoria = async function() {
   const Categoria = require('./Categoria'); 
   return await Categoria.findByPk(this.categoriaId);
}

//Exportar modelo subcategoria 
module.exports = Subcategoria;