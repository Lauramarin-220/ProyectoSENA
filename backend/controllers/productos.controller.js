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

         // Validar el imagen
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
 * body: { nombre, descripcion, categoriaId, subcategoriaId }
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, precio, stock, categoriaId, subcategoriaId } = req.body;

        //Buscar producto
       const producto = await Producto.findByPk(id);

       if(!producto) {
        return res.status(404).json({
            success: false,
            message: 'producto no encontrado'
            });
        }
        if (categoriaId && categoriaId !== producto.productoId){
            const nuevaCategoria = await Categoria.findByPk(categoriaId);

            if(!nuevaCategoria) {
                return res.status(400).json({
                    success: false,
                    message: `No existe la categoria con id ${categoriaId}`
                });
            }

            if(!nuevaCategoria.activo) {
                return res.status(400).json({
                    success: false,
                    message: `La categoria "${nuevaCategoria.nombre}" esta inactiva`
                });
            }
        }

        if (subcategoriaId && subcategoriaId !== producto.productoId){
            const nuevasubCategoria = await Subcategoria.findByPk(categoriaId);

            if(!nuevasubCategoria) {
                return res.status(400).json({
                    success: false,
                    message: `No existe la subcategoria con id ${subcategoriaId}`
                });
            }

            if(!nuevasubCategoria.activo) {
                return res.status(400).json({
                    success: false,
                    message: `La subcategoria "${nuevasubCategoria.nombre}" esta inactiva`
                });
            }
        }

        // validacion 1 si se cambia el nombre verificar que no exista la categoria
        if (nombre && nombre !== producto.nombre) {
            const categoriafinal = categoriaId || producto.productoId; // si no se cambia la categoria usar la categoria actual
            

                const ProductoConMismoNombre = await Producto.findOne({
                    where:{
                        nombre,
                        categoriaId: categoriafinal
                    }
                });

                if (ProductoConMismoNombre) {
                    return res.status(400).json ({
                        success: false,
                        message: `Ya existe un producto con el mismo nombre "${nombre}" en esta categoria`
                    });
                }
            }

        //Actualizar campos
        if (nombre !== undefined) producto.nombre = nombre;
        if (descripcion !== undefined) producto.descripcion = descripcion;
        if (categoriaId !== undefined) producto.categoriaId = categoriaId;
        if (subcategoriaId !== undefined) producto.subcategoriaId = subcategoriaId;
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
 * Activar/Desactivar subcategoria
 * PATCH /api/admin/subcategorias/:id/estado
 * al desactivar una subcategorias se desactivan todos los productos relacionados
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const toggleSubCategoria = async (req, res) => {
    try {
        const { id } = req.params;

        //Buscar subcategoria
        const subcategoria = await Subcategoria.findByPK(id);

        if(!subcategoria) {
            return res.status(404).json({
                success: false, 
                message: 'Subcategoria no encontrada'
            });
        }

        // Alternar estado activo
        const nuevoEstado = !subcategoria.activo;
        subcategoria.activo = nuevoEstado;

        // Guardar cambios
        await subcategoria.save();

        //Contar cuantos registros se afectaron 
        const productosAfectados = await Producto.count({ where: { subcategoriaId: id }
        });

        //Respuesta exitosa
        res.json({
            success: true,
            message: `Subcategoria ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`,
            data:{
                subcategoria,
                productos: productosAfectados
            }
        });
    } catch (error) {
        console.error ('Error en toggleSubcategoria:', error);
        res.status(500).json({
            success: false,
            messsage: 'Error al cambiar de la subcategoria',
            error: error.message
        });
    }
};

/**
 * Eliminar subcategoria 
 * DELETE /api/admin/subcategorias/:id
 * Solo permite eliminar si no tiene subcategorias ni productos relacionados
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const eliminarSubCategoria = async (req,res) => {
    try {
        const { id } = req.params;

        //Buscar subcategoria
        const subcategoria = await Subcategoria.findByPK(id);

        if (!subcategoria) {
            return res.status(404).json({
                success: false,
                message: 'subcategoria no encontrada'
            });
        }
        // Validacion verificar que no tenga productos
        const productos = await Producto.count({
            where: { categoriaId: id}
        });

        if (productos > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar la subcategoria porque tiene ${productos} productos asociadas usa PATCH /api/admin/subcategorias/:id toggle para para desactivarla en lugar de eliminarla`
            });
        }

        //Eiminar subcategoria
        await subcategoria.destroy();

        //Respuesta exitosa
        res.json({
            success: true,
            message: 'subcategoria eliminada exitosamente'
        });

    } catch (error) {
        console.error ('Error al eliminar subcategoria', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar subcategoria', 
            error: error.message
        });
    }
};

/**
 * Obtener estadisticas de una subcategoria
 * GET /api/admin/subcategorias estadisticas
 * Total de subcategorias activas /inactivas
 * Total de productos activas /inactivas
 * valor total del inventario
 * stock total
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const getEstadisticasSubCategoria = async (req, res)  => {
    try {
        const { id } = req.params;

        //Verificar que la subcategoria exista
        const subcategoria = await Subcategoria.findByPK(id [{
            include: [{
                model: Categoria,
                as: 'categoria',
                attributes: ['id','nombre']
            }]
        }]);

        if (!subcategoria) {
            return res.status(404).json({
                sucess: false,
                message: 'subcategoria no encontrada'
            });
        }

        // contar productos
        const totalProductos = await Producto.count({
            where: { subcategoriaId: id }
        });
        const productosActivos = await Producto.count({
            where: { subcategoriaId: id, activo: true }
        });

        // Obtener productos para calcular estadisticas
        const productos = await Producto.findAll({
            where: { subcategoriaId: id},
            attributes: ['precio', 'stock']
        });

        //calcular estadisticas de inventario
        let valorTotalInventario = 0;
        let stockTotal = 0;

        productos.forEach(producto => {
            valorTotalInventario += parseFloat(producto.precio) * producto.stock;
        });

        //Respuesta exitosa

        res.json({
            success: true,
            data: {
                subcategoria: {
                    id: subcategoria.id,
                    descripcion: subcategoria.descripcion,
                    activo: subcategoria.activo,
                    categoria: subcategoria.categoria
                },
                estadisticas: {
                    productos: {
                        total: totalProductos,
                        activos: productosActivos,
                        inactivos: totalProductos - productosActivos
                    },
                    inventario: {
                        stockTotal,
                        valorTotal: valorTotalInventario.toFixed(2) //quitar los decimales
                    }
                }
            }
        });
    } catch(error) {
        console.error('Error en getEstadisticasSubcategoria: ',error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadisticas',
            error: error.message
        })
    }
};
//Exportar todos los controladores
module.exports = {
    getSubcategorias,
    getSubcategoriasById,
    crearSubcategoria,
    actualizarSubcategoria,
    toggleSubCategoria,
    eliminarSubCategoria,
    getEstadisticasSubCategoria
};