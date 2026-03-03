/** 
 * Controlador de pedidos 
 * gestion de pedidos
 * requuere actualizacion
 * 
 */

//Importar modelos 
const Pedido = require('../models/Pedido');
const DetallePedido = require('../models/DetallePedido');
const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');

/**
 * Crear pedido desde el carrito (checkout)
 * POST/api/clientes/pedidos
 */
const crearPedido = async (req, res) => {
    const { sequelize } = require('../config/database');
    const t = await sequelize.transaction();

    try {
        const { direccionEnvio, Telefono, metodoPago = 'efectivo', notasAdicionales } = req.body;  
        
        //Validacion 1 Direccion requerida
        if (!direccionEnvio || direccionEnvio.trim() ===  '') {
            await t.rollback();
            return res.status(400).json ({
                success: false,
                message: 'La direccion de envio es requerida'
            });
        }
        //Validacion 2 Telefono requerida
        if (!Telefono || Telefono.trim() ===  '') {
            await t.rollback();
            return res.status(400).json ({
                success: false,
                message: 'El telefono es requerido'
            });
        }
         //Validacion 3 metodoPago requerida
         const metodosValidos = ['efectivo', 'tarjeta', 'transferencia'];
        if (!metodosValidos.includes(metodoPago)) {
            await t.rollback();
            return res.status(400).json ({
                success: false,
                message: `Metodo de pago no valido. opciones validas: ${metodosValidos.join(',')}`
            });
        }

        //Obtener items del carrito
        const carritoItems = await CarritofindAll({
            where: {
                usuarioId: req.usuario.id
            },
            includes: [{
                model: Producto,
                as: 'producto',
                attributes: ['id', 'nombre', 'precio', 'stock', 'activo']
            }],
            transaction: t
        });

        if (itemsCarrito.length === 0) {
            await t.rollback();
            return res.status(400).json ({
                success: false,
                message: 'El carrito esta vacio'
            });
        }

        //Verificar stock y productos activos
        const erroresValidacion = [];
        let totalPedido = 0;

        for (const item of itemsCarrito) {
            const producto = item.producto;

            //Verificar que el producto este activo
            if (!producto.activo) {
                erroresValidacion.push(`El producto ${producto.nombre} no esta disponible actualmente`);
                continue;
            }

            //verificar stock sufuciente
            if (item.cantidad > producto.stock) {
                erroresValidacion.push(`No hay stock suficiente disponible (${producto.nombre}). solicitado: ${item.cantidad}`);
                continue;
            }

            //Calcular total pedido
            totalPedido += parseFloat(item.precioUnitario) * item.cantidad;
        }

        //Si hay errores de validacion, retone
        if (erroresValidacion.length > 0) {
            await t.rollbalck();
            return res.status(400).json ({
                success: false,
                message: 'Error de validacion en el carrito',
                errors: erroresValidacion
            });
        }

        //Crear Pedido
        const pedido = await Pedido.create({
            usuarioId: req.usuario.id,
            total: totalPedido,
            estado: 'pendiente',
            direccionEnvio,
            Telefono,
            metodoPago,
            notasAdicionales
        },  { transaction: t   });

        //Crear detalles del pedido y actualizar stock

        const detallesPedido = [];
        for (const item of itemsCarrito) {
            const producto = item.producto;

            //crear detalle
            const detalle = await DetallePedido.create({
                pedidoId: pedido.id,
                productoId: producto.id,
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario,
                subtotal: parseFloat(item.precioUnitario) * item.cantidad
            }, { transaction: t});

            detallesPedido.push(detalle);

            //Reducir stock del producto
            producto.stock -= item.cantidad;
            await producto.save({ transaction: t});
        }

        //vaciar carrito
        await Carrito.destroy({
            where: { usuarioId: req.usuario.id },
            transaction: t
        });

        //confirmar transacion
        await t.commit();

        //Cargar pedido 
        await pedido.reload({
            include: [
                {
                    model: DetallePedido,
                    as: 'usuario',
                    attributes: [ 'id', 'nombre', 'email']
                },
                {
                    model: DetallePedido,
                    as: 'detalles',
                    include: [{
                        model: Producto,
                        as: 'producto',
                        attributes: ['id', 'nombre', 'precio', 'imagen']
                    }],
                },
            ]
        })

        //Retonar respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Pedido creado exitosamente',
            data: {
                pedido
            }
        });

    } catch (error) {
        //revertir trasaccion en caso de error
        await t.rollback();
        console.error('Error al crear pedido: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear pedido, intente nuevamente mas tarde',
            error: error.message
        });
    }
};

