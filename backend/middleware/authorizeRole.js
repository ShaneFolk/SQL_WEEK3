// ============================================================
// MIDDLEWARE: authorizeRole — start
// ============================================================

// Role check middleware. Use it AFTER authenticateToken so req.user exists,
// e.g. app.delete('/products/:id', authenticateToken, authorizeRole('admin'), ...).
//
// Note it's called with a role, like authorizeRole('admin'): it RETURNS the
// real middleware. That lets you reuse it for any role without rewriting it.
function authorizeRole(role) {
    // This returned function is the actual middleware Express runs per request.
    return (req, res, next) => {
        // req.user was set by authenticateToken (the decoded JWT payload).
        // If their role isn't the one required, block them.
        if (req.user.role !== role) {
            // 403 Forbidden = "you're logged in, but not allowed to do this"
            return res.status(403).json({ message: 'Forbidden. Admins only' }); // Forbidden
        }
        // Role matches -> let the request continue to the route.
        next();
    };
}

// Make this importable: const authorizeRole = require('./middleware/authorizeRole')
module.exports = authorizeRole;

// ============================================================
// MIDDLEWARE: authorizeRole — end
// ============================================================
