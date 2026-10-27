// ============================================================
// SETUP & IMPORTS — start
// ============================================================

// Load variables from the .env file into process.env.
// This must run first so db.js and mongo.js can read their settings.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectMongo } = require('./mongo');
const db = require('./db');
const errorHandler = require('./middleware/errorHandler');
const authRouter = require('./routes/auth');
const productRouter = require('./routes/products');
const categoryRouter = require('./routes/categories');
const orderRouter = require('./routes/orders');
const reviewRouter = require('./routes/reviews');
const reportRouter = require('./routes/reports');
// const bcrypt = require('bcryptjs'); // Library for hashing passwords
// const jwt = require('jsonwebtoken'); // Library for creating and verifying JWTs
// const authenticateToken = require("./middleware/authenticateToken"); // Checks the JWT; blocks requests with no/invalid token
// const authorizeRole = require("./middleware/authorizeRole"); 
const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());
app.use('/auth', authRouter);
app.use('/products', productRouter);
app.use('/categories', categoryRouter);
app.use('/orders', orderRouter);
app.use('/reviews', reviewRouter);
app.use('/reports', reportRouter);
// ============================================================
// SETUP & IMPORTS — end
// ============================================================

// ============================================================
// MIDDLEWARE — start
// ============================================================

// Middleware: runs on every request before the routes

// ============================================================
// MIDDLEWARE — end
// ============================================================

// ------------------------------------------------------------
// GET /  — health check — start
// ------------------------------------------------------------

// Test route: visit http://localhost:3000/ to check the server is up
app.get("/", (req, res) => {
    res.json({ message: "era commerce is running" });
});

// ------------------------------------------------------------
// GET /  — health check — end
// ------------------------------------------------------------

// ------------------------------------------------------------
// POST /login  — log a user in and return a JWT — start
// ------------------------------------------------------------

// Login route: POST http://localhost:3000/login
// Expects a JSON body like { "email": "...", "password": "..." }
// If the email and password are correct, it sends back a JWT token.
// app.post("/login", (req, res) => {
//     // Pull email and password out of the request body (needs express.json() above)
//     const { email, password } = req.body;

//     // 400 = Bad Request: the user didn't send everything we need
//     if (!email || !password) {
//         return res.status(400).json({ message: "Email and password are required" });
//     }

//     // Check if the user exists in the database
//     // The ? is a placeholder: mysql2 safely fills it in with the email,
//     // which protects against SQL injection.
//     const sql = "SELECT * FROM users WHERE email = ?";
//     db.query(sql, [email], async (err, results) => {
//         // 500 = Server Error: something went wrong talking to MySQL
//         if (err) {
//             return res.status(500).json({ message: "Database error", error: err });
//         }
//         // No rows means no user has that email.
//         // 401 = Unauthorized. The message is kept vague on purpose so
//         // attackers can't tell whether the email or the password was wrong.
//         if (results.length === 0) {
//             return res.status(401).json({ message: "Invalid email or password" });
//         }

//         // results is an array of rows; emails are unique, so take the first one
//         const user = results[0];
//         // Compare the provided password with the hashed password in the database
//         // (bcrypt hashes the typed password with the stored salt and compares)
//         const isMatch = bcrypt.compareSync(password, user.password);

//         // Wrong password: same vague 401 message as above
//         if (!isMatch) {
//             return res.status(401).json({ message: "Invalid email or password" });
//         }

//         // Generate a JWT token for the authenticated user
//         // The payload is readable by anyone, so only safe info goes in (no password)
//         const payload = { id: user.id, email: user.email, role: user.role };
//         // Sign it with the secret from .env; it expires after JWT_EXPIRES_IN (e.g. '1h')
//         const token = jwt.sign(payload, process.env.JWT_SECRET, {
//             expiresIn: process.env.JWT_EXPIRES_IN
//         });
//         // Success: send the token plus basic user info back to the frontend.
//         // The frontend stores the token and sends it with future requests.
//         res.json({
//             message: "Login successful",
//             token: token,
//             user: {
//                 id: user.id,
//                 email: user.email,
//                 role: user.role
//             }
//         });
//     });
// });

