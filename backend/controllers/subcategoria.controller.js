/**
 * Controlador de subcategorias
 * maneja las operaciones crud y activar y desativar subcategorias
 * solo accesible por adminitradores
 */

/**
 * Importar modelos
 */

const Subcategoria = require('../models/Subcategoria');
const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');

/**
 * obtener todas las subcategorias
 * query params:
 * categoriaId: Id de la categoria para filtrar por categoria
 * Activo true/false (filtrar por estado)
 * incluir categoria true/false (incluir categorias relacionadas)
 * 
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const getSubategorias = async (req, res) => {
    try {
        const { categoriaId, activo, incluirCategoria } = req.query

        // Opciones de consulta
        const opciones = {
            order: [['nombre', 'ASC']] //ordenar de manera alfabetica
        };

        //Filtros
        const where = {};
        if (categoriaId) where.categoriaId = categoriaId;
        if (activo !== undefined) where.activo = activo === 'true';

        if(Object.keys(where).length > 0) {
            opciones.where = where;
        }

        // Incluir categoria si se solicita
        if (incluirCategoria === 'true') {
            opciones.include = [{
                model: Categoria,
                as: 'categoria', // campo del alias para la relacion 
                attributes: [ 'id', 'nombre', 'activo'] //Campos a incluir de la categoria
            }]
        }

        // Obtener subcategorias 
        const subcategorias = await Subcategoria.findAll(opciones);

        //Respuesta exitosa

        res.json({
            success: true,
            count: subcategorias.length,
            data: {
                subcategorias
            }
        });

    } catch (error) {
        console.error('Error en getSubategorias: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener subcategorias',
            error: error.message
        })
    }
};

/**
 * obtener todas las subcategorias por id
 * GET /api/subcategorias/:id
 * 
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const getSubcategoriasById = async (req, res) => {
    try {
        const { id } = req.params;

        //Buscar subcategorias y contar productos
        const subcategoria = await Subcategoria.findByPk(id, {
            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre', 'activo']
                },
                {
                    model: Producto,
                    as: 'productos',
                    attributes: ['id']
                }
            ]
        });

        if (!subcategoria) {
            return res.status(404).json({
                success: false,
                message: 'Subcategoria no encontrada'
            });
        }

        //agregar contadpr de productos
        const subcategoriaJSON = subcategoria.toJSON();
        subcategoriaJSON.totalProductos = subcategoriaJSON.productos.length;
        delete subcategoriaJSON.productos; //no enviar la lista completa, solo el contador

        // Respuesta Exitosa
        res.json({
            success: true,
            data: {
                subcategoria: subcategoriaJSON
            }
        });


    } catch (error) {
        console.error('Error en getSubcategoriaById: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener subcategoria',
            error: error.message
        })
    }
};

/**
 * Crear una subcategoria
 * POST /api/admin/subcategorias
 * Body: { nombre, descripcion, categoriaId }
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const crearSubcategoria = async (req, res) => {
    try {
        const { nombre, descripcion, categoriaId } = req.body;

        //validacion 1 verificar campos requeridos
        if (!nombre || !categoriaId) {
            return res.status(400).json({
                success: false,
                message: 'El nombre y categoriaId es requerido'
            });
        }

        //valida 2 si la categoria existe
        const categoria = await Categoria.findByPk(categoriaId);

        if(!categoria) {
            return res.status(404).json({
                success: false,
                message: `No existe la categoria con id ${categoriaId}`
            });
        }

        // Validacion 3 verifica si la categoria esta activa
        if (!categoria.activo) {
            return res.status(400).json({
                success: false,
                message: `La categoria "${categoria.nombre}" esta inactiva, activela primero`
            });
        }

        // Validacion 4 verificar que el nombre no exista  una subcategoria con el mismo nombre
        const subcategoriaExistente = await Subcategoria.findOne({ where: { nombre, categoriaId }
        });

        if (subcategoriaExistente) {
            return res.status(400).json({
                success: false,
                message : `Ya existe una subcategoria con el nombre "${nombre}" en esta categoria`
            });
        }

        // Crear subcategoria
        const nuevaSubcategoria = await Subcategoria.create({
            nombre,
            descripcion: descripcion || null, //si no se proporciona la descripcion se establece como null
            categoriaId,
            activo: true
        });

        //Obtener subcategoria con los datos de la categoria
        const subcategoriaConCategoria = await Subcategoria.findByPk(nuevaSubcategoria.id, {
            include: [{
                model: Categoria,
                as: 'categoria',
                attributes: ['id', 'nombre']
            }]
        });
        
        //Respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Subcategoria creada exitosamente',
            data: {
                subcategoria: subcategoriaConCategoria
            }
        });
    } catch (error) {
        console.error('Error en crearSubcategoria', error);
        if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Error de validacion',
            errors: error.errors.map(e => e.message)
        });
    }
    res.status(500).json({
        success: false, 
        message: 'Error al crear subcategoria',
        error: error.message
    })
}
};

/**
 * Actualizar subcategoria
 * PUT /api/admin/subcategorias/:id
 * body: { nombre, descripcion, categoriaId }
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const actualizarSubcategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, categoriaId, activo } = req.body;
        
        //Buscar subcategoria
       const subcategoria = await Subcategoria.findByPk(id);

       if(!subcategoria) {
        return res.status(404).json({
            success: false,
            message: 'Subcategoria no encontrada'
            });
        }
        if (categoriaId && categoriaId !== subcategoria.categoriaId) {
            const nuevaCategoria = await Categoria.findByPk(categoriaId);

            if (nuevaCategoria) {
                return res.status(404).json({
                    success: false,
                    message: `No existe la categoria con id ${categoriaId}`
                });
            }

            if (!nuevaCategoria.activo) {
                return res.status(400).json({
                    success: false,
                    message: `La categoria ${nuevaCategoria.nombre} esta inactiva`
                });
            }
        }

        // validacion 1 si se cambia el nombre verificar que no exista 
        if (nombre && nombre !== subcategoria.nombre ) {
            const categoriafinal = categoriaId || subcategoria.categoriaId; //Si no se cambia la categoria usar la categoria actuañ

            const subcategoriaConMismoNombre = await Subcategoria.findOne({ 
                where: { 
                    nombre, 
                    categoriaId: categoriafinal
                }
            });

            if (subcategoriaConMismoNombre) {
                return res.status(400).json({
                    success: false,
                    message: `Ya existe una subcategoria con el nombre "${nombre}" en esta categoria`
                });
            }
        }

        //Actualizar campos
        if (nombre !== undefined) subcategoria.nombre = nombre;
        if (descripcion !== undefined) subcategoria.descripcion = descripcion;
        if (categoriaId !== undefined) subcategoria.categoriaId = categoriaId;
        if (activo !== undefined) subcategoria.activo = activo;

        //guardar cambios
        await subcategoria.save();

        //respuesta exitosa
        res.json({
            success: true,
            message: 'Subategoria actualizada exitosamnete',
            data: {
                subcategoria
            }
        });

    } catch (error) {
        console.error('Error en actualizarSubcategoria: ', error);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json ({
            success: false,
            message: 'error al actualizar subcategoria',
            error: error.message
        });
    }
};

/**
 * Activar/Desactivar subcategoria
 * PATCH /api/admin/subcategorias/:id/estado
 * Al desacrivar una subcategorias se desactivan todos los productos relacionados
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const toggleSubcategoria = async (req, res) => {
    try {
        const { id } = req.params;

        //Buscar categoria
        const subcategoria = await Subcategoria.findByPk(id);

        if(!subcategoria) {
            return res.status(404).json({
                success: false, 
                message: 'Subategoria no encontrada'
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
            message: `Subategoria ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`,
            data:{
                subcategoria,
                productosAfectados
            }
        });
    } catch (error) {
        console.error ('Error en toggleSubategoria:', error);
        res.status(500).json({
            success: false,
            messsage: 'Error al cambiar estado de la subcategoria',
            error: error.message
        });
    }
};

/**
 * Eliminar subcategoria 
 * DELETE /api/admin/subcategorias/:id
 * Solo permite eliminar si no productos relacionados
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const eliminarSubcategoria = async (req,res) => {
    try {
        const { id } = req.params;

        //Buscar categoria
        const subcategoria = await Subcategoria.findByPk(id);

        if (!subcategoria) {
            return res.status(404).json({
                success: false,
                message: 'Subcategoria no encontrada'
            });
        }

        // Validacion verificar que no tenga productos
        const productos = await Producto.count({
            where: { subcategoriaId: id}
        });

        if (productos > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar la subcategoria porque tiene ${productos} productos asociadas usa PATCH /api/admin/categorias/:id toggle para para desactivarla en lugar de eliminarla`
            });
        }

        //Eiminar subcategoria
        await subcategoria.destroy();

        //Respuesta exitosa
        res.json({
            success: true,
            message: 'Subategoria eliminada exitosamente'
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
 * Obtener estadisticas de una categoria
 * GET /api/admin/subcategorias estadistucas
 * retorna
 * Total de subcategorias activas /inactivas
 * Total de productos activas /inactivas
 * valor total del inventario
 * stock total
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const getEstadisticasSubcategoria = async (req, res)  => {
    try {
        const { id } = req.params;

        //Verificar que la subcategoria exista
        const subcategoria = await Subcategoria.findByPk(id [{
            include: [{
                model: Categoria,
                as: 'categoria',
                attributes: ['id', 'nombre']
            }]
        }]);

        if (!subcategoria) {
            return res.status(404).json({
                success: false,
                message: 'Subcategoria no encontrada'
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
                    nombre: subcategoria.nombre,
                    activo: subcategoria.activo,
                    categoria: subcategoria.categoriaId
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
    getSubategorias,
    getSubcategoriasById,
    crearSubcategoria,
    actualizarSubcategoria,
    toggleSubcategoria,
    eliminarSubcategoria,
    getEstadisticasSubcategoria
};