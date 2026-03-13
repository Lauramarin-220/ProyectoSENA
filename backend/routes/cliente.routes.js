/**
 * Rutas del cliente
 * agrupa todas las rutas de gestion del cliente
 */
const express = require('express');
const router = express.Router();

// importar los middlewares 
const { verificarAuth } = require('../middleware/auth');
const { esCliente } = require('../middleware/checkRole');


// importar controladores
const catalogoController = require('../controllers/catalogo.controller');
const carritoController = require('../controllers/carrito.controller');
const pedidoController = require('../controllers/pedido.controller');

// Rutas de catalago(publicas)

router.get('/catalogo/productos', catalogoController.getProductos);

// GET/ api/catalogo/categorias/:id/subcategorias
router.get('/catalogo/productos/:id', catalogoController.getProductosById);

// GET/ api/catalogo/categorias
router.get('/catalogo/categorias', catalogoController.getCategorias);

// GET/ api/catalogo/categorias/:id/subcategorias
router.get('/catalogo/categorias/:id/subcategorias', catalogoController.getSubcategoriasPorCategoria);

// GET/ api/catalogo/productos/:id
router.get('/catalogo/destacados', catalogoController.getProductosDestacados);




// Rutas de carrito

// GET/ api/cliente/carrito
router.get('/carrito', verificarAuth, carritoController.getCarrito);

// POST/ api/cliente/carrito
router.post('/carrito', verificarAuth,carritoController.agregarAlCarrito);

// PUT/ api/cliente/carrito/:id
router.put('/carrito/:id',verificarAuth,carritoController.actualizarItemCarrito);

// DELETE/ api/cliente/carrito/:id
//Eliminar un item del carrito
router.delete('/carrito/:id', verificarAuth, carritoController.eliminarItemCarrito);

// DELETE/ api/cliente/carrito
//vaciar carrito
router.delete('/carrito', verificarAuth, carritoController.vaciarCarrito);


// Rutas de pedidos del cliente

// POST/ api/cliente/pedidos
router.post('/pedidos', verificarAuth,pedidoController.crearPedido);

// GET/ api/cliente/pedidos/:id
router.get('/pedidos/:id', verificarAuth, pedidoController.getPedidoById);

// GET/ api/cliente/pedidos
router.get('/pedidos', verificarAuth, pedidoController.getMisPedidos);

// PUT/ api/cliente/pedidos/:id/cancelar
router.put('/pedidos/:id/cancelar', verificarAuth, pedidoController.cancelarPedido);

module.exports = router;
