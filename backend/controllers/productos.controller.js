/**
 * Controlador de producto
 * maneja las operaciones crud y activar y desativar producto
 * solo accesible por adminitradores
 */

/**
 * Importar modelos
 */
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');

// importar path y fs para manejo de imagenes 
const path = require('path');
const fs =  require('fs');


/**
 * obtener todos los productos
 * query params:
 * categoriaId: Id de la categoria para filtrar por categoria
 * SubcategoriaId: Id de la subcategoria para filtrar por subcategoria
 * Activo true/false (filtrar por estado activo o inactivo)
 * 
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const getProductos= async (req, res) => {
    try {
        const { 
            categoriaId, 
            subcategoriaId,  
            activo, 
            conStock,
            buscar,
            pagina = 1,
            limite = 100,
        } = req.query
        
        // Construir filtros
        const where = {};
       if (categoriaId) where.categoriaId = categoriaId;
       if (subcategoriaId) where.subcategoriaId = subcategoriaId;
       if (activo !== undefined) where.activo = activo === 'true';
       if (conStock === 'true') where.stock = { [require ('sequelize').Op.gt]: 0 };

       //Paginacion
       const offset = (parseInt(pagina) -1) *parseInt(limite);

        // Opciones de consulta
        const opciones = {
            where,
                incluide: [
                    {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre',]
                },
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre',]
                }
            ],
            limit: parseInt(limite),
            offset,
            order: [['nombre', 'ASC']] // Ordenar de manera alfabetica 
        };

        //obtener productos y total 
        const {count, rows: productos } = await Producto.findAndCountAll(opciones);


        //Respuesta exitosa
        res.json({
            sucess: true,
            data: {
                 productos,
                 paginacion: {
                    total: count,
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    totalpaginas: Math.ceil(count / parseInt(limite))  
                    }
            }
        });

    } catch (error) {
        console.error('Error en getProducto: ', error);
        res.status(500).json[{
            sucess: false,
            message: 'Error al obtener producto',
            error: error.message
        }]
    }
};

/**
 * obtener todas los productos por id
 * GET /api/productos/:id
 * 
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const getProductosById = async (req, res) => {
    try {
        const { id } = req.params;

        //Buscar productos con relacion 
        const producto = await Producto. findAll( id, {
            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id','nombre', 'activo']
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
                message: 'producto no encontrados'
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
        console.error('Error en getProductosById: ', error);
        res.status(500).json[{
            sucess: false,
            message: 'Error al obtener producto',
            error: error.message
        }]
    }
};

/**
 * Crear una producto
 * POST /api/admin/productos
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const crearProductos = async (req, res) => {
    try {
        const { id, nombre, descripcion, precio, stock, categoriaId, subcategoriaId } = req.body;

        //validacion 1 verificar campos requeridos
        if (!nombre || !precio || !stock ||!categoriaId || !subcategoriaId) {
            return res.status(400).json({
                success: false,
                message: 'faltas campos requeridos nombre, precio, categoriaId, subcategoriaId'
            });
        }

        // Validar 2 verificar si la categoria esta activa 
        const categoria = await Categoria.findByPk(categoriaId)
        if (!categoria) {
                return res.status(400).json({
                success: false,
                message: `No existe una categoria con Id "${categoriaId}"`
            });
        }
        if (!categoria.activo) {
            return res.status(400).json({
                success: false,
                message: `La categoria "${categoria.nombre}" esta inactiva`
            })
        }

        // Validacion 3 verificar que la subcategoria existe y pertenece a una categoria
        const subcategoria = await Subcategoria.findByPk({ where: { nombre, categoriaId, subcategoriaId }
        });

        if(!subcategoria) {
            return res.status(404).json({
                success: false,
                message: `No existe la subcategoria con id ${subcategoriaId}`
            });
        }

        if (!subcategoria.activo) {
                return res.status(400).json({
                success: false,
                message: `La categoria con id ${subcategoria.nombre} "esta inactiva activela primero`
            });
        }

        if (!subcategoria.categoriaId !== parseInt(categoriaId)) {
        return res.status(400).json({
            success: false,
            message: `La Subcategoria "${subcategoria}" no pertenece a la categoria con id "${categoriaId}"`
            });
        }
        
        // Validar el stock
        if (parseInt(stock)) {
        return res.status(400).json({
            success: false,
            message: 'El stock no debe ser negativo'
            });
        }
        
        // Validar el precio
        if (parseFloat(precio)) {
        return res.status(400).json({
            success: false,
            message: 'El precio debe ser mayor a 0'
            });
        }

         // Validar la imagen
         const imagen = req.file ? req.file.filename : null;

        // Crear producto
        const nuevoProducto = await Producto.create({
            nombre,
            descripcion: descripcion || null, //si no se proporciona la descripcion se establece como null
            precio : parseFloat(precio),
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
            message: 'Producto creado existosamente',
            data: {
                producto: nuevoProducto
            }
        });

        } catch (error) {
            console.error('Error en crearProducto: ', 
            error);

            // Si hubo un error eliminar la imagen subida 
            if (req.file) {
                const rutaImage = path.join(__dirname, '../uploads', req.file.filename);
                try {
                    await fs.unlink(rutaImage);
                } catch (err) {
                    console.error('Error al liminar imagen: ', err);
                }
            }
            if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }
        res.status(500).json({
            success: false, 
            message: 'Error al crear Producto',
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
        const { nombre, descripcion, precio, stock, categoriaId, subcategoriaId, activo} = req.body;

        //Buscar producto
       const producto = await Producto.findByPk(id);

       if(!producto) {
        return res.status(404).json({
            success: false,
            message: 'producto no encontrado'
            });
        }

        // Validacion si se cambia la categoria y subcategoria
        if (categoriaId && categoriaId !== producto.categoriaId)
            {
            const categoria = await Categoria.findByPk(categoriaId);

            if(!categoria || !categoria.activo) {
                return res.status(400).json({
                    success: false,
                    message: 'categoria invalida o inactiva'
                });
            }
        } 

        if (subcategoriaId && subcategoriaId !== producto.subcategoriaId)
            {
            const subcategoria = await Subcategoria.findByPk(subcategoriaId);

            if(!subcategoria || !subcategoria.activo) {
                return res.status(400).json({
                    success: false,
                    message: 'subcategoria invalida o inactiva'
                });
            }

            const catId = categoriaId || producto.categoriaId
            if(!subcategoria.categoriaId !== parseInt(catId)) {
                return res.status(404).json({
                    success: false,
                    message: 'la subcategoria no pertenece a la categoria seleccionada'
                });
            }
        }

            // Validar precio y stock 
            if (precio !== undefined && parseFloat(precio) < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El precio debe ser mayor a 0'
                });
            }

            if (stock !== undefined && parseInt(stock) < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El stock no puede ser negativo'
                });
            }

            //Manejar imagen
            if (req.file) {
             //eliminar la imagen anterior si existe
                if (producto.imagen) {
                    const rutaImagenAnterior = path.join(__dirname, '../uploads', producto.imagen);
                    try {
                        await fs.unlink(rutaImagenAnterior);
                    } catch (err) {
                        console.error('Error al eliminar imagen anterior: ', err)
                    }
                }
                producto.imagen =req.file.filename;
            }

        //Actualizar campos
        if (nombre !== undefined) producto.nombre = nombre;
        if (descripcion !== undefined) producto.descripcion = descripcion;
        if (precio !== undefined) producto.precio = parseFloat;
        if (stock !== undefined) producto.stock = parseInt;
        if (categoriaId !== undefined) producto.categoriaId = parseInt(categoriaId);
        if (subcategoriaId !== undefined) producto.subcategoriaId = parseInt (subcategoriaId);
        if (activo !== undefined) producto.activo = activo;

        //guardar cambios
        await producto.save();

        //respuesta exitosa
        res.json({
            success: true,
            message: 'producto actualizada exitosamente',
            data: {
              producto
            }
        });


    } catch (error) {
        console.error('Error en actualizarProducto: ', error);
        if (req.file) {
            const rutaImagen = path.join(__dirname, '../uploads',req.file.name);
             try {
                await fs.unlink(rutaImagen);
            } catch (err) {
                console.error('Error al liminar imagen: ', err);
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
            sucess: false,
            message: 'error al actualizar producto',
            error: error.message
        });
    }
};

/**
 * Activar/Desactivar producto
 * PATCH /api/admin/productos/:id/estado
 * al desactivar una subcategoria se desactivan todos los productos relacionados
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const toggleProducto = async (req, res) => {
    try {
        const { id } = req.params;

        //Buscar categoria
        const producto = await producto.findByPK(id);

        if(!producto) {
            return res.status(404).json({
                success: false, 
                message: 'producto no encontrada'
            });
        }

        producto.activo = !producto.activo;
        await producto.save();

        //Respuesta exitosa
        res.json({
            success: true,
            message: `producto ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`,
            data:{
                productos: productosAfectados
            }
        });
    }  catch (error) {
        console.error ('Error en toggleproducto:', error);
        res.status(500).json({
            success: false,
            messsage: 'Error al cambiar de la producto',
            error: error.message
        });
    }
};

/**
 * Eliminar productos
 * DELETE /api/admin/producto/:id
 * Elimina su producto y su imagen
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const eliminarProducto = async (req,res) => {
    try {
        const { id } = req.params;

        //Buscar producto
        const producto = await Producto.findByPK(id);

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'producto no encontrado'
            });
        }

        // El hook beforeDestroy se encarga  de eliminar la imagen
        await producto.destroy();

        //Respuesta exitosa
        res.json({
            success: true,
            message: 'Eliminacion del producto exitoso'
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
 * PATCH/api/admin/productos/:id/stock
 * body: { cantidad, operacion: 'aumentar' | 'reducir' | 'establecer }
 * @param {Object} req request express
 * @param {Object} res response express
 */
const actualizarStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad, operacion } = req.body;

        if (!cantidad || !operacion){
            return res.status(400).json ({
                success: false, 
                message: 'Se requiere cantidad y operacion'
            });
        }

        const cantidadNUm = parseInt(cantidad);
        if (cantidadNUm < 0) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad no puede ser negativa'
            })
        }
        const producto = await Producto.findByPk(id);

        if (!producto) {
            return res.status(404).json ({
                success: false,
                message: 'Producto no encontrado'
            })
        }

        let nuevoStock;

        switch (operacion) {
            case 'aumentar':
                nuevoStock = producto.aumentarStock(cantidadNUm);
                break;
            case 'reducir':
                if (cantidadNUm > producto.stock) {
                    return res.status(400).json ({
                        success: false,
                        message: `No hay suficiente stock. Stock actual: ${producto.stock}`
                    });
                }
                nuevoStock = producto.reducirStock(cantidadNUm);
                break;
            case 'establecer':
                nuevoStock = cantidadNUm;
                break;
            default: 
                return res.status(400).json({
                    success: false,
                    message: 'Operacion invalida. Debe ser aumentar, reducir o establecer'
                });
            }
    
        producto.stock = nuevoStock;
        await producto.save();

        res.json({
            success: true,
            message: `Stock ${operacion === 'aumentar' ? 'aumentado' : operacion === 'reducir' ? 'reducido': 'establecido'} exitosamente `,
            data: {
                productoId: producto.id,
                nombre: producto.nombre,
                stockAnterior: operacion === 'establecer' ? null: (operacion === 'aumentar' ? producto.stock - cantidadNUm : producto.stock + cantidadNUm),
                stockNuevo: producto.stock
            }
        });
    } catch (error) {
        console.error('Error en actualizar stock producto: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar stock del producto', 
            error: error.message
        });
    }
};

//Exportar todos los controladores
module.exports = {
    getProductos,
    getProductosById,
    crearProductos,
    actualizarProducto,
    toggleProducto,
    eliminarProducto,
    actualizarStock
};