// // ------------------------------------------------------------
// // POST /login  — log a user in and return a JWT — end
// // ------------------------------------------------------------

// // ------------------------------------------------------------
// // POST /users  — register (create) a new user — start
// // ------------------------------------------------------------

// // Register route: POST http://localhost:3000/users
// // Expects a JSON body with first_name, last_name, email, password.
// // Hashes the password, inserts the user, and returns the new user's id.
// app.post("/users", async (req, res) => {
//     // Pull the new user's details out of the request body
//     const { first_name, last_name, email, password } = req.body;

//     // 400 = Bad Request: all four fields are required to create a user
//     if (!first_name || !last_name || !email || !password) {
//         return res.status(400).json({ message: "All fields are required" });
//     }

//     try {
//         // Hash the password before storing it — never save the plain password.
//         // 10 is the salt rounds (cost factor); a random salt is baked into the hash.
//         const hashedPassword = bcrypt.hashSync(password, 10);

//         // The ? placeholders are filled in safely by mysql2 (prevents SQL injection)
//         const sql =
//             "INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)";
//         db.query(sql, [first_name, last_name, email, hashedPassword], (err, results) => {
//             if (err) {
//                 // The email column is UNIQUE, so a duplicate email trips this error.
//                 // 400 tells the user their email is already taken.
//                 if (err.code === "ER_DUP_ENTRY") {
//                     return res.status(400).json({ message: "Email already registered" });
//                 }
//                 // Any other database problem is a 500 server error
//                 return res.status(500).json({ message: "Database error", error: err });
//             }
//             // 201 = Created. insertId is the auto-increment id MySQL gave the new row.
//             res.status(201).json({
//                 message: "User registered successfully",
//                 userId: results.insertId
//             });
//         });
//     } catch (err) {
//         // Catches errors thrown before/around the query (e.g. hashing failing)
//         return res.status(500).json({ message: "Server error", error: err });
//     }
// });

// // ------------------------------------------------------------
// POST /users  — register (create) a new user — end
// ------------------------------------------------------------

// ------------------------------------------------------------
// GET /products  — list all products with their category — start
// ------------------------------------------------------------

// // Returns every product, each joined to the category it belongs to.
// // authenticateToken runs first: only logged-in users (valid JWT) get past it.
// app.get("/products", authenticateToken, (req, res) => {
//     // INNER JOIN means only products that HAVE a matching category are returned.
//     // c.name AS category_name renames the column so it doesn't clash with p.name.
//     const sql = `SELECT p.id, p.name, p.description, p.price, p.stock_quantity, c.name AS category_name
//      FROM products p
//      INNER JOIN categories c ON p.category_id = c.id
//      ORDER BY p.id`;
//     db.query(sql, (err, results) => {
//         if (err) {
//             return res.status(500).json({ message: "server error", error: err });
//         }
//         // 200 = OK. Send the array of product rows straight back as JSON.
//         res.status(200).json(results);
//     });
// });

// // ------------------------------------------------------------
// // GET /products  — list all products with their category — end
// // ------------------------------------------------------------

// // ------------------------------------------------------------
// // GET /products/category/:categoryId  — products in one category — start
// // ------------------------------------------------------------

// // Returns only the products that belong to one category.
// // authenticateToken runs first: requires a valid JWT.
// app.get("/products/category/:categoryId", authenticateToken, (req, res) => {
//     // :categoryId is a URL parameter, e.g. /products/category/2 -> categoryId = "2"
//     const { categoryId } = req.params;
//     // The ? placeholder is filled with categoryId safely (prevents SQL injection)
//     const sql = `SELECT p.id, p.name, p.description, p.price, p.stock_quantity, c.name AS category_name
//                  FROM products p
//                  INNER JOIN categories c ON p.category_id = c.id
//                  WHERE c.id = ?
//                  ORDER BY p.id ASC`;
//     db.query(sql, [categoryId], (err, results) => {
//         if (err) {
//             return res.status(500).json({ message: "server error", error: err });
//         }
//         // 200 = OK. Empty array here just means no products in that category.
//         res.status(200).json(results);
//     });
// });

