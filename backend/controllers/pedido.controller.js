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
            })
        }

    } catch (error) {

    }
}