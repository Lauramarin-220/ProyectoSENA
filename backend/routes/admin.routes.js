/**
 * Rutas del administrador
 * agrupa todas las rutas de gestion del admin
 */
const express = require('express');
const router = express.Router();

// importar los mddlewares 
const { verifyAuth } = require('../middleware/auth');
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
router.use(verifyAuth, esAdminOAuxiliar);

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
// GET/ api/admin/productos
router.get('/productos', productoController.getProductos);

// GET/ api/admin/productos/:id
router.get('/productos/:id', productoController.getProductosById);

// GET/ api/admin/productos/:id/stats
router.get('/productos/:id/stats', productoController.getEstadisticasProducto); /////////////////////////

// POST/ api/admin/Productos
router.post('/productos', productoController.crearProductos);

// PUT/ api/admin/productos
router.put('/productos', productoController.actualizarProducto);

// PATCH/ api/admin/productos/:id/toggle desactivar o activar productos
router.patch('/productos/:id/toggle', productoController.toggleProducto);

// PATCH/ api/admin/productos/:id/toggle desactivar o activar productos
router.patch('/productos/:id/toggle', productoController.toggleProducto);

// DELETE/ api/admin/productos
router.delete('/productos/:id', soloAdministrador,productoController.eliminarProducto);