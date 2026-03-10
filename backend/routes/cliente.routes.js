/**
 * Rutas del cliente
 * agrupa todas las rutas de gestion del cliente
 */
const express = require('express');
const router = express.Router();

// importar los mddlewares 
const { verificarAuth } = require('../middleware/auth');
const { esCliente } = require('../middleware/checkRole');


// importar controladores
const catalogoController = require('../controllers/catalogo.controller');
const carritoController = require('../controllers/carrito.controller');
const pedidoController = require('../controllers/pedido.controller');



// Rutas publicas catalogo
// GET/ api/catalogo/productos
router.get('/catalogo/productos', catalogoController.getProductos);

// GET/ api/admin/catalogo/:id
router.get('/catalogo/productos/:id', catalogoController.getProductosById);

// GET/ api/admin/catalogo/categorias
router.get('catalogo/categorias', catalogoController.getCategorias);

// GET/ api/catalogo/categorias/:id/ suncategorias
router.get('catalogo/categorias/:id/subcategorias', catalogoController.getSubcategoriasPorCategoria);

// GET/ api/admin/destacados
router.get('catalogo/destacados', catalogoController.getProductosDestacados);




// Rutas de carrito

// GET/ api/cliente/carrito
router.get('/carrito', verificarAuth, carritoController.getCarrito);

// POST/ api/cliente/carrito
router.post('/carrito', verificarAuth,carritoController.agregarAlCarrito);

// PUT/ api/cliente/carrito/:id
router.put('/cliente/carrito/:id',verificarAuth,carritoController.actualizarItemCarrito);

// DELETE/ api/cliente/carrito/:id
//Eliminar un item del carrito
router.delete('/cliente/carrito/:id', verificarAuth, carritoController.eliminarItemCarrito);

// DELETE/ api/cliente/carrito
//vaciar carrito
router.delete('/cliente/carrito', verificarAuth, carritoController.vaciarCarrito);


// Rutas de p- cliente

// POST/ api/cliente/pedidos
router.post('/cliente/pedidos', verificarAuth,pedidoController.crearPedido);

// GET/ api/cliente/pedidos/:id
router.get('/cliente/pedidos/:id', verificarAuth, pedidoController.getMisPedidos);

// GET/ api/cliente/pedidos
router.get('/cliente/pedidos', verificarAuth, pedidoController.getPedidoById);

// PUT/ api/cliente/pedidos/:id/cancelar
router.put('/cliente/pedidos/:id/cancelar', verificarAuth, pedidoController.cancelarPedido);


module.exports = router;
