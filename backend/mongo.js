// Load the MongoClient class from the official MongoDB driver
const { MongoClient } = require('mongodb');

// Holds the database connection once connectMongo() has run.
// Shared across the app so we only connect once.
let db;

// Connects to MongoDB and selects the 'ecommerce_db' database.
// Call this once when the server starts, before handling requests.
async function connectMongo() {
    // Create a client using the connection string from the .env file
    const client = new MongoClient(process.env.MONGO_URI);

    // Open the connection (waits until it succeeds or throws an error)
    await client.connect();

    // Pick the database to work with and save it for later use
    db = client.db('ecommerce_db');

    console.log('MongoDB connected');
}

// Returns the connected database so other files can run queries,
// e.g. getMongo().collection('products').find()
// Returns undefined if connectMongo() hasn't finished yet.
function getMongo() {
    return db;
}

// Make both functions available to other files via require('./mongo')
module.exports = { connectMongo, getMongo };
