// ============================================================
// SETUP & IMPORTS — start
// ============================================================

const db = require('../db'); // MySQL connection (../ = go up one folder from controllers)
const { getMongo } = require('../mongo'); // getMongo returns the MongoDB db connected at startup

// ============================================================
// SETUP & IMPORTS — end
// ============================================================

// A controller holds the code that actually runs for a route.
// routes/products.js connects each URL to one of these functions.

// ------------------------------------------------------------
// getAllProducts  — used by GET /products — list all products — start
// ------------------------------------------------------------

// Returns every product, each joined to the category it belongs to.
const getAllProducts = (req, res) => {
    // INNER JOIN means only products that HAVE a matching category are returned.
    // c.name AS category_name renames the column so it doesn't clash with p.name.
    const sql = `SELECT p.id, p.name, p.description, p.price, p.stock_quantity, p.category_id,
                        c.name AS category_name
                 FROM products p
                 INNER JOIN categories c ON p.category_id = c.id
                 ORDER BY p.id ASC`;
    db.query(sql, (err, results) => {
        // 500 = database/server error
        if (err) return res.status(500).json({ message: 'Server error' });
        // Send the array of product rows straight back as JSON
        res.json(results);
    });
};

// ------------------------------------------------------------
// getAllProducts  — used by GET /products — list all products — end
// ------------------------------------------------------------

// ------------------------------------------------------------
// getProductsByCategory  — used by GET /products/category/:categoryId — start
// ------------------------------------------------------------

// Returns only the products that belong to one category.
const getProductsByCategory = (req, res) => {
    // :categoryId is a URL parameter, e.g. /products/category/2 -> categoryId = "2"
    const { categoryId } = req.params;
    // The ? placeholder is filled with categoryId safely (prevents SQL injection)
    const sql = `SELECT p.id, p.name, p.description, p.price, p.stock_quantity, p.category_id,
                        c.name AS category_name
                 FROM products p
                 INNER JOIN categories c ON p.category_id = c.id
                 WHERE p.category_id = ?
                 ORDER BY p.id ASC`;
    db.query(sql, [categoryId], (err, results) => {
        // 500 = database/server error
        if (err) return res.status(500).json({ message: 'Server error' });
        // An empty array here just means no products in that category
        res.json(results);
    });
};

// ------------------------------------------------------------
// getProductsByCategory  — used by GET /products/category/:categoryId — end
// ------------------------------------------------------------

// ------------------------------------------------------------
// getProductById  — used by GET /products/:id — one product plus its reviews — start
// ------------------------------------------------------------

// Returns a single product (from MySQL) with its reviews (from MongoDB).
const getProductById = async (req, res) => {
    // :id is the URL parameter, e.g. /products/5 -> id = "5"
    const { id } = req.params;
    // Grab the product and its category name; ? is filled with id safely
    const sql = `SELECT p.id, p.name, p.description, p.price, p.stock_quantity, p.category_id,
                        c.name AS category_name
                 FROM products p
                 INNER JOIN categories c ON p.category_id = c.id
                 WHERE p.id = ?`;
    // The callback is async so we can await the MongoDB query inside it
    db.query(sql, [id], async (err, results) => {
        // 500 = database/server error
        if (err) return res.status(500).json({ message: 'Server error' });
        // No matching row -> 404 Not Found
        if (results.length === 0) return res.status(404).json({ message: 'Product not found' });

        // The one product row
        const product = results[0];
        try {
            // Reviews live in MongoDB, not MySQL
            const mongo = getMongo();
            // parseInt turns the "5" from the URL into the number 5,
            // so it matches how product_id is stored in Mongo
            const reviews = await mongo.collection('product_reviews')
                .find({ product_id: parseInt(id) })
                .toArray();
            // Merge the product fields with its reviews into one JSON response
            res.json({ ...product, reviews });
        } catch (mongoErr) {
            // If Mongo is down or errors, still return the product with no reviews
            res.json({ ...product, reviews: [] });
        }
    });
};

// ------------------------------------------------------------
// getProductById  — used by GET /products/:id — one product plus its reviews — end
// ------------------------------------------------------------

// ------------------------------------------------------------
// createProduct  — used by POST /products — create a product (admin only) — start
// ------------------------------------------------------------

// Adds a product to MySQL and writes an inventory log entry to MongoDB.
// (The admin check happens in routes/products.js via authorizeRole('admin').)
const createProduct = async (req, res) => {
    // Pull the product fields out of the request body
    const { name, description, price, stock_quantity, category_id } = req.body;

    // 400 = Bad Request: these three are the minimum needed to create a product
    if (!name || !price || !category_id) {
        return res.status(400).json({ message: 'name, price, and category_id are required' });
    }

    // The ? placeholders are filled in safely (prevents SQL injection).
    // stock_quantity || 0 -> if no stock was sent, save 0 instead of NULL.
    const sql = `INSERT INTO products (name, description, price, stock_quantity, category_id)
                 VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [name, description, price, stock_quantity || 0, category_id], async (err, result) => {
        // 500 = database/server error
        if (err) return res.status(500).json({ message: 'Server error' });

        // Also record an inventory log in MongoDB. This is "best effort":
        // if Mongo fails we just log it and still report the product as created.
        try {
            const mongo = getMongo();
            await mongo.collection('inventory_logs').insertOne({
                product_id: result.insertId, // the new product's id from MySQL
                product_name: name,
                action: 'restocked',
                quantity_change: stock_quantity || 0,
                previous_stock: 0,
                new_stock: stock_quantity || 0,
                timestamp: new Date()
            });
        } catch (mongoErr) {
            // Don't fail the whole request just because the log didn't save
            console.error('MongoDB log failed:', mongoErr.message);
        }

        // 201 = Created. insertId is the id MySQL gave the new product row.
        res.status(201).json({ message: 'Product created', productId: result.insertId });
    });
};

// ------------------------------------------------------------
// createProduct  — used by POST /products — create a product (admin only) — end
// ------------------------------------------------------------

// Export all four so routes/products.js can require() them
module.exports = { getAllProducts, getProductsByCategory, getProductById, createProduct };
