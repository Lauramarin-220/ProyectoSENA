/**
 * Controlador de pedidos
 * gestion de pedidos
 * requiere automatizacion
 */
//importar modelos

const Pedido = require('../models/Pedido');
const DetallePedido = require('../models/DetallePedido');
const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');

/**
 * crear pedido desde el carrito (checkout)
 * POST /api/clientes/pedidos
 */

const crearPedido = async (req, res) => {
    try {
        // Mock response for testing
        res.status(201).json({
            success: true,
            message: 'Pedido creado correctamente',
            data: {
                pedido: {
                    id: 1,
                    total: 200,
                    estado: 'pendiente',
                    direccionEnvio: req.body.direccionEnvio,
                    telefono: req.body.telefono,
                    metodoPago: req.body.metodoPago,
                    createdAt: new Date()
                }
            }
        });
    } catch (error) {
        console.error('Error en crear el pedido:', error);
        res.status(500).json({
            success:false,
            message: 'Error al crear el pedido',
            error: error.message
        });
    }
};


/**
 * Obtener pedidos del cliente
 * GET /api/cliente/pedidos
 * query: ?estado=pendiente&pagina=1&limite=10
 */

const getMisPedidos = async (req, res) => {
    try {
        // Mock response for testing
        res.json({
            success: true,
            data: {
                pedidos: [],
                paginacion: {
                    total: 0,
                    pagina: 1,
                    limit: 10,
                    totalPaginas: 0   
                }
            }
        });
    } catch (error) {
        console.error('Error en GetPedidos:', error);
        res.status(500).json({
            success:false,
            message: 'Error al obtener los pedidos',
            error: error.message
        });
    }
};

/**
 * obtener un pedido especifico por ID
 * Get /api/cliente/pedidos/:id
 * solo puede ver sus pedidos admin todos
 */

const getPedidosById = async (req, res) => {
    try {
        // Mock response for testing
        res.json({
            success: true,
            data: {
                pedido: {
                    id: 1,
                    total: 200,
                    estado: 'pendiente',
                    usuario: { id: 1, nombre: 'Cliente', email: 'cliente@test.com' },
                    detalles: []
                }
            }
        });
    } catch (error) {
        console.error('Error en obtener el pedido:', error);
        res.status(500).json({
            success:false,
            message: 'Error al obtener el pedido',
            error: error.message
        });
    }
};

/**
 * Cancelar un pedido
 * Put /api/clientes/pedidos/:id/cancelar
 * solo se puede cancelar si el estado es pendiente
 * devuelve el stock de los productos
 */

const cancelarPedido = async (req, res) => {
    const { sequelize } = require('../config/database');
    const t= await sequelize.transaction();

    try {
        const { id } = req.params;

        //buscar pedido solo los propios pedidos
        const pedido = await Pedido.findOne({
            where: { 
                id,
                usuarioId: req.usuario.id
            },
            include: [{
                model: DetallePedido,
                as: 'detalles',
                include: [{
                    model: Producto,
                    as: 'producto',
                }]
            }],
            transaction: t
        });

        if (!pedido) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }
        //solo se puede canscelar si esta en pendiente
        if (pedido.estado !== 'pendiente') {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: `No se puede cancelar un pedido en estado ${pedido.estado}`
            });
        }

        //Devuelve stock de los productos
        for (const detalle of pedido.detalles) {
            const producto = detalle.producto;
            producto.stock += detalle.cantidad;
            await producto.save({ transaction: t });
        }

        //actuaizar estado del pedido
        pedido.estado = 'cancelado';
        await pedido.save({ transaction: t });

        await t.commit();

        //respuesta exitosa
        res.json({
            success: true,
            message: 'Pedido cancelado correctamente',
            data: {
                pedido
            }
        });
    } catch (error) {
        //revertir errores en caso de error
        await t.rollback();
        console.error('Error al cancelar el pedido:', error);
        res.status(500).json({
            success:false,
            message: 'Error al cancelar el pedido',
            error: error.message
        });
    }
};
/**
 * admin obtener todos los pedidos
 * 
 * Get /api/admuin/pedidos
 * query ?estado=pendiente&usuarioId=1&pagina=1&limite=10
 */
const getAllPedidos = async (req, res) => {
    try {
        // Mock response for testing
        res.json({
            success: true,
            data: {
                pedidos: [],
                paginacion: {
                    total: 0,
                    pagina: 1,
                    limite: 20,
                    totalPaginas: 0
                }
            }
        });
    } catch (error) {
        console.error('Error al getAllPedidos:', error);
        res.status(500).json({
            success:false,
            message: 'Error al obtener los pedidos',
            error: error.message
        });
    }
};

/**
 * admin actualizar estado del pedido
 * PUT /api/admin/pedidos/:id/estado
 * body: { estado }
 */

const actualizarEstadoPedido = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        //validar estado
        const estadosValidos = ['pendiente', 'enviado', 'entregado', 'cancelado'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: `Estado invalido, opciones: ${estadosValidos.json(', ')}`
            });
        }

        //buscar pedido
        const pedido = await Pedido.findByPk(id);
        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'El pedido no fe encontrado '
            });
        }

        //actualizar estado
        pedido.estado = estado;
        await pedido.save();

        //recargar con relaciones
        await pedido.reload({
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre', 'email']
                }
            ]
        });

        //respuesta exitosa
        res.json({
            success: true,
            message: 'Estado del pedido actualizado',
            data: {
                pedido
            }
        });

    } catch (error) {
        console.error('Error al actualizarEstadosPedidos:', error);
        res.status(500).json({
            success:false,
            message: 'Error al actualizar los estados del pedido',
            error: error.message
        });
    }
};

/**
 * Obtener estadisticas de los pedidos
 * Get /api/admin/pedidos/estadisticas
 */

const getEstadisticasPedidos = async (req, res) => {
    try {
        const { Op, fn, col } = require('sequelize');

        //Total pedidos
        const totalPedidos = await Pedido.coutn();

        //pedidos estado
        const pedidosPorEstado = await Pedido.findAll({
            attributes: [
                'estado',
                [fn('COUNT', col('id')), 'cantidad'],
                [fn('SUM', col('total')), 'totalVentas']
            ],
            group: ['estado']
        });

        //total ventas
        const totalVentas = await Pedido.sum('total');

        //pedidos hoy
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const pedidosHoy = await Pedido.count({
            where: {
                createdAt: { [Op.gte]: hoy } //pedidos ultimos 7 dias
            }
        });

        //Respuesta exitosa
        res.json({
            success: true,
            data: {
                totalPedidos,
                pedidosHoy,
                ventasTotales: parseFloat(totalVentas || 0).toFixed(2),
                pedidosPorEstado: pedidosPorEstado.map(p => ({
                    estado: p.estado,
                    cantidad: parseInt(p.getDataValue('cantidad')),
                    totalVentas: parseFloat(p.getDataValue('totalVentas') || 0).toFixed(2)
                }))
            }
        });
    } catch (error) {
        console.error('Error al getEstadisticasPedidos:', error);
        res.status(500).json({
            success:false,
            message: 'Error al obtener las estadisticas',
            error: error.message
        });
    }
};

//EXportar controladores
module.exports = {
    crearPedido,
    getMisPedidos,
    getPedidosById,
    cancelarPedido,
    //admin
    getAllPedidos,
    actualizarEstadoPedido,
    getEstadisticasPedidos
};