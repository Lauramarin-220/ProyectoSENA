/** Rutas del administrador
 * agrupa todas las rutas de gestion del admin
 */

const express = require('express');
const router = express.Router();

//Importar los middlewares
const { verificarAuth } = require('../middleware/auth');
const { esAdministrador, esAdminOAuxiliar, soloAdministrador } = require('../middleware/checkRole');

// importar configuracuon de multer para la subida de imagenes
const { upload } = require('../config/multer');

//importar controladores
const categoriaController = require('../controllers/categoria.controller');
const subcategoriaController = require('../controllers/subcategoria.controller');
const productoController = require('../controllers/productos.controller');
const usuarioController = require('../controllers/usuario.controller');
const pedidoController = require('../controllers/pedido.controller');

//restricciones de aceso a las rutas del admin
router.use(verificarAuth, esAdminOAuxiliar);

//Rutas de categorias
//GET /api/admin/categorias
router.get('/categorias', categoriaController.getCategorias);

//GET /api/admin/categorias:id
router.get('/categorias/:id', categoriaController.getCategoriasById);

//GET /api/admin/categorias/:id/stats
router.get('/categorias/:id/stats', categoriaController.getEstadisticasCategoria);

//POST /api/admin/categorias
router.post('/categorias', categoriaController.crearCategoria);

//PUT /api/admin/categorias/:id
router.put('/categorias/:id', categoriaController.actualizarCategoria);

//PATCH /api/admin/categorias:id/toggle desactivar o activar categoria
router.patch('/categorias/:id/toggle', categoriaController.toggleCategoria);

//DELETE /api/admin/categorias
router.delete('/categorias/:id', soloAdministrador, categoriaController.eliminarCategoria);


//Rutas de subcategorias
//GET /api/admin/subcategorias
router.get('/subcategorias', subcategoriaController.getSubategorias);

//GET /api/admin/subcategorias:id
router.get('/subcategorias/:id', subcategoriaController.getSubcategoriasById);

//GET /api/admin/subcategorias/:id/stats
router.get('/subcategorias/:id/stats', subcategoriaController.getEstadisticasSubcategoria);

//POST /api/admin/subcategorias
router.post('/subcategorias', subcategoriaController.crearSubcategoria);

//PUT /api/admin/subcategorias/:id
router.put('/subcategorias/:id', subcategoriaController.actualizarSubcategoria);

//PATCH /api/admin/subcategorias:id/toggle desactivar o activar subcategoria
router.patch('/subcategorias/:id/toggle', subcategoriaController.toggleSubcategoria);

//DELETE /api/admin/subcategorias
router.delete('/subcategorias/:id', soloAdministrador, subcategoriaController.eliminarSubcategoria);


//Rutas de producto
//GET /api/admin/producto
router.get('/productos', productoController.getProductos);

//GET /api/admin/productos:id
router.get('/productos/:id', productoController.getProductosById);

//POST /api/admin/productos
router.post('/productos', productoController.crearProducto);

//PUT /api/admin/productos/:id
router.put('/productos/:id', productoController.actualizarProducto);

//PATCH /api/admin/productos:id/toggle desactivar o activar producto
router.patch('/productos/:id/toggle', productoController.toggleProducto);

//PATCH /api/admin/productos:id/stock
router.patch('/productos/:id/stock', productoController.actualizarStock);

//DELETE /api/admin/productos
router.delete('/productos/:id', soloAdministrador, productoController.eliminarProducto);


//Rutas de usuarios
//GET /api/admin/usuarios
router.get('/usuarios', usuarioController.getUsuarios);

//GET /api/admin/usuarios:id
router.get('/usuarios/:id', usuarioController.getUsuarioById);

//GET /api/admin/usuarios/:id/stats
router.get('/usuarios/:id/stats', usuarioController.getEstadisticasUsuarios);

//POST /api/admin/usuarios
router.post('/usuarios', soloAdministrador, usuarioController.crearUsuario);

//PUT /api/admin/usuarios/:id
router.put('/usuarios/:id', soloAdministrador, usuarioController.actualizarUsuario);

//PATCH /api/admin/usuarios:id/toggle desactivar o activar usuario
router.patch('/usuarios/:id/toggle', soloAdministrador, usuarioController.toggleUsuario);

//DELETE /api/admin/usuarios
router.delete('/usuarios/:id', soloAdministrador, usuarioController.eliminarUsuario);


//Rutas de pedidos
//POST /api/admin/pedidos
router.post('/pedidos', pedidoController.crearPedido);

//GET /api/admin/pedidos
router.get('/pedidos', pedidoController.getMisPedidos);

//GET /api/admin/pedidos:id
router.get('/pedidos/:id', pedidoController.getPedidosById);

//PUT /api/admin/pedidos
router.put('/pedidos', pedidoController.cancelarPedido);

//GET /api/admin/pedidos
router.get('/pedidos', pedidoController.getAllPedidos);

//PUT /api/admin/pedidos
router.put('/pedidos', pedidoController.actualizarEstadoPedido);

//GET /api/admin/pedidos/estadisticas
router.get('/pedidos/estadisticas', pedidoController.getEstadisticasPedidos);

module.exports = router;