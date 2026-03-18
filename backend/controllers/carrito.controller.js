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
const agregarAlCarrito = async (req, res) =>{
    try{
        const {productoId, cantidad= 1} = req.body; // body = tipo stript

        //Validacion 1: campos requeridos
        if(!productoId) {
            return res.status(400).json({
                success:false,
                message: 'El productoId es requerido'
            });
        }

        // Validacion 2: Cantidad validad
        const cantidadNum = parseInt (cantidad);
        if (cantidadNum < 1) {
            return res.status (400).json({
                success: false,
                message: 'La cantidad debe ser menos 1'
            });
        }

        //Validacion3: Producto existente y esta activo
        const producto = await Producto.findByPk(productoId);

        if(!producto) {
            return res.status(404).json({
                success:false,
                message: 'Producto no encontrado'
            });
        }

        if (!producto.activo) {
            return res.status(400).json({
                success:false,
                message: 'El producto no est disponible'
            });
        }

        //Validacion 4: Varificar si ya existe el prodcuto en el carrito
        const itemExistente = await Carrito.findOne({
            where:{
                usuarioId: req.usuario.id,
                productoId,
            }
        });

        if(itemExistente){
            //Actualizar cantidad
            const nuevaCantidad = itemExistente.cantidad + cantidadNum;

            // Validar stock disponible
            if (nuevaCantidad > producto.stock) {
                return res.status(400).json ({
                    success: false,
                    message: `Stock insuficiente disponible: ${producto.stock}, en carrito: ${itemExistente.cantidad}`
                })
            }

            itemExistente.cantidad = nuevaCantidad;
            await itemExistente.save();

            //Recargar producto         
            await itemExistente.reload({
                include:[{
                    model: Producto,
                    as: 'producto',
                    attributes:['id', 'nombre', 'precio', 'stock', 'imagen']
                }]
            });

            return res.json ({
                success: true,
                message:` Cantidad actualizada en el carrito`,
                data: { 
                    item: itemExistente}
            });

        }

        // validacion 5: stock disponible
        if (cantidadNum > producto.stock) {
            return res.status(400).json({
                success: false,
                message: `Stock insuficiente, Disponiblr ${producto.stock}`
            });
        }

        //crear un nuevo item en el carrito
        const nuevoItem = await Carrito.create({
            usuarioId: req.usuario.id,
            productoId,
            cantidad: cantidadNum,
            precioUnitario: producto.precio
        });

        // recargar con producto
        await nuevoItem.reload({
            include: [{
             model: Producto,
                as :'producto',
                attributes: ['id', 'nombre', 'precio', 'stock', 'imagen']

            }]
        });

        // respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Producto agreado al carrito',
            data: {
                item: nuevoItem
            }
        });


    } catch (error){
        console.error ('Error en agregarAlCarrito', error);
        res.status(500).json ({
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

        // Buscar item del carrito
        const item = await Carrito.findOne({
            where: {
                id,
                usuarioId : req.usuario.id // solo puede modificar su propio carrito
            },
            include: [{
                model: Producto,
                as: 'producto',
                attributes: ['id', 'nombre', 'precio', 'stock']
            }]
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item del carrito no encontrado'
            });
        }
        //Validar stock disponible
        if (cantidadNum > item.producto.stock) {
            return res.status(400).json({
                success: false,
                message: `Stock insuficiente. Disponible ${item.producto.stock}`
            });
        }

        //actualizar cantidad
        item.cantidad = cantidadNum;
        await item.save();

        //Respuesta exitosa
        res.json({
            success: true,
            message: 'Cantidad actualizada',
            data: {
                item
            }
        });
    } catch (error) {
        console.error('Error en actualizar ItemCarrito:', error);
        res.status(500).json({
            success:false,
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
        const { id } = req. params;

        //Buscar item del carrito
        const item = await Carrito.findOne ({
            where: {
                id,
                usuarioId: req.usuario.id
            }
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado en el carrito'
            });
        }

        //Eliminar item
        await item.destroy();

        //respuesta exitosa
        res.json({
            success: true,
            message: 'Item eliminado del carrito',
        });

    } catch (error) {
        console.error('Error en eliminarItemCarrito:', error);
        res.status(500).json({
            success:false,
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
        //Elimar todos los items del carrito
        const itemEliminados = await Carrito.destroy({
            where: { usuarioId: req.usuario.id}
        });

        res.json({
            success: true,
            message: 'Carrito vacio',
            data: {
                itemEliminados
            }
        });

    } catch (error) {
        console.error('Error en vaciarCarrito:', error);
        res.status(500).json({
            success:false,
            message: 'Error al vaciar el carrito',
            error: error.message
        });
    }
;}

//Exportar controladores
module.exports = {
    getCarrito,
    agregarAlCarrito,
    actualizarItemCarrito,
    eliminarItemCarriro,
    vaciarCarrito
}