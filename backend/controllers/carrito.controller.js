/**
 * Controlardor carrito de compras 
 * Gestion de carrito
 * Requiere autenticacion
 */

//Importar Modelos
const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');

/**
 * Obtener carrito de del usuario autenticado
 * GET/api/carrito
 * @param {Object} req request express con req.usuario del middleware
 * @param {Object} res response de express 
 */
const getCarrito = async (req, res) => {
    try {
        // Obtener items del carrito con los productos relacionados
        const itemsCarrito = await Carrito.findAll ({
            where: { usuarioId: req.usuario.id},
            incluide: [
                {
                    model: Producto,
                    as: 'producto',
                    attributes: ['id', 'nombre','descripcion', 'precio', 'stock', 'imagen', 'activo'],
                    incluide: [
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

        //Calcular total del carrito
        const totalCarrito = 0;
        itemsCarrito.forEach (item => {
            total += parseFloat(item.precioUnitario) * item.cantidad;
        });

        //Respuesta exitosa
        res.json({
            success: true,
            data: {
                items: itemsCarrito,
                resumen: {
                    totalItems: itemsCarrito.length,
                    cantidadTotal: itemsCarrito.reduce((sum, item) => sum + item.cantidad, 0),
                    totalCarrito: totalCarrito.toFixed(2)
                }
            }
        })
    }
}



