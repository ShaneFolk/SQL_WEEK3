// ============================================================
// SETUP & IMPORTS — start
// ============================================================

const express = require('express'); // Web framework (we only need its Router here)
// A Router is a mini "app" that holds a group of related routes.
// server.js will plug it in later with app.use().
const router = express.Router();
// The functions that do the actual work for each route live in the controller.
// The { } pulls the two named functions out of what authController exports.
const {login, register} = require('../controllers/authController');

// ============================================================
// SETUP & IMPORTS — end
// ============================================================

// ============================================================
// AUTH ROUTES — start
// ============================================================
// Each line connects a URL path to a controller function.
// No authenticateToken here: you can't need a token to log in or sign up.

// ------------------------------------------------------------
// POST /login  — log a user in and return a JWT — start
// ------------------------------------------------------------
router.post('/login', login);
// ------------------------------------------------------------
// POST /login  — log a user in and return a JWT — end
// ------------------------------------------------------------

// ------------------------------------------------------------
// POST /users  — register (create) a new user — start
// ------------------------------------------------------------
router.post('/users', register);
// ------------------------------------------------------------
// POST /users  — register (create) a new user — end
// ------------------------------------------------------------

// ============================================================
// AUTH ROUTES — end
// ============================================================

// Export the router so server.js can require() it and mount it with app.use()
module.exports = router;
