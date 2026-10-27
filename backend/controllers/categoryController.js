// ============================================================
// SETUP & IMPORTS — start
// ============================================================

const db = require('../db'); // MySQL connection (../ = go up one folder from controllers)

// ============================================================
// SETUP & IMPORTS — end
// ============================================================

// A controller holds the code that actually runs for a route.
// routes/categories.js connects each URL to one of these functions.

// ------------------------------------------------------------
// getAllCategories  — used by GET /categories — list categories with product counts — start
// ------------------------------------------------------------

// Returns every category plus how many products each one has.
const getAllCategories = (req, res) => {
    // LEFT JOIN keeps a category even if it has NO products (count will be 0).
    // COUNT(p.id) counts the products per category; GROUP BY makes that count
    // happen once per category instead of for the whole table.
    const sql = `SELECT c.id, c.name, c.description, COUNT(p.id) AS product_count
                 FROM categories c
                 LEFT JOIN products p ON p.category_id = c.id
                 GROUP BY c.id, c.name, c.description
                 ORDER BY c.id ASC`;
    // No ? placeholders in this query, so no values array is passed
    db.query(sql, (err, results) => {
        // 500 = database/server error
        if (err) return res.status(500).json({ message: 'Server error' });
        // Send the array of category rows back as JSON
        res.json(results);
    });
};

// ------------------------------------------------------------
// getAllCategories  — used by GET /categories — list categories with product counts — end
// ------------------------------------------------------------

// Export it so routes/categories.js can require() it
module.exports = { getAllCategories };
