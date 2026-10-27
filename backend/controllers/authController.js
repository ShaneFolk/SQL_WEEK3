// ============================================================
// SETUP & IMPORTS — start
// ============================================================

const bcrypt = require('bcryptjs'); // Library for hashing and checking passwords
const jwt = require('jsonwebtoken'); // Library for creating JWTs (login tokens)
const db = require('../db'); // MySQL connection (../ = go up one folder from controllers)

// ============================================================
// SETUP & IMPORTS — end
// ============================================================

// A controller holds the code that actually runs for a route.
// routes/auth.js connects each URL to one of these functions.

// ------------------------------------------------------------
// login  — used by POST /login — log a user in and return a JWT — start
// ------------------------------------------------------------

// Expects a JSON body like { "email": "...", "password": "..." }
// If the email and password are correct, it sends back a JWT token.
const login = (req, res) => {
    // Pull email and password out of the request body
    const { email, password } = req.body;

    // 400 = Bad Request: the user didn't send everything we need
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    // Look the user up by email. The ? placeholder is filled in safely
    // by mysql2, which protects against SQL injection.
    const sql = 'SELECT * FROM users WHERE email = ?';
    // The callback is async so we can use await for bcrypt.compare below
    db.query(sql, [email], async (err, results) => {
        // 500 = Server Error: something went wrong talking to MySQL
        if (err) return res.status(500).json({ message: 'Server error' });

        // No rows means no user has that email.
        // 401 = Unauthorized. The message is kept vague on purpose so
        // attackers can't tell whether the email or the password was wrong.
        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // results is an array of rows; emails are unique, so take the first one
        const user = results[0];

        // Check the typed password against the hashed one in the database.
        // bcrypt.compare is the async version of compareSync (used in server.js):
        // with await, the server can handle other requests while it works.
        const isMatch = await bcrypt.compare(password, user.password);

        // Wrong password: same vague 401 message as above
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Create the JWT. jwt.sign takes three things:
        //   1. the payload: info stored in the token (readable by anyone,
        //      so no password goes in here)
        //   2. the secret from .env, used to sign it so it can't be faked
        //   3. options: expires after JWT_EXPIRES_IN (e.g. '1h')
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, first_name: user.first_name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Success: send the token plus the user's info back to the frontend.
        // The frontend stores the token and sends it with future requests.
        // (token by itself is shorthand for token: token)
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role
            }
        });
    });
};

// ------------------------------------------------------------
// login  — used by POST /login — log a user in and return a JWT — end
// ------------------------------------------------------------

// ------------------------------------------------------------
// register  — used by POST /users — create a new user — start
// ------------------------------------------------------------

// Expects a JSON body with first_name, last_name, email, password.
// Hashes the password, inserts the user, and returns the new user's id.
const register = async (req, res) => {
    // Pull the new user's details out of the request body
    const { first_name, last_name, email, password } = req.body;

    // 400 = Bad Request: all four fields are required to create a user
    if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Hash the password before storing it. Never save the plain password.
        // 10 is the salt rounds (cost factor); a random salt is baked into the hash.
        // bcrypt.hash is the async version of hashSync (used in server.js).
        const hashedPassword = await bcrypt.hash(password, 10);

        // The ? placeholders are filled in safely by mysql2 (prevents SQL injection)
        const sql = `INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)`;
        db.query(sql, [first_name, last_name, email, hashedPassword], (err, result) => {
            if (err) {
                // The email column is UNIQUE, so a duplicate email trips this error.
                // 400 tells the user their email is already taken.
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: 'Email already registered' });
                }
                // Any other database problem is a 500 server error
                return res.status(500).json({ message: 'Server error' });
            }
            // 201 = Created. insertId is the auto-increment id MySQL gave the new row.
            res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
        });
    } catch (err) {
        // Catches errors from the await above (e.g. hashing failing)
        res.status(500).json({ message: 'Server error' });
    }
};

// ------------------------------------------------------------
// register  — used by POST /users — create a new user — end
// ------------------------------------------------------------

// Export both functions so routes/auth.js can require() them
module.exports = { login, register };