// // ------------------------------------------------------------
// // GET /products/category/:categoryId  — products in one category — end
// // ------------------------------------------------------------

// // ------------------------------------------------------------
// // GET /products/:id  — one product plus its reviews — start
// // ------------------------------------------------------------

// // Returns a single product (from MySQL) with its reviews (from MongoDB).
// // authenticateToken runs first: requires a valid JWT.
// // NOTE: this is declared AFTER /products/category/:categoryId on purpose.
// // Express checks routes in order, and :id matches one segment, so a URL like
// // /products/category/2 still hits the category route first. Keep this order.
// app.get("/products/:id", authenticateToken, (req, res) => {
//     // :id is the URL parameter, e.g. /products/5 -> id = "5"
//     const { id } = req.params;
//     // Grab the product and its category name; ? is filled with id safely
//     const sql = `SELECT p.id, p.name, p.description, p.price, p.stock_quantity, c.name AS category_name
//                  FROM products p
//                  INNER JOIN categories c ON p.category_id = c.id
//                  WHERE p.id = ?`;
//     db.query(sql, [id], async (err, results) => {
//         // 500 = database/server error
//         if (err) {
//             return res.status(500).json({ message: "server error", error: err });
//         }
//         // No matching row -> 404 Not Found
//         if (results.length === 0) {
//             return res.status(404).json({ message: "Product not found" });
//         }

//         // The one product row
//         const product = results[0];
//         try {
//             // Reviews live in MongoDB, not MySQL. getMongo() returns the db we
//             // connected to at startup.
//             const mongo = getMongo();
//             // Find reviews for this product. parseInt turns the "5" from the URL
//             // into the number 5, so it matches how product_id is stored in Mongo.
//             // NOTE: the Mongo field is product_id (snake_case), matching the seeded data.
//             const reviews = await mongo
//                 .collection("product_reviews")
//                 .find({ product_id: parseInt(id) })
//                 .toArray();

//             // Merge the product fields with its reviews into one JSON response
//             res.json({ ...product, reviews });
//         } catch (mongoErr) {
//             // If Mongo is down or errors, still return the product with no reviews
//             res.json({ ...product, reviews: [] });
//         }
//     });
// });

// // ------------------------------------------------------------
// // GET /products/:id  — one product plus its reviews — end
// // ------------------------------------------------------------

// // ------------------------------------------------------------
// // POST /products  — create a new product (admin only) — start
// // ------------------------------------------------------------

// // Adds a product to MySQL and writes an inventory log entry to MongoDB.
// // Two middleware run first, in order:
// //   authenticateToken   -> must be logged in (valid JWT)
// //   authorizeRole('admin') -> must have the admin role
// app.post("/products", authenticateToken, authorizeRole("admin"), async (req, res) => {
//     // Pull the product fields out of the request body
//     const { name, description, price, stock_quantity, category_id } = req.body;

//     // 400 = Bad Request: these three are the minimum needed to create a product.
//     // (description and stock_quantity are optional here.)
//     if (!name || !price || !category_id) {
//         return res.status(400).json({ message: "Name, price, and category_id are required" });
//     }

//     // Insert the product. The ? placeholders are filled in safely (prevents SQL injection).
//     const sql = `INSERT INTO products (name, description, price, stock_quantity, category_id)
//                  VALUES (?, ?, ?, ?, ?)`;
//     db.query(sql, [name, description, price, stock_quantity, category_id], async (err, result) => {
//         // 500 = database/server error
//         if (err) {
//             return res.status(500).json({ message: "server error", error: err });
//         }
//         // Also record an inventory log in MongoDB. This is "best effort":
//         // if Mongo fails we just log it and still report the product as created.
//         try {
//             const mongo = getMongo();
//             await mongo.collection("inventory_logs").insertOne({
//                 product_id: result.insertId, // the new product's auto-increment id from MySQL
//                 product_name: name,
//                 action: "restocked",
//                 quantity_change: stock_quantity || 0, // || 0 covers an undefined/missing value
//                 previous_stock: 0,
//                 new_stock: stock_quantity || 0,
//                 timestamp: new Date()
//             });
//         } catch (mongoErr) {
//             // Don't fail the whole request just because the log didn't save
//             console.error("MongoDB log failed:", mongoErr.message);
//         }
//         // 201 = Created. insertId is the id MySQL gave the new product row.
//         res.status(201).json({ message: "Product created", productId: result.insertId });
//     });
// });

