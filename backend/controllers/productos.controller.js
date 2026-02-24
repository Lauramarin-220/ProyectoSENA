/**
 * Controlador de producto
 * maneja las operaciones crud y activar y desativar producto
 * solo accesible por adminitradores
 */

/**
 * Importar modelos
 */
const Producto = require('../models/Producto');
const Subcategoria = require('../models/Subcategoria');
const Categoria = require('../models/Categoria');

/**
 * obtener todas las producto
 * query params:
 * categoriaId: Id de la categoria para filtrar por categoria
 * SubcategoriaId: Id de la subcategoria para filtrar por subcategoria
 * ProductoId: Id del producto para filtrar por productos
 * Activo true/false (filtrar por estado)
 * incluir categoria true/false (incluir categorias relacionadas)
 * incluir subcategoria true/false (incluir subcategorias relacionadas)
 * 
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const getProductos= async (req, res) => {
    try {
        const { categoriaId, subcategoriaId,  activo, incluirCategoria, incluirSubCategoria } = req.query

        // Opciones de consulta
        const opciones = {
            order: [['nombre', 'ASC']] //ordenar de manera alfabetica
        };

        //Filtros
        const where = {};
        if (categoriaId) where.categoriaId = categoriaId;
        if (subcategoriaId) where.subcategoriaId = subcategoriaId;
        if (activo !== undefined) where.activo = activo === 'true';

        if(Object.keys(where).length > 0) {
            opciones.where = where;
        }

        // Incluir categoria si se solicita
        if (incluirCategoria === 'true') {
            opciones.include == [{
                model: Categoria,
                as: 'categoria', // campo del alias para la relacion 
                attributes: [ 'id', 'nombre', 'activo'] //Campos a incluir de la categoria
            }]
        }

        // Incluir Subcategoria si se solicita
        if (incluirSubCategoria === 'true') {
            opciones.include == [{
                model: Subcategoria,
                as: 'Subcategoria', // campo del alias para la relacion 
                attributes: [ 'id', 'nombre', 'descripcion', 'activo'] //Campos a incluir de la subcategoria
            }]
        }

        // Obtener productos
        const productos = await Producto.findAll(opciones);

        //Respuesta exitosa

        res.json({
            sucess: true,
            count: subcategorias.length,
            data: {
                subcategorias
            }
        });

    } catch (error) {
        console.error('Error en getSubategorias: ', error);
        res.status(500).json[{
            sucess: false,
            message: 'Error al obtener subcategorias',
            error: error.message
        }]
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
        const subcategoria = await Subcategoria. findAll( id, {
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
        res.status(500).json[{
            sucess: false,
            message: 'Error al obtener subcategoria',
            error: error.message
        }]
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
        const categoria = await Categoria.findByPK(categoriaId);

        if(!categoria) {
            return res.status(404).json({
                success: false,
                message: `No existe la categoria con id ${categoriaId}`
            });
        }

        // Validar 3 verificar si la categoria esta activa 
        if (!categoria.activo) {
                return res.status(400).json({
                success: false,
                message: `La categoria con id ${categoria.nombre} "esta inactiva activela primero`
            });
        }

        // Validacion 4 verificar que el nombre no exista una subcategoria con el mismo nombre 
        const subcategoriaExistente = await Subcategoria.findOne ({ where: { nombre, categoriaId }
        });

        if (subcategoriaExistente) {
            return res.status(400).json({
                success: false,
                message : `Ya existe una subcategoria con el nombre "${nombre}" en esta categoria`
            });
        }

        // Crear Subcategoria
        const nuevaSubcategoria = await Subcategoria.create({
            nombre,
            descripcion: descripcion || null, //si no se proporciona la descripcion se establece como null
            categoriaId,
            activo: true
        });

        //obtener subcategoria con los datos de la categoria
        const subcategoriaConCategoria = await
        Subcategoria.findByPk(nuevaSubcategoria.id,{
            incluide: [{
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
            console.error('Error en crearSubcategoria: ', 
            error);
            if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }
        res.status(500).json({
            success: false, 
            message: 'Error al crear Subcategoria',
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
       const subcategoria = await Subcategoria.findByPK(id);

       if(!subcategoria) {
        return res.status(404).json({
            success: false,
            message: 'Subcategoria no encontrada'
            });
        }
        if (categoriaId && categoriaId !== subcategoria.categoriaId){
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
        // validacion 1 si se cambia el nombre verificar que no exista la categoria
        if (nombre && nombre !== subcategoria.nombre) {
            const categoriafinal = categoriaId || subcategoria.categoriaId; // si no se cambia la categoria usar la categoria actual
            

                const subcategoriaConMismoNombre = await Subcategoria.findOne({
                    where:{
                        nombre,
                        categoriaId: categoriafinal
                    }
                });

                if (subcategoriaConMismoNombre) {
                    return res.status(400).json ({
                        success: false,
                        message: `Ya existe una subcategoria con el mismo nombre "${nombre}" en esta categoria`
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
            message: 'subcategoria actualizada exitosamente',
            data: {
               subcategoria
            }
        });

    } catch (error) {
        console.error('Error en actualizarsubcategoria: ', error);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json ({
            sucess: false,
            message: 'error al actualizar subcategoria',
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