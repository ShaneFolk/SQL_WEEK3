// Quick test script to see how bcrypt hashes and checks passwords.
// Run it with: node bcrypt-test.js

// bcryptjs is a pure-JavaScript version of bcrypt (no native build needed).
const bcrypt = require('bcryptjs');

// The password a user would type in when signing up.
const plainPassword = 'John@123';

// Turn the password into a hash. The 10 is the "salt rounds" (cost factor):
// higher = slower to compute, which makes brute-force guessing harder.
// A random salt is generated and stored inside the hash, so running this
// twice gives a different hash each time, even for the same password.
// This hash is what you'd save in the database, never the plain password.
const hash = bcrypt.hashSync(plainPassword, 10);
console.log('Hashed:', hash);

// Check a login attempt: compareSync re-hashes the plain password using the
// salt stored in the hash and returns true if they match.
const match = bcrypt.compareSync(plainPassword, hash);
console.log('Correct password match:', match); // true

// The same check with the wrong password returns false.
const wrongPassword = 'Wrong@123';
const wrongMatch = bcrypt.compareSync(wrongPassword, hash);
console.log('wrong password match:', wrongMatch); // false

// Note: the *Sync functions block Node while they run, which is fine for a
// test script. In a real Express route you'd normally use the async versions
// (await bcrypt.hash(...) and await bcrypt.compare(...)) so the server can
// keep handling other requests.