// // ------------------------------------------------------------
// // POST /products  — create a new product (admin only) — end
// // ------------------------------------------------------------

// // ------------------------------------------------------------
// // POST /orders  — place an order (transaction) — start
// // ------------------------------------------------------------

// // Creates an order from a list of items. This uses a TRANSACTION so that the
// // order, its line items, and the stock updates all succeed together or not at
// // all. Reviews/logs go to MongoDB afterwards.
// // authenticateToken runs first: requires a valid JWT, and sets req.user.
// app.post("/orders", authenticateToken, async (req, res) => {
//     // Read the items array from the body. `|| {}` avoids a crash if body is empty.
//     const { items } = req.body || {};
//     // Who is ordering — taken from the token (set by authenticateToken), not the body.
//     const userId = req.user.id;
//     // 400 = Bad Request: an order needs at least one item
//     if (!items || items.length === 0) {
//         return res.status(400).json({ message: "order must contain at least one item" });
//     }

//     // Start a transaction. Nothing is permanent until we commit().
//     db.beginTransaction(async (err) => {
//         if (err) {
//             return res.status(500).json({ message: "server error", error: err });
//         }

//         // The try/catch lives INSIDE the callback so that any failure below
//         // jumps to the catch, which rolls the whole transaction back.
//         try {
//             // Add up the order total from each item's price x quantity
//             let totalAmount = 0;
//             for (const item of items) {
//                 totalAmount += item.price_at_purchase * item.quantity;
//             }

//             // Step 1: insert the order row. Wrapped in a Promise so we can await
//             // the callback-style db.query inside this async function.
//             const orderSQL = "INSERT INTO orders (user_id, total_amount) VALUES (?, ?)";
//             const orderResult = await new Promise((resolve, reject) => {
//                 db.query(orderSQL, [userId, totalAmount], (err, result) => {
//                     if (err) reject(err);
//                     else resolve(result);
//                 });
//             });
//             // The id MySQL assigned the new order; line items point back to it.
//             const orderId = orderResult.insertId;

//             // Step 2: for each item, insert a line row AND reduce that product's stock.
//             for (const item of items) {
//                 const { product_id, quantity, price_at_purchase } = item;
//                 const subtotal = price_at_purchase * quantity;

//                 // Insert one order_items row
//                 await new Promise((resolve, reject) => {
//                     const itemSQL =
//                         "INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, subtotal) VALUES (?, ?, ?, ?, ?)";
//                     db.query(
//                         itemSQL,
//                         [orderId, product_id, quantity, price_at_purchase, subtotal],
//                         (err, r) => {
//                             if (err) reject(err);
//                             else resolve(r);
//                         }
//                     );
//                 });

//                 // Reduce stock, but only if there's enough (stock_quantity >= quantity).
//                 // If no row was updated (affectedRows === 0), stock was too low, so
//                 // reject — the catch below will roll everything back.
//                 await new Promise((resolve, reject) => {
//                     const stockSQL =
//                         "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?";
//                     db.query(stockSQL, [quantity, product_id, quantity], (err, r) => {
//                         if (err) reject(err);
//                         else if (r.affectedRows === 0) reject(new Error("Insufficient stock"));
//                         else resolve(r);
//                     });
//                 });
//             }

//             // Step 3: commit — make all the SQL above permanent.
//             // Awaited (Promise-wrapped) so we don't continue until it actually succeeds.
//             await new Promise((resolve, reject) => {
//                 db.commit((err) => {
//                     if (err) reject(err);
//                     else resolve();
//                 });
//             });

