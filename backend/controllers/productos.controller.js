/**
 * Controlador de productos
 * maneja las operaciones crud y activar y desativar productos
 * solo accesible por adminitradores
 */

/**
 * Importar modelos
 */
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');

//importar path y fs para manejo de imagenes
const path = require('path');
const fs = require('fs');

/**
 * obtener todas los productos
 * query params:
 * categoriaId: Id de la categoria para filtrar por categoria
 * subcategoriaId: Id de la subcategoria para filtrar por subcategoria
 * Activo true/false (filtrar por estado activo o inactivo)
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const getProductos = async (req, res) => {
    try {
        const {
            categoriaId,
            subcategoriaId, 
            activo, 
            conStock,
            buscar,
            pagina = 1,
            limite = 100
        } = req.query;

        //Construir filtros
        const where = {};
        if (categoriaId) where.categoriaId = categoriaId;
        if (subcategoriaId) where.subcategoriaId = subcategoriaId;
        if (activo !== undefined) where.activo = activo === 'true';
        if (conStock === 'true') where.stock = { [require('sequelize').Op.gt]: 0};

        if (buscar) {
            const { Op } = require('sequelize');
            // Op.or Opciones para buscar por nombre o descripcion
            //Op.like equivale a un like en sql con condiciones para buscar cosidencias parciales
            where[Op.or] = [
                { nombre: { [Op.like]: `%${buscar}%` }},
                { descripcion: { [Op.like]: `%${buscar}%` }}
            ];
        }

        //paginacion
        const offset = (parseInt(pagina) -1) * parseInt(limite); //Cuenta los registros

        // Opciones de consulta
        const opciones = {
            where,
            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre']
                },
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre']
                }
            ],
            limit: parseInt(limite),
            offset,
            order: [['nombre', 'ASC']] //ordenar de manera alfabetica
        };

        //obtener productos y total
        const { count, rows: productos } = await Producto.findAndCountAll(opciones);

        //Respuesta exitosa
        res.json({
            success: true,
            data: {
                productos,
                paginacion: {
                    total: count,
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    totalpagina: Math.ceil(count / parseInt(limite))
                }
            }
        });

    } catch (error) {
        console.error('Error en getProductos: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos',
            error: error.message
        })
    }
};

/**
 * obtener todas los productos por id
 * GET /api/admin/productos/:id
 * 
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const getProductosById = async (req, res) => {
    try {
        const { id } = req.params;

        //Buscar productos con relacion
        const producto = await Producto.findByPk( id, {
            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre', 'activo']
                },
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre', 'activo']
                }
            ]
        });

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        // Respuesta Exitosa
        res.json({
            success: true,
            data: {
                producto
            }
        });


    } catch (error) {
        console.error('Error en getProductoById: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener producto',
            error: error.message
        })
    }
};

/**
 * Crear un producto
 * POST /api/admin/productos
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const crearProducto = async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock, categoriaId, subcategoriaId } = req.body;

        //validacion 1 verificar campos requeridos
        if (!nombre || !precio || !categoriaId || !subcategoriaId) {
            return res.status(400).json({
                success: false,
                message: 'Fatan campos requeridos, nombre, precio, categoriaId y subcategoriaId'
            });
        }
        /**
        //valida 2 si la categoria existe
        const categoria = await Categoria.findByPk(categoriaId);

        if(!categoria) {
            return res.status(404).json({
                success: false,
                message: `No existe la categoria con id ${categoriaId}`
            });
        }
        */
        // Validacion 2 verifica si la categoria esta activa
        const categoria = await Categoria.findByPk(categoriaId);
        if (!categoria) {
            return res.status(400).json({
                success: false,
                message: `La categoria no existe una categoria con id ${categoriaId}`
            });
        }
        if (!categoria.activo) {
            return res.status(400).json({
                success: false,
                message: `La categoria ${categoria.nombre} esta inactiva` 
            });
        }


        //valida 3 si la subcategoria existe y pertenece a una categoria
        const subcategoria = await Subcategoria.findByPk(subcategoriaId);

        if(!subcategoria) {
            return res.status(404).json({
                success: false,
                message: `No existe la subcategoria con id ${subcategoriaId}`
            });
        }
        // Validacion 3 verifica si la subcategoria esta activa
        if (!subcategoria.activo) {
            return res.status(400).json({
                success: false,
                message: `La subcategoria "${subcategoria.nombre}" esta inactiva, activela primero`
            });
        }
        if(!subcategoria.categoriaId !== parseInt(categoriaId)) {
            return res.status(400).json({
                success: false,
                message: `La subcategoria ${subcategoria.nombre} no pertenece a la categoria con id ${categoriaId}`
            });
        }
        //Validacion 4 precio
        if(parseFloat(precio) < 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio debe mayor a 0'
            });
        }

        if(parseInt(stock) < 0) {
            return res.status(400).json({
                success: false,
                message: 'El stock no puede ser negativo'
            });
        }

        //obteber imagen
        const imagen = req.file ? req.file.filename : null;
    
        // Crear producto
        const nuevoProducto = await Producto.create({
            nombre,
            descripcion: descripcion || null, //si no se proporciona la descripcion se establece como null
            precio: parseFloat(precio),
            stock: parseInt(stock),
            categoriaId: parseInt(categoriaId),
            subcategoriaId: parseInt(subcategoriaId),
            imagen,
            activo: true
        });

        // Recargar con relaciones
        await nuevoProducto.reload({
            include: [
                { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
                { model: Subcategoria, as: 'subcategoria', attributes: ['id', 'nombre'] },
            ]
        });
        
        //Respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: {
                producto: nuevoProducto
            }
        });

    } catch (error) {
        console.error('Error en crearProducto', error);

        //si hubo error eliminar la imagen subida
        if (req.file) {
            const rutaImagen = path.join(__dirname, '../uploads', req.file.filename);
            try {
                await fs.unlink(rutaImagen);
            } catch (err) {
                console.error('Error al eliminar imagen: ', err);
            }
        }

        if (error.name === 'SequelizeValidationError') 
        {
        return res.status(400).json({
            success: false,
            message: 'Error de validacion',
            errors: error.errors.map(e => e.message)
        });
    }
    res.status(500).json({
        success: false, 
        message: 'Error al crear producto',
        error: error.message
    })
}
};

