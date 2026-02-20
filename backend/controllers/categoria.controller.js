/**
 * Controlador de categorias 
 * Maneja las operaciones CRUD y activar u desactivar categorias 
 * Solo accesible por admintradores 
 */

// Importar modelos
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');
const Producto = require('../models/Producto');

/**
 * Obtener todas las categorias 
 * query params:
 * Activo true/false (filtrar por estado)
 * Incluir subcategorias  true/false (incluir subcategorias relacionadas)
 * 
 * @param {object} req request Express
 * @param {Object} res reponse Express
 */

const getCategorias = async (req, res) => {
    try {
        const { activo, IncluirSubcategorias } = req.query;

        // opciones de consulta
        const opciones = {
            order: [['nombre', 'ASC']] // ordenar de manera alfabetica 
        };

        // Filtrar por estado activo si es especifica 
        if (activo !== undefined) {
            opciones.where = {
                activo: activo === 'true'
            };
        }
        // Incluir subcategorias si se solicita
        if (IncluirSubcategorias === 'true') {
            opciones.incluide == [{
                model: Subcategoria,
                as: 'Subcategorias', // Campo de alias para la relacion
                attributes: ['id', 'nombre', 'descripcion', 'activo'] // campos a incluie de la subcategoria
            }]
        }

        // Obtener categorias
        const categorias = await Categoria.findAll (opciones);

        //Respuesta Exitosa
        res.json({
            success: true,
            count: categorias.length,
            data: {
                categorias
            }
        });

    } catch (error){
        console.error('Error en getCategorias: ', error);
        res.status(500).json({
            success: false,
            message:'Error al obtener categoria',
            error: error.message
        })
    }
};

/**
 * Obtener todas las carpetas 
 * GET/ api/categoria/:id
 * 
 * @param {object} req request Express
 * @param {Object} res reponse Express
 */
const getCategoriasById = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar categorias con subcategorias y contar productos 
        const categoria = await Categoria.findByPk( id, {
            incluide: 
            [ 
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
            return res.status(404).json ({
                success: false, 
                message: 'Categoria no encontrada'
            });
        }

        // agregar contador de productos
        const categoriaJSON = categoria.toJSON();
        categoriaJSON.totalProductos = categoriaJSON.productos.length;
        delete categoriaJSON.productos;; //NO enviarla lista completa, solo el contador  

        // Respuesta exitosa
        res.json({
            success: true,
            data:{
                categoria:categoriaJSON
            }
        });

    } catch (error){
        console.error('Error en getCategoriaById: ', error);
        res.status(500).json({
            success: false,
            message:'Error al obtener categoria',
            error: error.message
        })
    }
};

/**
 * crear una categoria
 * POST /api/admin/categorias
 * body: { nombre, descripcion }
 * @param {Object} req request Express
 * @param {Object} res responde Express
 */

const createCategoria = async (req, res) => {
    try {
        const {nombre, descripcion} = req.body;

        //validacion 1 verificar campos requeridos 
        if (!nombre){
            return res.status(400).json({
               success: false,
               message: 'El nombre es requerido'
            });
        }  

        // Validacion 2 verificar que el nombre no exista 
        const categoriaExistente = await Categoria.findOne({ where: { nombre }
        });


        if (categoriaExistente) {
            return res.status(400).json ({
                success: false,
                message: `Ya existe una categoria con el nombre "${nombre}"`
            });
        }

        //Crear categoria
        const nuevaCategoria = await Categoria.create({
            nombre,
            descripcion: descripcion || null, // si no se prorporciona la descripcion se establece como null
            activo: true 
        });

        // Respuesta Existosa
        res.status(201).json({
            success: true,
            message: 'Categoria creada existosa',
            data: {
                categoria: nuevaCategoria
            }
        });
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
        console.error('Error en crearCategoria ',error);
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            })
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
 * PUT/ api/admin/categoria/:id
 * body: {nombre, descripcion}
 * 
 * @param {Object} req requeste Express
 * @param {Object} res response Express
 */

const actualizarCategoria = async (req, res) => {
    try { 
        const { Id } = req.params; 
        const {nombre, descripcion }  =req.body;

        //Buscar categoria 
        const categoria = await Categoria.findPK(id);
        
        if(!categoria) {
            return res.status(400).json ({
            successs: false,
            message: 'Categoria No encontrada'
            });
        }   

        //Validacion 1 si cambia el nombre verificar que no exista
        if (nombre && nombre !== categoria.nombre) {
            const categoriaConMismoNombre = await Categoria.finOne ({
                where: { nombre }
            });

            if (categoriaConMismoNombre) {
                return res.status(400).json({
                    success: false,
                    message: `Ya existe un categoria con el mismo nombre "${nombre}"`
                });
            }
        }

        //Actualizar campos
        if ( nombre !== undefined ) categoria.nombre = nombre;
        if ( descripcion !== undefined ) categoria.descripcion = descripcion;
        if ( activo !== undefined ) categoria.activo = activo;

        // guardar cambios 
        await categoria.save();

        // Respuesta exitosa
        res.json({
            success: true,
            message: 'categoria actualizada exitosamente',
            data: [
                categoria
            ]
        });

    } catch (error) {
        console.error(' Error en ActualizarCategoria: ', error);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json ({
            successs: false,
            message: 'Error al actualizar categoria',
            error: error.message
        });
    }
};

/**
 * Activar/desactivar categoria
 * PATCH /api/admin/categoria/:id/estado
 * 
 * Al desactivar una categoria se desactiva todas las subcategorias relacionadas
 * Al desactivar una subcategoria se desactiva todos los productos relacionados
 * 
 * @param {Object} req requeste Express
 * @param {Object} res response Express
 */
const toggleCategoria = async (req, res) => {
    try {
        const {id} = req.params;

        // Buscar categoria 
        const categoria = await Categoria.findByPk(id);

        if(!categoria) {
            return res.status(404).json({
                success: false,
                message: 'Categoria No encontrada'
            });
        }

        // Altenar estado activo
        const nuevoEstado = !categoria.activo;
        categoria.activo = nuevoEstado;

        // guardar cambios
        await categoria.save();

        // contar cuantas registros se afectaron
        const subcategoriaAfectadas = await
        Subcategoria.count({ where: { categoriaId: id }
        });

        const productosAfectados = await
        Producto.count({ where: { categoriaId: id }
        });

        // Respuesta exitosa
        res.json({
            success: true,
            message: `Categoria ${nuevoEstado ? 'activada' : 'Desactivada'} Existosamente`,
            data: {
                categoria,
                afectados: {
                    subcategorias:
                    subcategoriaAfectadas,
                    productos: productosAfectados
                }
            }
        });
    }
};