//             // Step 4: write a "sold" inventory log to MongoDB for each item.
//             // This runs AFTER commit and is best-effort: a Mongo failure is logged
//             // but doesn't undo the order (the money/stock change already committed).
//             const mongo = getMongo();
//             for (const item of items) {
//                 try {
//                     await mongo.collection("inventory_logs").insertOne({
//                         product_id: item.product_id,
//                         action: "sold",
//                         quantity_change: -item.quantity,
//                         timestamp: new Date()
//                     });
//                 } catch (mongoErr) {
//                     console.error("MongoDB inventory log failed:", mongoErr.message);
//                 }
//             }

//             // 201 = Created. Tell the client the order went through.
//             res.status(201).json({ message: "Order placed", order_id: orderId });
//         } catch (err) {
//             // Any failure above (bad insert, insufficient stock, failed commit)
//             // lands here. Roll back so no half-finished order is left behind,
//             // THEN send the error response (inside the rollback callback so we
//             // only respond once).
//             db.rollback(() => {
//                 console.error("Order processing failed:", err.message);
//                 res.status(500).json({ message: "server error", error: err.message });
//             });
//         }
//     });
// });

// // ------------------------------------------------------------
// // POST /orders  — place an order (transaction) — end
// // ------------------------------------------------------------

// // ------------------------------------------------------------
// // GET /orders/my  — the logged-in user's own orders — start
// // ------------------------------------------------------------

// // Returns only the orders that belong to whoever is logged in.
// // authenticateToken runs first: requires a valid JWT, and sets req.user.
// // NOTE: this is declared BEFORE /orders/:id on purpose. Otherwise Express
// // would treat "my" as an :id and send it to the wrong route. Keep this order.
// app.get("/orders/my", authenticateToken, (req, res) => {
//     // Newest orders first (ORDER BY created_at DESC)
//     const sql = `SELECT id, status, total_amount, created_at
//                  FROM orders
//                  WHERE user_id = ?
//                  ORDER BY created_at DESC`;
//     // The user id comes from the token, not the URL or body, so users
//     // can't ask for someone else's orders.
//     const params = [req.user.id];
//     db.query(sql, params, (err, results) => {
//         // 500 = database/server error (error details are left out of the response)
//         if (err) {
//             return res.status(500).json({ message: "server error" });
//         }
//         // 200 = OK. An empty array just means this user has no orders yet.
//         res.status(200).json(results);
//     });
// });

// // ------------------------------------------------------------
// // GET /orders/my  — the logged-in user's own orders — end
// // ------------------------------------------------------------

// // ------------------------------------------------------------
// // GET /orders/:id  — one order with its line items — start
// // ------------------------------------------------------------

// // Returns a single order joined to its items and each item's product name.
// // authenticateToken runs first: requires a valid JWT.
// app.get("/orders/:id", authenticateToken, (req, res) => {
//     // :id is the URL parameter, e.g. /orders/7 -> id = "7"
//     const { id } = req.params;
//     // Two JOINs: orders -> order_items (the lines in the order),
//     // then order_items -> products (to get each product's name).
//     // The AS aliases rename columns so the two "id" columns don't clash.
//     // This returns ONE ROW PER ITEM in the order.
//     const sql = `SELECT o.id AS order_id, o.status, o.total_amount, o.created_at, oi.id AS item_id, oi.quantity, oi.price_at_purchase, oi.subtotal, p.name AS product_name
//                  FROM orders o
//                  JOIN order_items oi ON o.id = oi.order_id
//                  JOIN products p ON oi.product_id = p.id
//                  WHERE o.id = ?
//                  ORDER BY oi.id ASC`;
//     db.query(sql, [id], (err, results) => {
//         // 500 = database/server error
//         if (err) {
//             return res.status(500).json({ message: "server error" });
//         }
//         // No rows -> no order with that id (or it has no items) -> 404 Not Found
//         if (results.length === 0) {
//             return res.status(404).json({ message: "order not found" });
//         }
//         // 200 = OK. results[0] sends only the FIRST row, i.e. the order
//         // details plus its first item.
//         res.status(200).json(results[0]);
//     });
// });

