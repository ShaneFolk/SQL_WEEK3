// ============================================================
// SETUP & IMPORTS — start
// ============================================================

const express = require('express'); // Web framework (we only need its Router here)
// A Router is a mini "app" that holds a group of related routes.
// server.js will plug it in later with app.use().
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken'); // Checks the JWT; blocks requests with no/invalid token
const authorizeRole = require('../middleware/authorizeRole'); // Checks the user's role (e.g. admin-only)
// The functions that do the actual work for each route live in the controller.
// The { } pulls the four named functions out of what productController exports.
const {
    getAllProducts,
    getProductsByCategory,
    getProductById,
    createProduct
} = require('../controllers/productController');

// ============================================================
// SETUP & IMPORTS — end
// ============================================================

// ============================================================
// PRODUCT ROUTES — start
// ============================================================
// The paths here are written WITHOUT "/products" in front. That part gets
// added when server.js mounts this router, e.g. app.use('/products', ...),
// so '/' here becomes /products and '/:id' becomes /products/:id.
// Middleware runs left to right before the controller function.

// ------------------------------------------------------------
// GET /products  — list all products with their category — start
// ------------------------------------------------------------
// authenticateToken -> must be logged in (valid JWT)
router.get('/', authenticateToken, getAllProducts);
// ------------------------------------------------------------
// GET /products  — list all products with their category — end
// ------------------------------------------------------------

// ------------------------------------------------------------
// GET /products/category/:categoryId  — products in one category — start
// ------------------------------------------------------------
// authenticateToken -> must be logged in (valid JWT)
// :categoryId is a URL parameter, e.g. /products/category/2 -> categoryId = "2"
router.get('/category/:categoryId', authenticateToken, getProductsByCategory);
// ------------------------------------------------------------
// GET /products/category/:categoryId  — products in one category — end
// ------------------------------------------------------------

// ------------------------------------------------------------
// GET /products/:id  — one product plus its reviews — start
// ------------------------------------------------------------
// authenticateToken -> must be logged in (valid JWT)
// NOTE: this is declared AFTER /category/:categoryId on purpose.
// Express checks routes in order, so /products/category/2 hits the
// category route first instead of being treated as an :id. Keep this order.
router.get('/:id', authenticateToken, getProductById);
// ------------------------------------------------------------
// GET /products/:id  — one product plus its reviews — end
// ------------------------------------------------------------

// ------------------------------------------------------------
// POST /products  — create a new product (admin only) — start
// ------------------------------------------------------------
// Two middleware run first, in order:
//   authenticateToken      -> must be logged in (valid JWT)
//   authorizeRole('admin') -> must have the admin role
router.post('/', authenticateToken, authorizeRole('admin'), createProduct);
// ------------------------------------------------------------
// POST /products  — create a new product (admin only) — end
// ------------------------------------------------------------

// ============================================================
// PRODUCT ROUTES — end
// ============================================================

// Export the router so server.js can require() it and mount it with app.use()
module.exports = router;
