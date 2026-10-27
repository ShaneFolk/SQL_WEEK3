// ============================================================
// SETUP & IMPORTS — start
// ============================================================

const express = require('express'); // Web framework (we only need its Router here)
// A Router is a mini "app" that holds a group of related routes.
// server.js plugs it in with app.use('/categories', categoryRouter).
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken'); // Checks the JWT; blocks requests with no/invalid token
// The function that does the actual work lives in the controller.
// The { } pulls the named function out of what categoryController exports.
const { getAllCategories } = require('../controllers/categoryController');

// ============================================================
// SETUP & IMPORTS — end
// ============================================================

// ============================================================
// CATEGORY ROUTES — start
// ============================================================
// Paths are written WITHOUT "/categories" in front. server.js adds that
// when it mounts this router, so '/' here becomes /categories.

// ------------------------------------------------------------
// GET /categories  — list categories with product counts — start
// ------------------------------------------------------------
// authenticateToken -> must be logged in (valid JWT)
router.get('/', authenticateToken, getAllCategories);
// ------------------------------------------------------------
// GET /categories  — list categories with product counts — end
// ------------------------------------------------------------

// ============================================================
// CATEGORY ROUTES — end
// ============================================================

// Export the router so server.js can require() it and mount it with app.use()
module.exports = router;
