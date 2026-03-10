/**
 * Rutas de autenticacion 
 * define los eniponts para registrar, login y gestion de perfil 
 */

//importar Router de express
const express = require('express');
const router = express.Router();

// Importar controladores
const { Registrar, login, getMe, UpdateMe, changePassword } = require('../controllers/auth.controller');

// Importar middlewares
const { verificarAuth } = require('../middleware/auth');

// Rutas publicas

// POST / api/auth/register
router.post('/register', Registrar);

// POST / api/auth/login
router.post('/login', login);

// Rutas protegidas

// GET / api/auth/me
router.get('/me', verificarAuth, getMe);

// PUT / api/auth/me
router.put('/me', verificarAuth, UpdateMe);

// PUT / api/auth/change-password
router.put('/change-password', verificarAuth, changePassword);

//Exportar router
module.exports = router;