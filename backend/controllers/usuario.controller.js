/**
 * Controlador de categorias
 * maneja las operaciones crud y activar y desativar categorias
 * solo accesible por adminitradores
 */

/**
 * Importar modelos
 */

const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');
const Producto = require('../models/Producto');

/**
 * obtener todas las categorias
 * query params:
 * Activo true/false (filtrar por estado)
 * incluirsubcategorias true/false (incluir subcategorias relacionadas)
 * 
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const getCategorias = async (req, res) => {
    try {
        const { activo, IncluirSubcategorias } = req.query

        // Opciones de consulta
        const opciones = {
            order: [['nombre', 'ASC']] //ordenar de manera alfabetica
        };

        //Filtrar por estado activo si es especifica
        if (activo !== undefined) {
            opciones.where = { activo: activo === 'true' };
        }

        // Incluir subcategorias si se solicita
        if (IncluirSubcategorias === 'true') {
            opciones.include == [{
                model: Subcategoria,
                as: 'subcategorias', // campo del alias para la relacion 
                attributes: [ 'id', 'nombre', 'descripcion', 'activo'] //Campos a incluir de la subcategoria
            }]
        }

        // Obtener categorias 
        const categorias = await Categoria.findAll(opciones);

        //Respuesta exitosa

        res.json({
            sucess: true,
            count: categorias.length,
            data: {
                categorias
            }
        });

    } catch (error) {
        console.error('Error en getCategorias: ', error);
        res.status(500).json[{
            sucess: false,
            message: 'Error al obtener categorias',
            error: error.message
        }]
    }
};

/**
 * obtener todas las categorias por id
 * GET /api/categorias/:id
 * 
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const getCategoriasById = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar categorias con subcategorias y contar productos
        const categoria = await Categoria. findAll( id, {
            include: [
                {
                    model: Subcategoria,
                    as: 'subcategorias',
                    attributes: ['id', 'nombre', 'descripcion', 'activo']
                },
                {
                    model: Producto,
                    as: 'productos',
                    attributes: ['id']
                }
            ]
        });

        if (!categoria) {
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        //agregar contadpr de productos
        const categoriaJSON = categoria.toJSON();
        categoriaJSON.totalProductos = categoriaJSON.productos.length;
        delete categoriaJSON.productos; //no enviar la lista completa, solo el contador

        // Respuesta Exitosa
        res.json({
            success: true,
            data: {
                categoria: categoriaJSON
            }
        });


    } catch (error) {
        console.error('Error en getCategoriasById: ', error);
        res.status(500).json[{
            sucess: false,
            message: 'Error al obtener categoria',
            error: error.message
        }]
    }
};

/**
 * Crear una categoria
 * POST 7api/admin/categorias
 * Body: { nombre, descripcion }
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const crearCategoria = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;

        //validacion 1 verificar campos requeridos
        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la categoria es requerido'
            });
        }

        // Validacion 2 verificar que el nombre no exista 
        const categoriaExistente = await Categoria.findOne({ where: { nombre }
        });

        if (categoriaExistente) {
            return res.status(400).json({
                success: false,
                message : `Ya existe una categoria con el nombre "${nombre}"`
            });
        }

        // Crear categoria
        const nuevaCategoria = await Categoria.create({
            nombre,
            descripcion: descripcion || null, //si no se proporciona la descripcion se establece como null
            activo: true
        });

        //Respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Categora creada exitosamente',
            data: {
                categoria: nuevaCategoria
            }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
        console.error('Error en crear categoria: ', error);
        return res.status(400).json({
            success: false,
            message: 'Error de validacion',
            errors: error.errors.map(e => e.message)
        });
    }
    res.status(500).json({
        success: false, 
        message: 'Error al crear categoria',
        error: error.message
    })
}
};

/**
 * Actualizar categoria
 * PUT /api/admin/categorias/:id
 * body: { nombre, descripcion }
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const actualizarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion } = req.body;

        //Buscar categoria
       const categoria = await Categoria.findByPK(id);

       if(!categoria) {
        return res.status(404).json({
            success: false,
            message: 'Categoria no encontrada'
            });
        }

        // validacion 1 si se cambia el nombre verificar que no exista 
        if (nombre && nombre !== categoria.nombre) {
            const categoriaConMismoNombre = await Categoria.findOne({ where: { nombre}
            });

            if (categoriaConMismoNombre) {
                return res.status(400).json({
                    success: false,
                    message: `Ya existe una categora con el nombre "${nombre}"`
                });
            }
        }

        //Actualizar campos
        if (nombre !== undefined) categoria.nombre = nombre;
        if (descripcion !== undefined) categoria.descripcion = descripcion;
        if (activo !== undefined) categoria.activo = activo;

        //guardar cambios
        await categoria.save();

        //respuesta exitosa
        res.json({
            success: true,
            message: 'Categoria actualizada exitosamnete',
            data: {
                categoria
            }
        });

    } catch (error) {
        console.error('Error en actualizarCategoria: ', error);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json ({
            sucess: false,
            message: 'error al actualizar categoria',
            error: error.message
        });
    }
};

/**
 * Activar/Desactivar categoria
 * PATCH /api/admin/categorias/:id/estado
 * 
 * Al desactivar una categoria se desactivan todas las subcategorias relacionadas
 * al desacrivar una subcategorias se desactivan todos los productos relacionados
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const toggleCategoria = async (req, res) => {
    try {
        const { id } = req.params;

        //Buscar categoria
        const categoria = await Categoria.findByPK(id);

        if(!categoria) {
            return res.status(404).json({
                success: false, 
                message: 'Categoria no encontrada'
            });
        }

        // Alternar estado activo
        const nuevoEstado = !categoria.activo;
        categoria.activo = nuevoEstado;

        // Guardar cambios
        await categoria.save();

        //Contar cuantos registros se afectaron 
        const subcategoriasAfectadas = await Subcategoria.count({ where: { categoriaId: id }
        });

        const productosAfectados = await Producto.count({ where: { categoriaId: id }
        });

        //Respuesta exitosa
        res.json({
            success: true,
            message: `Categoria ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`,
            data:{
                categoria,
                afectados: {
                    subcategorias: 
                    subcategoriasAfectadas,
                    productos: productosAfectados
                }
            }
        });
    } catch (error) {
        console.error ('Error en toggleCategoria:', error);
        res.status(500).json({
            success: false,
            messsage: 'Error al cambiar de la categoria',
            error: error.message
        });
    }
};

/**
 * Eliminar categoria 
 * DELETE /api/admin/categorias/:id
 * Solo permite eliminar si no tiene subcategorias ni productos relacionados
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const eliminarCategoria = async (req,res) => {
    try {
        const { id } = req.params;

        //Buscar categoria
        const categoria = await Categoria.findByPK(id);

        if (!categoria) {
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        // Validacion verificar que no tenga subcategorias
        const subcategorias = await Subcategoria.count({
            where: { categoriaId: id}
        });

        if (subcategorias > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar a categoria porque tiene ${subcategorias} subcategorias asociadas usa PATCH /api/admin/categorias/:id toggle para para desactivarla en lugar de eliminarla`
            });
        }

        // Validacion verificar que no tenga productos
        const productos = await Producto.count({
            where: { categoriaId: id}
        });

        if (productos > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar a categoria porque tiene ${productos} productos asociadas usa PATCH /api/admin/categorias/:id toggle para para desactivarla en lugar de eliminarla`
            });
        }

        //eEiminar categoria
        await categoria.destroy();

        //Respuesta exitosa
        res.json({
            success: true,
            message: 'Categoria eliminada exitosamente'
        });

    } catch (error) {
        console.error ('Error al eliminar categoria', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar categoria', 
            error: error.message
        });
    }
};

/**
 * Obtener estadisticas de una categoria
 * GET /api/admin/categorias estadistucas
 * retorna
 * Total de subcategorias activas /inactivas
 * Total de productos activas /inactivas
 * valor total del inventario
 * stock total
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const getEstadisticasCategoria = async (req, res)  => {
    try {
        const { id } = req.params;

        //Verificar que la categoria exisa
        const categoria = await Categoria.findByPK(id);

        if (!categoria) {
            return res.status(404).json({
                sucess: false,
                message: 'Categoria no encontrada'
            });
        }

        //contar subcategorias
        const totalSubcategorias = await Subcategoria.count({
            where: { categoriaId: id }
        });
        const subcategoriasActivas = await Subcategoria.count({
            where: { categoriaId: id, activo: true }
        });

        // contar productos
        const totalProductos = await Producto.count({
            where: { categoriaId: id }
        });
        const productosActivos = await Producto.count({
            where: { categoriaId: id, activo: true }
        });

        // Obtener productos para calcular estadisticas
        const productos = await Producto.findAll({
            where: { categoriaId: id},
            attributes: ['precio', 'stock']
        });

        //calcular estadisticas de inventario
        let valorTotalInventario = 0;
        let stockTotal = 0;

        productos.forEach(producto => {
            valorTotalInventario += parseFloat(producto.precio) * producto.stock;
            stockTotal += producto.stock
        });

        //Respuesta exitosa

        res.json({
            success: true,
            data: {
                categoria: {
                    id: categoria.id,
                    nombre: categoria.nombre,
                    activo: categoria.activo
                },
                estadisticas: {

                    subcategorias: {
                        total: totalSubcategorias,
                        activas: subcategoriasActivas,
                        inactivas: totalSubcategorias - subcategoriasActivas
                    },

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
        console.error('Error en getEstadisticasCategoria: ',error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadisticas',
            error: error.message
        })
    }
};
//Exportar todos los controladores
module.exports = {
    getCategorias,
    getCategoriasById,
    crearCategoria,
    actualizarCategoria,
    toggleCategoria,
    eliminarCategoria,
    getEstadisticasCategoria
};