/**
 * Actualizar producto
 * PUT /api/admin/productos/:id
 * body: { nombre, descripcion, precio, stock, categoriaId, subcategoriaId }
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, precio, stock, categoriaId, subcategoriaId, activo } = req.body;
        
        //Buscar producto
       const producto = await Producto.findByPk(id);

       if(!producto) {
        return res.status(404).json({
            success: false,
            message: 'Producto no encontrada'
            });
        }
        if (categoriaId && categoriaId !== producto.categoriaId)
             {
            const categoria = await Categoria.findByPk(categoriaId);

            if (!categoria || !categoria.activo) {
                return res.status(404).json({
                    success: false,
                    message: 'Categoria invalida o inactiva'
                });
            }
        }

        if (subcategoriaId && subcategoriaId !== producto.subcategoriaId)
             {
            const subcategoria = await Subcategoria.findByPk(subcategoriaId);

            if (!subcategoria || !subcategoria.activo) {
                return res.status(404).json({
                    success: false,
                    message: 'Subcategoria invalida o inactiva'
                });
            }

            const catId = categoriaId || producto.categoriaId
            if (!subcategoria.categoriaId !== parseInt(catId)) {
                return res.status(404).json({
                    success: false,
                    message: 'La subcategoria no pertenece a la categoria seleccionada'
                });
            }
        }

            //validar precio
            if(precio !== undefined && parseFloat(precio) < 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio debe mayor a 0'
            });
            }

            if(stock !== undefined && parseInt(stock) < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El stock no puede ser negativo'
                });
            }

            //Manejar imagen
            if (req.file) {
                //Eliminar imagen anterior si existe
                if(producto.imagen) {
                    const rutaImagenAnterior = path.join(__dirname, '../uploads', producto.imagen); //dirname comando que permite cambiar el nombre del archivo
                    try {
                        await fs.unlink(rutaImagenAnterior);
                    } catch (err) {
                        console.error('Error al eliminar imagen anterior: ',err);
                    }
                }
                producto.imagen = req.file.filename
            }

        //Actualizar campos
        if (nombre !== undefined) producto.nombre = nombre;
        if (descripcion !== undefined) producto.descripcion = descripcion;
        if (precio !== undefined) producto.precio = parseFloat(precio);
        if (stock !== undefined) producto.stock = parseInt(stock);
        if (categoriaId !== undefined) producto.categoriaId = parseInt(categoriaId);
        if (subcategoriaId !== undefined) producto.subcategoriaId = parseInt(subcategoriaId);
        if (activo !== undefined) producto.activo = activo;

        //guardar cambios
        await producto.save();

        //respuesta exitosa
        res.json({
            success: true,
            message: 'Producto actualizada exitosamnete',
            data: {
                producto
            }
        });

    } catch (error) {
        console.error('Error en actualizarProducto: ', error);
        if (req.file) {
             const rutaImagen = path.join(__dirname, '../uploads', req.file.filename);
            try {
                await fs.unlink(rutaImagen);
            } catch (err) {
                console.error('Error al eliminar imagen: ', err);
            }
        }

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json ({
            success: false,
            message: 'error al actualizar producto',
            error: error.message
        });
    }
};

/**
 * Activar/Desactivar producto
 * PATCH /api/admin/productos/:id/estado
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const toggleProducto = async (req, res) => {
    try {
        const { id } = req.params;

        //Buscar producto
        const producto = await Producto.findByPk(id);

        if(!producto) {
            return res.status(404).json({
                success: false, 
                message: 'Producto no encontrada'
            });
        }

        producto.activo = !producto.activo;
        await producto.save();

        //Respuesta exitosa
        res.json({
            success: true,
            message: `Producto ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`,
            data:{
                producto,
            }
        });
    } catch (error) {
        console.error ('Error en togglePrducto:', error);
        res.status(500).json({
            success: false,
            messsage: 'Error al cambiar estado del producto',
            error: error.message
        });
    }
};

/**
 * Eliminar producto
 * DELETE /api/admin/productos/:id
 * Elimina el producto y su imagen
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const eliminarProducto = async (req,res) => {
    try {
        const { id } = req.params;

        //Buscar producto 
        const producto = await Producto.findByPk(id);

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrada'
            });
        }

        //El hook beforeDestroy se encarga de eliminar la imagen
        //Eiminar producto
        await producto.destroy();

        //Respuesta exitosa
        res.json({
            success: true,
            message: 'producto eliminada exitosamente'
        });

    } catch (error) {
        console.error ('Error al eliminar producto', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar producto', 
            error: error.message
        });
    }
};

/**
 * Actualizar stock de un producto
 * 
 * PATCH api/admin/productos/:id/stock
 * body: {cantidad, operacion: 'aumentar' | 'reducir', | 'establecer' }
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const actualizarStock =  async (req, res) => {
    try {
        const { id } = req.params
        const { cantidad, operacion } = req.body;

        if (!cantidad || !operacion) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere cantidad y operacion'
            });
        }
        const cantidadNum = parseInt(cantidad);
        if (cantidadNum < 0) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad no puede ser negativa'
            });
        }
        const producto = await Producto.findByPk(id);

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        let nuevoStock;

        switch (operacion) {
            case 'aumentar':
                nuevoStock = producto.aumentarStock(cantidadNum);
                break;
            case 'reducir':
                if (cantidadNum > producto.stock) {
                    return res.status(400).json({
                        success: false,
                        message: `No hay suficiente stock. Stock actual: ${producto.stock}`
                    });
                }
                nuevoStock = producto.reducirStock(cantidadNum);
                break;
            case 'establecer':
                nuevoStock = cantidadNum;
                break;
            default: 
                return res.status(400).json({
                    success: false,
                    message: 'Operacion invalida usa aumentar, reducir o establecer'
                });
            }

            producto.stock = nuevoStock;
            await producto.save();

            res.json({
                success: true, 
                message: `Stock ${operacion === 'aumentar' ? 'aumentado' : operacion === 'reducir' ? 'reducido' : 'establecido'} exitosamente`,
                data: {
                    productoId : producto.id,
                    nombre: producto.nombre,
                    stockAnterior: operacion === 'establecer' ? null : (operacion === 'aumentar' ? producto.stock - cantidadNum : producto.stock + cantidadNum),
                    stockNuevo: producto.stock
                }
            });
        } catch (error) {
            console.error('Error en actualizarStock', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar stock',
                error: error.message
            });
        }
    };
//Exportar todos los controladores
module.exports = {
    getProductos,
    getProductosById,
    crearProducto,
    actualizarProducto,
    toggleProducto,
    eliminarProducto,
    actualizarStock
};