// // ------------------------------------------------------------
// // GET /orders/:id  — one order with its line items — end
// // ------------------------------------------------------------

// // ------------------------------------------------------------
// // GET /orders  — list orders (all for admin, own for customers) — start
// // ------------------------------------------------------------

// // One route, two behaviours depending on the user's role:
// //   admin    -> every order, plus the customer's name and email
// //   anyone else -> only their own orders
// // authenticateToken runs first: requires a valid JWT, and sets req.user.
// app.get("/orders", authenticateToken, (req, res) => {
//     // Declared with let (no value yet) because the if/else below fills them in
//     let sql;
//     let params;

//     // req.user.role comes from the JWT payload created at login
//     if (req.user.role === "admin") {
//         // JOIN users so the admin can see who placed each order
//         sql = `SELECT o.id, o.status, o.total_amount, o.created_at, u.first_name, u.last_name, u.email
//                FROM orders o
//                JOIN users u ON o.user_id = u.id`;
//         params = []; // no ? placeholders in this query, so no values
//     } else {
//         // Regular users: filter to their own user id from the token
//         sql = `SELECT o.id, o.status, o.total_amount, o.created_at
//                FROM orders o
//                WHERE o.user_id = ?`;
//         params = [req.user.id];
//     }
//     db.query(sql, params, (err, results) => {
//         // 500 = database/server error
//         if (err) {
//             return res.status(500).json({ message: "server error", error: err });
//         }
//         // 200 = OK. Send the array of order rows back as JSON.
//         res.status(200).json(results);
//     });
// });

// // ------------------------------------------------------------
// // GET /orders  — list orders (all for admin, own for customers) — end
// // ------------------------------------------------------------

// // ------------------------------------------------------------
// // GET /categories  — list categories with product counts — start
// // ------------------------------------------------------------

// // Returns every category plus how many products each one has.
// // authenticateToken runs first: requires a valid JWT.
// app.get("/categories", authenticateToken, (req, res) => {
//     // LEFT JOIN keeps a category even if it has NO products (count will be 0).
//     // COUNT(p.id) counts the products per category; GROUP BY makes that count
//     // happen once per category instead of for the whole table.
//     const sql = `SELECT c.id, c.name, c.description, COUNT(p.id) AS product_count
//      FROM categories c
//      LEFT JOIN products p ON p.category_id = c.id
//      GROUP BY c.id, c.name, c.description
//      ORDER BY c.id ASC`;
//     db.query(sql, (err, results) => {
//         if (err) {
//             return res.status(500).json({ message: "server error", error: err });
//         }
//         // 200 = OK. Send the array of category rows back as JSON.
//         res.status(200).json(results);
//     });
// });

// // ------------------------------------------------------------
// // GET /categories  — list categories with product counts — end
// // ------------------------------------------------------------

// ------------------------------------------------------------
// POST /reviews  — add a review for a product — start
// ------------------------------------------------------------

// Creates a review in MongoDB (product_reviews). The reviewer is the logged-in
// user (from their JWT), so the body only needs product_id, rating, review_text.
// app.post("/reviews", authenticateToken, async (req, res) => {
//     // What the client sends in the body
//     const { product_id, rating, review_text } = req.body;

//     // 400 = Bad Request: all three fields are required
//     if (!product_id || !rating || !review_text) {
//         return res.status(400).json({ message: "all fields are required" });
//     }

//     // Ratings must be between 1 and 5
//     if (rating < 1 || rating > 5) {
//         return res.status(400).json({ message: "rating must be between 1 and 5" });
//     }

//     try {
//         // Use the already-connected db (getMongo), NOT connectMongo (which opens
//         // a new connection and returns nothing).
//         const mongo = getMongo();
//         // Insert the review into MongoDB. parseInt keeps product_id a number so
//         // it matches how GET /products/:id searches for reviews.
//         const result = await mongo.collection("product_reviews").insertOne({
//             product_id: parseInt(product_id),
//             user_id: req.user.id,
//             first_name: req.user.email.split("@")[0],
//             rating: parseInt(rating),
//             review_text,
//             created_at: new Date()
//         });
//         // 201 = Created. insertedId is the new review's MongoDB _id.
//         res.status(201).json({ message: "Review submitted", review_id: result.insertedId });
//     } catch (err) {
//         console.error(err); // full detail stays in the server log
//         res.status(500).json({ message: "server error" });
//     }
// });