/**
* Obtener pedido del cliente
* GET /api/clientes/pedidos/:id
* query: ?estado=pendiente&pagina=1&limite=10
*/

const obtenerPedido = async (req, res) => {
    try {
        const { estado, pagina =1 , limite =10 }= req.query;

        //Filtros
        const where = { usuarioId: req.usuario.id };
        if (estado)  where. estado = estado;

            //Paginacion
            const offset = (parseInt(pagina - 1)) *parseInt (limite);

            //consultar pedido
            const { count, rows: pedidos } = await Pedido.findAndCountAll({
                where,
                include: [{
                    model: DetallePedido,
                    as: 'detalles',
                    include: [{
                        model: Producto,
                        as: 'producto',
                        attributes: [ 'id', 'nombre', 'precio', 'imagen']
                    }]
                }
            ],
            limit: parseInt(limite),
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        //Retonar respuesta exitosa
        res.status(200).json({
            success: true,
            message: 'Pedidos obtenidos exitosamente',
            data: {
                pedidos,
                total: count,
                pagina: parseInt(pagina),
                limite: parseInt(limite),
                totalPaginas: Math.ceil( count / parseInt(limite))
            }
        });
        
    } catch (error) {
        console.error('Error al getMisPedidos: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pedidos, intente nuevamente mas tarde',
            error: error.message 
        });
    }
};

/**
 * Obtener un pedido especifico por ID
 * GET/api/cliente/pedidos/:id
 * solo puede ver los administradores
 */

const getPedidoById = async (req, res) => {
        try {
                const { id } = req.params;
                //construir filtros (cliente solo ve sus pedidos, admin ve todos)
                const where = { id };
                if (req.usuario.rol === 'cliente') {
                    where.usuarioId = req.usuario.id;
                }

                //buscar pedido
                const pedido = await Pedido.findOne({
                    where,
                    include: [
                    {
                        model: Usuario,
                        as: 'usuario',
                        attributes: [ 'id', 'nombre', 'email']
                    },
                    {
                    model: DetallePedido,
                    as: 'detalles',
                    include: [{
                        model: Producto,
                        as: 'producto',
                        attributes: [ 'id', 'nombre', 'descripcion', 'imagen'],
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
                        ]
                    }]  
                }
            ]
        });

        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        //Respuesta exitosa
        res.status(200).json({
            success: true,
            data: {
                pedido
            }
        });
    } catch (error) {
        console.error('Error al getPedidoById: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pedido, intente nuevamente mas tarde',
            error: error.message
        });
    }
};

/**
 * Cancelar pedido 
 * POST /api/clientes/pedidos/:id/cancelar
 * solo puede cancelar pedidos en el estado pendiente
 * devuelve el stock a los productos
 */

const cancelarPedido = async (req, res) => {
    const { sequelize } = requiere('../config/database');
    const t = await sequelize.transaction();

    try {
        const { id } = req.params;

        //Buscar pedido en los propios pedidos
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
                        as: 'producto'
                    }]
                }],
            transaction: t
        });

        if (!pedido) {
            await t.rollbalck();
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            })
        }

        // Solo se puede cancelar si esta en pendiente
        if (pedido.estado !== 'pediente') {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: `Solo se pueden cancelar pedidos en estado pendiente ${pedido.estado}`
            });
        }

        //Devolver stock de los productos
        for (const detalle of pedido.detalles) {
            const producto = detalle.producto;
            producto.stock += detalle.cantidad;
            await producto.save({ transaction: t});
        }

        //Actualizar estado del pedido a cancelado
        pedido.estado = 'cancelado';
        await pedido.save ({ transaction: t});

        await t.commit();

        //Respuesta exitosa
        res.status(200).json({
            success: true,
            message: 'Pedido cancelado correctamente',
            data: {
                pedido
            }
        });

    } catch (error) {
        console.error('Error al cancelar pedido: ', error);
        await t.rollback();
        res.status(500).json({
            success: false,
            message: 'Error al cancelar pedido',
            error: error.message
        });
    }
}
