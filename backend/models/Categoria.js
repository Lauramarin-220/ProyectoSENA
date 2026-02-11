/**
 * MODELO CATEGORIA
 * Define la tabla categoria en la base de datos 
 * Almacena las categorias principales de los productos 
 * 
 */

//Importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//importar instancia de sequelize 
const { sequelize } = require('../config/database');

/**
 * Define el modelo de categoria 
 * 
 */

const Categoria = sequelize.define('Categoria', {
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
    },
    /**
     * Activo estado de la categoria 
     * si es false la categoria y todas las subcategorias y productos se ocultan
     */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false, 
        defaultValue: true
    }

}, {
    //opciones del modelo
    tableName: 'categorias', 
    timestamps: true, // agrega campos createdAt y updatedAt

    /**
     * Hooks Acciones automaticas 
     */

    hooks: {
        /**
         * afterUpdate: se ejecuta después de actualizar una categoria
         * se desactiva un categoria se desactivan todas las subcategorias y productos
         */
        afterUpdate: async (categoria, options) => {
            //verificar si el campo activo cambio 
            if (categoria.changed('Activo') && !categoria.activo) {
           console.log(`Desactivando categoria ${categoria.nombre}`);

           // Importar modelos (aqui para evitar dependecias circulares) 
           const Subcategoria = require('./Subcategorias');
           const Producto = require('./Producto'); 
           
           try {    
            // Paso 1: desactivar subcategorias de esta categoria
            const subcategorias = await Subcategoria.findAll({ where: { categoriaId: categoria.id } });

            for (const subcategoria of subcategorias) {
                await subcategoria.update({
                    activo: false}, {transaction: options.transaction});
                    console.log(`Desactivando subcategoria ${subcategoria.nombre}`);
    
              }

              // paso 2: desactivar los productos que pertenece esta categoria 
               const productos = await Producto.findAll({ where: { categoriaId: categoria.id } });

            for (const producto of productos) {
                await producto.update({
                    activo: false}, {transaction: options.transaction});
                    console.log(`Desactivando producto ${producto.nombre}`);
    
           } 
         
           console.log('categoria y elementos reacciones desactivados correctamente');

            } catch (error){
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
 * Metodo para contar subcategorias de esta categoria 
 * 
 * @returns {Promise<number>} -numero de subcategorias
 */

Categoria.prototype.contarSubcategorias = async function() {
   const Subcategoria = require('./Subcategorias');
   return await Subcategoria.count({ where: { categoriaId: this.id } });
};


/**
 * Metodo para contar productos de esta categoria 
 * 
 * @returns {Promise<number>} -numero de productos
 */

Categoria.prototype.contarProductos = async function() {
   const Producto = require('./Producto');
   return await Producto.count({ where: { categoriaId: this.id } });
};

//Exportar modelo Categoria 
module.exports = Categoria;