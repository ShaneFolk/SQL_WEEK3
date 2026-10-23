// ============================================================
// MIDDLEWARE: authenticateToken — start
// ============================================================

// This file exports one middleware function. Put it on any route that should
// only work for logged-in users, e.g. app.get('/orders', authenticateToken, ...).
// It checks the request's JWT; if it's valid the route runs, otherwise it's blocked.

const jwt = require('jsonwebtoken'); // Library for verifying JWTs

// Express calls this with the request, the response, and `next` (a function
// that hands control to the actual route when authentication passes).
function authenticateToken(req, res, next) {
    // The token is sent in the "Authorization" header as: "Bearer <token>"
    const authHeader = req.headers['authorization'];
    // Split on the space and take the second part (the token itself).
    // The `authHeader &&` guard avoids crashing if the header is missing.
    const token = authHeader && authHeader.split(' ')[1];

    // No token at all -> 401 Unauthorized ("you're not logged in")
    if (!token) {
        return res.status(401).json({ message: 'access denied. No token provided' }); // Unauthorized
    }

    // Check the token against the secret from .env.
    // verify() fails if the token is fake, edited, or expired.
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        // Bad or expired token -> 403 Forbidden ("your token isn't valid")
        if (err) {
            return res.status(403).json({ message: 'invalid or expired token' }); // Forbidden
        }
        // Token is good. `decoded` is the payload we signed at login
        // (id, email, role). Attach it to req so the route can see who's calling.
        req.user = decoded;
        // Hand control to the next middleware / the route itself.
        next();
    });
}

// Make this function importable: const authenticateToken = require('./middleware/authenticateToken')
module.exports = authenticateToken;

// ============================================================
// MIDDLEWARE: authenticateToken — end
// ============================================================
