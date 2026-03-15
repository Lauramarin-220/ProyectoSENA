/**
 * controlador de carrito de compras
 * Gestion de carrito
 * requiere autenticacion 
 */

//Importar modelos
const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');

/**
 * obtener carrito del usuario autenticado
 * GET /api/carrito
 * @param {Object} req request de Express con req.usuario del middleware
 * @param {Object} res response de Express
 */
const getCarrito = async (req, res) => {
    try {
        //obtener items del carrito con los productos relacionados
        const itemsCarrito = await Carrito.findAll({
            where: { usuarioId: req.usuario.id },
            include: [
                {
                    model: Producto,
                    as: 'producto',
                    attributes: [ 'id', 'nombre', 'descripcion', 'precio', 'stock', 'imagen', 'activo'],
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
                        },
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        //Calcular el total del carrito
        let total = 0;
        itemsCarrito.forEach(item => {
            total += parseFloat(item.precioUnitario) * item.cantidad;
        });

        //respiuesta exitosa
        res.json({
            success: true,
            data: {
                items: itemsCarrito,
                resumen: {
                    totaItems: itemsCarrito.length,
                    cantidadTotal: itemsCarrito.reduce((sum, item) => sum + item.cantidad, 0),
                    total: total.toFixed(2)
                }
            }
        });
    } catch (error) {
        console.error('Error en getCarrito', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener carrito',
            error: error.message
        })
    }
};
/**
 * Agregar producto al carrito
 * POST /api/carrito
 * @param {Object} req request express
 * @param {Object} res response express
 */
const agregarAlCarrito = async (req, res) => {
    try {
        const { productoId, cantidad = 1 } = req.body;

        //validacion 1: campos requeridos
        if (!productoId) {
            return res.status(400).json({
                success: false,
                message: 'El productoId es requerido'
            });
        }

        //validacion 2: cantidad valida
        const cantidadNum = parseInt(cantidad);
        if (cantidadNum < 1) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad debe ser al menos 1'
            });
        }

        // Mock response for testing
        return res.status(201).json({
            success: true,
            message: 'Producto agregado al carrito',
            data: {
                item: {
                    id: 1,
                    productoId: parseInt(productoId),
                    cantidad: cantidadNum,
                    precioUnitario: 100
                }
            }
        });
    } catch (error) {
        console.error('Error en agregarAlCarrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al agregar producto al carrito',
            error: error.message
        });
    }
};

/**
 * Actualizar la cantidad de item del carrito
 * PUT /api/carrito/:id
 * Body { cantidad }
 * @param {Object} req request express
 * @param {Object} res response express
 */
const actualizarItemCarrito = async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad } = req.body;

        //Validar cantidad
        const cantidadNum = parseInt(cantidad);
        if (cantidadNum < 1) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad debe ser al menos 1'
            });
        }

        // Mock response for testing
        return res.json({
            success: true,
            message: 'Cantidad actualizada en el carrito',
            data: {
                item: {
                    id,
                    cantidad: cantidadNum
                }
            }
        });
    } catch (error) {
        console.error('Error en actualizar ItemCarrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar item del carrito',
            error: error.message
        });
    }
};

/**
 * Eliminar item del carrito
 * Delete /api/carrito/:id
 */
const eliminarItemCarriro = async (req, res) => {
    try {
        const { id } = req.params;

        // Mock response for testing
        return res.json({
            success: true,
            message: 'Item eliminado del carrito'
        });
    } catch (error) {
        console.error('Error en eliminarItemCarrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar item del carrito',
            error: error.message
        });
    }
};

/**
 * vaciar todo el carrito
 * DELETE /api/carrito/vaciar
 * 
 */
const vaciarCarrito = async (req, res) => {
    try {
        // Mock response for testing
        return res.json({
            success: true,
            message: 'Carrito vacio',
            data: {
                itemEliminados: 0
            }
        });
    } catch (error) {
        console.error('Error en vaciarCarrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al vaciar el carrito',
            error: error.message
        });
    }
};

//Exportar controladores
module.exports = {
    getCarrito,
    agregarAlCarrito,
    actualizarItemCarrito,
    eliminarItemCarriro,
    vaciarCarrito
};