/**
 * Rutas del administrador
 * agrupa todas las rutas de gestion del admin
 */
const express = require('express');
const router = express.Router();

// importar los mddlewares 
const { verificarAuth } = require('../middleware/auth');
const { esAdministrador, esAdminOAuxiliar, soloAdministrador } = require('../middleware/checkRole');

// importar configuracion de multer para la subida de imagenes
const { upload } = require('../config/multer');

// importar controladores
const categoriaController = require('../controllers/categoria.controller');
const subcategoriaController = require('../controllers/subcategoria.controller');
const productoController = require('../controllers/productos.controller');
const usuarioController = require('../controllers/usuario.controller');
const pedidoController = require('../controllers/pedido.controller');

// restricciones de aacceso a las rutas admin
router.use(verificarAuth, esAdminOAuxiliar);

// Rutas de categorias
// GET/ api/admin/categorias
router.get('/categorias', categoriaController.getCategorias);

// GET/ api/admin/categorias/:id
router.get('/categorias/:id', categoriaController.getCategoriasById);

// GET/ api/admin/categorias/:id/stats
router.get('/categorias/:id/stats', categoriaController.getEstadisticasCategoria);

// POST/ api/admin/categorias
router.post('/categorias', categoriaController.crearCategoria);

// PUT/ api/admin/categorias
router.put('/categorias', categoriaController.actualizarCategoria);

// PATCH/ api/admin/categorias/:id/toggle desactivar o activar categoria
router.patch('/categorias/:id/toggle', categoriaController.toggleCategoria);

// DELETE/ api/admin/categorias
router.delete('/categorias/:id', soloAdministrador,categoriaController.eliminarCategoria);



// Rutas de subcategorias

// GET/ api/admin/subcategorias
router.get('/subcategorias', subcategoriaController.getSubcategorias);

// GET/ api/admin/subcategorias/:id
router.get('/subcategorias/:id', subcategoriaController.getSubcategoriasById);

// GET/ api/admin/subcategorias/:id/stats
router.get('/subcategorias/:id/stats', subcategoriaController.getEstadisticasSubCategoria);

// POST/ api/admin/subcategorias
router.post('/subcategorias', subcategoriaController.crearSubcategoria);

// PUT/ api/admin/subcategorias
router.put('/subcategorias', subcategoriaController.actualizarSubcategoria);

// PATCH/ api/admin/subcategorias/:id/toggle desactivar o activar categoria
router.patch('/subcategorias/:id/toggle', subcategoriaController.toggleSubCategoria);

// DELETE/ api/admin/subcategorias
router.delete('/subcategorias/:id', soloAdministrador,subcategoriaController.eliminarSubCategoria);


// Rutas de productos

// POST/ api/admin/Productos
router.post('/productos', productoController.crearProductos);

// GET/ api/admin/productos
router.get('/productos', productoController.getProductos);

// GET/ api/admin/productos/:id
router.get('/productos/:id', productoController.getProductosById);

// PUT/ api/admin/productos
router.put('/productos', productoController.actualizarProducto);

// PATCH/ api/admin/productos/:id/toggle desactivar o activar productos
router.patch('/productos/:id/toggle', productoController.toggleProducto);

// DELETE/ api/admin/productos
router.delete('/productos/:id', soloAdministrador,productoController.eliminarProducto);



// Rutas de usuarios

// GET/ api/admin/usuarios/:id/stats
router.get('/usuarios/:id/stats', usuarioController.getEstadisticasUsuarios);

// POST/ api/admin/usuarios
router.post('/usuarios', usuarioController.crearUsuario);

// GET/ api/admin/usuarios
router.get('/usuarios', usuarioController.getUsuarios);

// GET/ api/admin/usuarios/:id
router.get('/usuarios/:id', usuarioController.getUsuarioById);

// PUT/ api/admin/usuarios
router.put('/usuarios', soloAdministrador,usuarioController.actualizarUsuario);

// PATCH / api/admin/usuarios/:id/toggle desactivar o activar productos
router.patch('/usuarios/:id/toggle', usuarioController.toggleUsuario);

// DELETE / api/admin/usuarios
router.delete('/usuarios/:id', soloAdministrador,usuarioController.eliminarUsuario);



// Rutas de Pedidos

// GET/ api/admin/pedidos
router.get('/pedidos', pedidoController.getAllPedidos);

// GET/ api/admin/pedidos
router.get('/pedidos', pedidoController.getMisPedidos);

// GET/ api/admin/pedidos/:id
router.get('/pedidos/:id', pedidoController.getPedidoById);

// POST/ api/admin/Pedidos
router.post('/pedidos', pedidoController.crearPedido);

// PUT/ api/admin/pedidos 
router.put('/pedidos', pedidoController.cancelarPedido);

// PUT/ api/admin/pedidos 
router.put('/pedidos', soloAdministrador, pedidoController.actualizarEstadoPedido);

// GET/ api/admin/pedidos/:id/stats
router.get('/pedidos/:id/stats', pedidoController.getEstadisticasPedidos); 

module.exports = router;
