/**
 * Asociacion entre modelos 
 * Este archivo define las relaciones entre los modelos de sequelize
 * deje ejecutarse despues de importar los modelos 
 */

// Importar todos los modelos
const Usuario = require ('./Usuario');
const Categoria = require ('./Categoria');
const Subcategoria = require ('./Subcategoria');
const Producto = require ('./Producto');
const Carrito = require ('./Carrito');
const Pedido = require ('./Pedido');
const DetallePedido = require ('./DetallePedido');

/**
 * Definir asociaciones
 * Tipos de relaciones sequelize:
 * hasone 1 - 1
 * belongsto 1 - 1
 * hasmany 1 - N
 * belongstomany N - N
 */

/**
 * Categoria - Subcategoria
 * Una categoria tiene muchas subcategorias 
 * Una subcategoria pertenece a una categoria 
 */

Categoria.hasMany(Subcategoria, {
    foreignKey: 'categoriaId', // Campo que conecta las tablas
    as: 'subcategorias', // Alias para la relacion
    onDelete: 'CASCADE', // Si se elimina categoria se elimina subcategorias
    onUpdate: 'CASCADE', // Si se actualiza categoria actualizar subcategorias
});

Subcategoria.belongsTo(Categoria, {
    foreignKey: 'categoriaId', // Campo que conecta las tablas
    as: 'categoria', // Alias para la relacion
    onDelete: 'CASCADE', // Si se elimina categoria se elimina subcategorias
    onUpdate: 'CASCADE', // Si se actualiza categoria actualizar subcategorias
});

/**
 * Categoria - producto
 * Una categoria tiene muchos productos
 * Un producto pertenece a una categoria 
 */

Categoria.hasMany(Producto, {
    foreignKey: 'categoriaId', // Campo que conecta las tablas
    as: 'productos', // Alias para la relacion
    onDelete: 'CASCADE', // Si se elimina categoria se elimina subcategorias
    onUpdate: 'CASCADE', // Si se actualiza categoria actualizar subcategorias
});

Producto.belongsTo(Categoria, {
    foreignKey: 'categoriaId', // Campo que conecta las tablas
    as: 'categoria', // Alias para la relacion
    onDelete: 'CASCADE', // Si se elimina categoria se elimina el producto
    onUpdate: 'CASCADE', // Si se actualiza categoria actualizar el producto
});

/**
 * SUBCATEGORIA Y PRODUCTO
 * Una subcategoria tiene muchos productos 
 * Un producto pertenece a una subcategoria
 */

Subcategoria.hasMany(Producto, {
    foreignKey: 'subcategoriaId', // Campo que conecta las tablas
    as: 'productos', // Alias para la relacion
    onDelete: 'CASCADE', // Si se elimina subcategoria eleminar producto
    onUpdate: 'CASCADE', // Si se actualiza subcategoria actualizar producto
});

Producto.belongsTo(Subcategoria, {
    foreignKey: 'subcategoriaId', // Campo que conecta las tablas
    as: 'subcategoria', // Alias para la relacion
    onDelete: 'CASCADE', // Si se elimina subcategoria se elimina el producto
    onUpdate: 'CASCADE', // Si se actualiza subcategoria actualizar el producto
});

/**
 * Usuario - Carrito
 * Un usuario tiene muchos carritos
 * Un carrito pertenece a un usuario
 */

Usuario.hasMany(Carrito, {
    foreignKey: 'usuarioId', // Campo que conecta las tablas
    as: 'carrito', // Alias para la relacion
    onDelete: 'CASCADE', // Si se elimina usuario se elimina carrito
    onUpdate: 'CASCADE', // Si se actualiza usuario actualizar carrito
});

Carrito.belongsTo(Usuario, {
    foreignKey: 'usuarioId', // Campo que conecta las tablas
    as: 'usuario', // Alias para la relacion
    onDelete: 'CASCADE', // Si se elimina usuario se elimina el carrito
    onUpdate: 'CASCADE', // Si se actualiza usuario actualizar el carrito
});

/**
 * Producto - Carrito
 * Un producto tiene muchos carritos
 * Un carrito pertenece a un producto
 */

