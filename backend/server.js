// Load variables from the .env file into process.env.
// This must run first so db.js and mongo.js can read their settings.
require('dotenv').config();

const express = require('express'); // Web framework for handling routes/requests
const cors = require('cors');       // Lets a frontend on another port/site call this API
const db = require('./db');         // MySQL connection (connects as soon as it's required)
const { connectMongo } = require('./mongo'); // Function that connects to MongoDB

// Create the Express app and choose which port it listens on
const app = express();
const PORT = 3000;

// Middleware: runs on every request before the routes
app.use(cors());         // Allow cross-origin requests (e.g. from a React app)
app.use(express.json()); // Read JSON request bodies into req.body

// Test route: visit http://localhost:3000/ to check the server is up
app.get('/', (req, res) => {
    res.json({ message: 'era commerce is running' });
});

// Connect to MongoDB first, then start accepting requests.
// This way no request arrives before the database is ready.
async function startServer() {
    await connectMongo();
    app.listen(PORT, () => {
        console.log(`server running at http://localhost:${PORT}`);
    });
}

startServer();
