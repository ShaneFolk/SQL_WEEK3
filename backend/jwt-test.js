// Quick test script to see how JSON Web Tokens (JWTs) are created and checked.
// Run it with: node jwt-test.js

// jsonwebtoken is the library that signs (creates) and verifies JWTs.
const jwt = require('jsonwebtoken');

// The secret key used to sign tokens. Only the server should know it:
// anyone with this secret could create fake tokens.
// In a real app, keep it in your .env file (e.g. process.env.JWT_SECRET)
// instead of hard-coding it here.
const secret = 'eracommerce_jwt_secret_2026';

//generate a JWT token for a user
// The payload is the data stored inside the token. It is encoded, NOT
// encrypted, so anyone can read it: never put passwords or secrets here.
const payload = { userId: 3, email: 'John@eracommerce.com', role: 'customer' };

// sign() builds the token from the payload and secret.
// expiresIn: '1h' means the token stops being valid after one hour.
const token = jwt.sign(payload, secret, { expiresIn: '1h' });
// The token has 3 parts separated by dots: header.payload.signature
console.log('Token:', token);

//verify and decode the token
// verify() checks that the signature matches the secret and that the token
// hasn't expired. If it's valid, it returns the payload. If not (wrong
// secret, edited token, or expired), it throws an error.
const decoded = jwt.verify(token, secret);
// The decoded object also includes iat ("issued at") and exp ("expires at"),
// both as Unix timestamps in seconds.
console.log('Decoded:', decoded);