Producto.hasMany(Carrito, {
    foreignKey: 'productoId', // Campo que conecta las tablas
    as: 'carrito', // Alias para la relacion
    onDelete: 'CASCADE', // Si se elimina producto se elimina carrito
    onUpdate: 'CASCADE', // Si se actualiza producto actualizar carrito
});

Carrito.belongsTo(Producto, {
    foreignKey: 'productoId', // Campo que conecta las tablas
    as: 'producto', // Alias para la relacion
    onDelete: 'CASCADE', // Si se elimina producto se elimina el carrito
    onUpdate: 'CASCADE', // Si se actualiza producto actualizar el carrito
});

/**
 * Usuario - Pedido
 * Un usuario tiene muchos pedidos
 * Un pedido pertenece a un usuario
 */

Usuario.hasMany(Pedido, {
    foreignKey: 'usuarioId', // Campo que conecta las tablas
    as: 'pedidos', // Alias para la relacion
    onDelete: 'RESTRICT', // Si se elimina usuario no se elimina pedidos
    onUpdate: 'CASCADE', // Si se actualiza usuario actualizar pedidos
});

Pedido.belongsTo(Usuario, {
    foreignKey: 'usuarioId', // Campo que conecta las tablas
    as: 'usuario', // Alias para la relacion
    onDelete: 'RESTRICT', // Si se elimina usuario no se elimina el pedidos
    onUpdate: 'CASCADE', // Si se actualiza usuario actualizar el pedidos
});

/**
 * Pedido - DetallePedido
 * Un Pedido tiene muchos Detalle de productos
 * Un detalle de pedido pertenece a un pedido
 */

Pedido.hasMany(DetallePedido, {
    foreignKey: 'pedidoId', // Campo que conecta las tablas
    as: 'detalles', // Alias para la relacion
    onDelete: 'CASCADE', // Si se elimina pedido se elimina detalles de producto
    onUpdate: 'CASCADE', // Si se actualiza pedido actualizar detalles de produto
});

DetallePedido.belongsTo(Pedido, {
    foreignKey: 'pedidosId', // Campo que conecta las tablas
    as: 'pedidos', // Alias para la relacion
    onDelete: 'CASCADE', // Si se elimina pedido se elimina el detalles de producto
    onUpdate: 'CASCADE', // Si se actualiza pedido actualizar el detalles de producto
});

/**
 * Producto - DetallePedido
 * Un producto puede estar en muchos detalles de pedido 
 * Un detalle tiene un producto
 */

Producto.hasMany(DetallePedido, {
    foreignKey: 'productoId', // Campo que conecta las tablas
    as: 'detallesPedidos', // Alias para la relacion
    onDelete: 'RESTRICT', // No se elimina producto se elimina detalles de pedido
    onUpdate: 'CASCADE', // Si se actualiza producto actualizar detalles de pedido
});

DetallePedido.belongsTo(Producto, {
    foreignKey: 'productoId', // Campo que conecta las tablas
    as: 'productos', // Alias para la relacion
    onDelete: 'RESTRICT', // No se elimina producto se elimina el detalles de pedido
    onUpdate: 'CASCADE', // Si se actualiza producto actualizar el detalles de pedido
});

/**
 * Relacion muchos a muchos 
 * pedido y productos tiene una relacion de N a N atravez de detalle de pedido
 */

Pedido.hasMany(Producto, {
    through: DetallePedido,  // tabla intermedia
    foreignKey: 'pedidoId', //Primer campo que va a relacionar y que conecta las tablas
    otherKey: 'producto',  //campos que conecta las tablas
    as: 'productos', // Alias para la relacion
});

Producto.hasMany(Pedido, {
    through: DetallePedido, // Campo que conecta las tablas
    foreignKey: 'productoId', //Primer campo que va a relacionar y que conecta las tablas
    otherKey: 'pedidoId',  //campos que conecta las tablas
    as: 'Pedidos', // Alias para la relacion
});

/**
 * Exportar funcion de inicializacion 
 * Funcion para inicializar todas las tablas
 * se llama desde sever.js despues de cargar los modelos 
 */

const initAssociations = () => { // este archivo crea las relaciones entre las tablas
    console.log("Asociaciones entre los modelos establecidos correctamente")
};

//Exportar los modelos
module.exports = {
    Usuario,
    Categoria,
    Subcategoria,
    Producto,
    Carrito,
    Pedido,
    DetallePedido,
    initAssociations
}
