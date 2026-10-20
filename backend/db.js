// Load the MySQL driver
const mysql = require('mysql2');

// Create a single MySQL connection using settings from the .env file.
// This runs as soon as the file is required, so the app shares one connection.
const db = mysql.createConnection({
  host: process.env.DB_HOST,         // Server address, e.g. localhost
  user: process.env.DB_USER,         // MySQL username
  password: process.env.DB_PASSWORD, // MySQL password
  database: process.env.DB_NAME      // Which database to use
});

// Open the connection and report whether it worked
db.connect((err) => {
    if (err) {
        // Can't reach the database, so log why and stop the server
        console.error('MySQL connection failed:', err.message);
        process.exit(1);
    }
    console.log('MySQL connected');
});

// Make the connection available to other files via require('./db'),
// e.g. db.query('SELECT * FROM products', callback)
module.exports = db;