// ------------------------------------------------------------
// POST /reviews  — add a review for a product — end
// ------------------------------------------------------------

// ------------------------------------------------------------
// GET /reports/sales  — sales summary report (admin only) — start
// ------------------------------------------------------------

// Returns overall sales stats across every order.
// Two middleware run first, in order:
//   authenticateToken      -> must be logged in (valid JWT)
//   authorizeRole('admin') -> must have the admin role
// app.get('/reports/sales', authenticateToken, authorizeRole('admin'),  (req,res) => {
//     // Aggregate functions squash all the order rows into ONE summary row:
//     //   COUNT(*) -> how many orders     SUM -> total revenue
//     //   AVG      -> average order value  MAX/MIN -> biggest/smallest order
//     // (MySQL column names aren't case-sensitive, so Total_amount still works.)
//     const sql = `
//     SELECT COUNT(*) AS total_orders,
//     SUM(total_amount) AS total_revenue,
//     AVG(total_amount) AS average_order_value,
//     MAX(Total_amount) AS highest_order,
//     MIN(total_amount) AS lowest_order
//     FROM orders`;
    
//     db.query(sql, (err, results) => {
//         // 500 = database/server error. Full detail goes to the server log only.
//         if(err) {
//             console.error(err);
//             return res.status(500).json({message: "server error"});
//         }
//         // Aggregates return a single row, so send results[0] (an object, not an array)
//         res.json(results[0]);

//     });
// });

// // ------------------------------------------------------------
// // GET /reports/sales  — sales summary report (admin only) — end
// // ------------------------------------------------------------

// // ------------------------------------------------------------
// // GET /reports/top-products  — top 10 best-selling products (admin only) — start
// // ------------------------------------------------------------

// // Returns the 10 products that have sold the most units, with revenue for each.
// // Two middleware run first, in order:
// //   authenticateToken      -> must be logged in (valid JWT)
// //   authorizeRole('admin') -> must have the admin role
// app.get('/reports/top-products', authenticateToken, authorizeRole('admin'), (req,res) => {
//     // INNER JOIN order_items -> products so each sold line has a product name.
//     // GROUP BY p.id, p.name -> one row per product, so SUM adds up all of
//     //   that product's order lines (units sold and money made).
//     // ORDER BY total_sold DESC -> best sellers first; LIMIT 10 -> keep the top 10.
//     const sql = `
//     SELECT p.id, p.name AS products_name,
//     SUM(oi.quantity) AS total_sold,
//     SUM(oi.subtotal) AS total_revenue
//     FROM order_items oi
//     INNER JOIN products p ON p.id = oi.product_id
//     GROUP BY p.id, p.name
//     ORDER by total_sold DESC
//     LIMIT 10`;
    
//     // No ? placeholders in this query, so no values array is passed
//     db.query(sql, (err, results) => {

//         // 500 = database/server error
//         if(err){
//             console.error(err);
//             return res.status(500).json({message: "server error"});
//         }
//             // 200 = OK. Send the array of (up to 10) product rows back as JSON.
//             res.json(results);
//     });
// });


// // ------------------------------------------------------------
// // GET /reports/top-products  — top 10 best-selling products (admin only) — end
// // ------------------------------------------------------------

// // ------------------------------------------------------------
// // GET /reports/category-sales  — sales totals per category (admin only) — start
// // ------------------------------------------------------------

// // Returns each category's number of items sold, revenue, and average item value.
// // Two middleware run first, in order:
// //   authenticateToken      -> must be logged in (valid JWT)
// //   authorizeRole('admin') -> must have the admin role
// app.get('/reports/category-sales', authenticateToken, authorizeRole('admin'), (req,res) => {

