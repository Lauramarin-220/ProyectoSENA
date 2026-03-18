/** Rutas del cliente
 * Rutas publicas y para los clientes autenticados
 */

const express = require('express');
const router = express.Router();

//Importar los middlewares
const { verificarAuth } = require('../middleware/auth');
const { esCliente } = require('../middleware/checkRole');


//importar controladores
const catalogoController = require('../controllers/catalogo.controller');
const carritoController = require('../controllers/carrito.controller');
const pedidoController = require('../controllers/pedido.controller');


//Rutas publicas catalogo
//get /api/catalogo/productos

router.get('/catalogo/productos', catalogoController.getProductos);

//GET /api/catalogo/productos/:id
router.get('/catalogo/productos/:id', catalogoController.getProductosById);

//GET /api/admin/catalogo/categorias
router.get('/catalogo/categorias', catalogoController.getCategorias);

//GET /api/catalogo/categoria/:id/subcategorias
router.get('/catalogo/categorias/:id/subcategorias', catalogoController.getSubcategoriasPorCategoria);


//GET /api/catalogo/destacados
router.get('/catalogo/destacados', catalogoController.getProductosDestacados);



//Rutas del carrito
//GET /api/cliente/carrito

router.get('/cliente/carrito', verificarAuth, carritoController.getCarrito);

//POST /api/cliente/carrito
router.post('/cliente/carrito', verificarAuth, carritoController.agregarAlCarrito);


//PUT /api/cliente/carrito
router.put('/cliente/carrito/:id', verificarAuth, carritoController.actualizarItemCarrito);

//DELETE /api/cliente/carito/:id
//Eliminar un item del carrito
router.delete('/cliente/carrito/:id', verificarAuth, carritoController.eliminarItemCarriro);

//DELETE /api/cliente/carito/:id
//Vaciar el carrito
router.delete('/cliente/carrito', verificarAuth, carritoController.vaciarCarrito);


//Rutas de pedidos -cliente

//POST /api/cliente/pedidos
router.post('/cliente/pedidos', verificarAuth, pedidoController.crearPedido);

//GET /api/cliente/pedidos
router.get('/cliente/pedidos', verificarAuth, pedidoController.getMisPedidos);

//GET /api/cliente/pedidos/:id
router.get('/cliente/pedidos/:id', verificarAuth, pedidoController.getPedidosById);


//PUT /api/cliente/pedidos/:id/cancelar
router.put('/cliente/pedidos/:id/cancelar', verificarAuth, pedidoController.cancelarPedido);


module.exports = router;