//     // Joins: order_items -> products (which product was sold)
//     //        products -> categories (which category that product is in).
//     // RIGHT JOIN keeps every category, even ones with no sales (their sums are NULL).
//     // COUNT(oi.id) counts order LINES (items sold), not separate orders.
//     // ROUND(AVG(...), 2) -> average line subtotal rounded to 2 decimals (cents).
//     // GROUP BY c.id, c.name -> one summary row per category.
//     // HAVING filters AFTER grouping (WHERE can't use SUM). It keeps only categories
//     //   with sales, so the no-sales categories the RIGHT JOIN kept get removed here.
//     // ORDER BY total_revenue DESC -> highest-earning category first.
//     const sql = `
//             SELECT 
//             c.id, 
//             c.name AS category_name, 
//             COUNT(oi.id) AS total_orders, 
//             SUM(oi.subtotal) AS total_revenue, 
//             ROUND(AVG(oi.subtotal),2) AS average_item_value 
//             FROM order_items oi 
//             INNER JOIN products p ON p.id = oi.product_id 
//             RIGHT JOIN categories c ON c.id = p.category_id 
//             GROUP BY c.id, c.name 
//             HAVING SUM(oi.subtotal) > 0 
//             ORDER BY total_revenue DESC 
//             `;
//     // No ? placeholders in this query, so no values array is passed
//     db.query(sql, (err, results) => {

//         // 500 = database/server error. Full detail goes to the server log only.
//         if(err){
//             console.error(err);
//             return res.status(500).json({message: "Server error"});
//         }
//             // 200 = OK. Send the array of category rows back as JSON.
//             res.json(results);

//     });
// });

// ------------------------------------------------------------
// GET /reports/category-sales  — sales totals per category (admin only) — end
// ------------------------------------------------------------

// ------------------------------------------------------------
// GET /inventory  — stock levels with a status label (admin only) — start
// ------------------------------------------------------------

// Returns every product's stock count, category, and a stock status label.
// Two middleware run first, in order:
//   authenticateToken      -> must be logged in (valid JWT)
// //   authorizeRole('admin') -> must have the admin role
// app.get('/inventory', authenticateToken, authorizeRole('admin'), (req,res) => {
//     // CASE works like an if / else if / else inside SQL. It's checked top-down
//     // and the first true WHEN wins:
//     //   more than 10      -> 'in_stock'
//     //   1 to 10           -> 'low_stock'
//     //   0 (or less)       -> 'out_of_stock'
//     // END AS stock_status names the new column the CASE creates.
//     // INNER JOIN categories -> adds each product's category name.
//     // ORDER BY stock_quantity ASC -> lowest stock first, so problems show at the top.
//     const sql = `SELECT
//             p.id, 
//             p.name,
//             p.stock_quantity, 
//             c.name AS category_name, 
//             CASE WHEN p.stock_quantity > 10 THEN 'in_stock' 
//             WHEN p.stock_quantity > 0 THEN 'low_stock' 
//             ELSE 'out_of_stock' 
//             END AS stock_status
//             FROM products p
//             INNER JOIN categories c ON c.id = p.category_id
//             ORDER BY p.stock_quantity ASC;
    
//             `;
    
//     // No ? placeholders in this query, so no values array is passed
//     db.query(sql, (err, results) => {

//         // 500 = database/server error. Full detail goes to the server log only.
//         if(err){
//             console.error(err);
//             return res.status(500).json({message:"Server error"});
//         }
//             // 200 = OK. Send the array of product stock rows back as JSON.
//             res.json(results);
//     });
// });

// ------------------------------------------------------------
// GET /inventory  — stock levels with a status label (admin only) — end
// ------------------------------------------------------------

// ============================================================
// START SERVER — start
// ============================================================

// Connect to MongoDB first, then start accepting requests.
// This way no request arrives before the database is ready.
// Error handler goes LAST, after every route
app.use(errorHandler);

async function startServer() {
    await connectMongo();
    app.listen(PORT, () => {
        console.log(`server running at http://localhost:${PORT}`);
    });
}

startServer();

// ============================================================
// START SERVER — end
// ============================================================
