const db = require('../db');
const { getMongo } = require('../mongo');

const createOrder = async (req, res) => {
  const { items } = req.body;
  const userId = req.user.id;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Order must contain at least one item' });
  }

  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be a whole number of at least 1' });
    }
  }

  db.beginTransaction(async (err) => {
    if (err) return res.status(500).json({ message: 'Server error' });

    try {
      let totalAmount = 0;

      for (const item of items) {
        const product = await new Promise((resolve, reject) => {
          db.query(
            'SELECT price FROM products WHERE id = ?',
            [item.product_id],
            (err, results) => {
              if (err) reject(err);
              else if (results.length === 0) reject(new Error('Product not found'));
              else resolve(results[0]);
            }
          );
        });

        item.price_at_purchase = product.price;
        totalAmount += Number(product.price) * item.quantity;
      }

      const orderResult = await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO orders (user_id, total_amount) VALUES (?, ?)',
          [userId, totalAmount],
          (err, r) => {
            if (err) reject(err);
            else resolve(r);
          }
        );
      });

      const orderId = orderResult.insertId;

      for (const item of items) {
        const { product_id, quantity, price_at_purchase } = item;
        const subtotal = quantity * price_at_purchase;

        await new Promise((resolve, reject) => {
          db.query(
            'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, subtotal) VALUES (?, ?, ?, ?, ?)',
            [orderId, product_id, quantity, price_at_purchase, subtotal],
            (err, r) => {
              if (err) reject(err);
              else resolve(r);
            }
          );
        });

        await new Promise((resolve, reject) => {
          db.query(
            'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?',
            [quantity, product_id, quantity],
            (err, r) => {
              if (err) reject(err);
              else if (r.affectedRows === 0) reject(new Error('Insufficient stock'));
              else resolve(r);
            }
          );
        });
      }

      db.commit(async (err) => {
        if (err) return db.rollback(() => res.status(500).json({ message: 'Commit failed' }));

        try {
          const mongo = getMongo();
          for (const item of items) {
            await mongo.collection('inventory_logs').insertOne({
              product_id: item.product_id,
              action: 'sold',
              quantity_change: -item.quantity,
              timestamp: new Date(),
            });
          }
        } catch (mongoErr) {
          console.error('MongoDB log failed:', mongoErr.message);
        }

        res.status(201).json({ message: 'Order placed', orderId, total_amount: totalAmount });
      });
    } catch (err) {
      db.rollback(() => res.status(400).json({ message: err.message || 'Order failed' }));
    }
  });
};

const getAllOrders = (req, res) => {
  let sql, params;

  if (req.user.role === 'admin') {
    sql = `SELECT o.id, o.status, o.total_amount, o.created_at,
                  u.first_name, u.last_name, u.email,
                  (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
           FROM orders o INNER JOIN users u ON o.user_id = u.id
           ORDER BY o.created_at DESC`;
    params = [];
  } else {
    sql = `SELECT o.id, o.status, o.total_amount, o.created_at,
                  (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
           FROM orders o
           WHERE o.user_id = ? ORDER BY o.created_at DESC`;
    params = [req.user.id];
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(results);
  });
};

const getMyOrders = (req, res) => {
  const sql = `SELECT o.id, o.status, o.total_amount, o.created_at,
                      (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
               FROM orders o
               WHERE o.user_id = ? ORDER BY o.created_at DESC`;

  db.query(sql, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.json(results);
  });
};

const getOrderById = (req, res) => {
  const { id } = req.params;
  const isAdmin = req.user.role === 'admin';

  let sql = `
    SELECT o.id AS order_id, o.status, o.total_amount, o.created_at,
           oi.id AS item_id, oi.quantity, oi.price_at_purchase, oi.subtotal,
           p.name AS product_name
    FROM orders o
    INNER JOIN order_items oi ON oi.order_id = o.id
    INNER JOIN products p ON p.id = oi.product_id
    WHERE o.id = ?`;
  const params = [id];

  // Customers may only see their own orders. Admins can see any order.
  if (!isAdmin) {
    sql += ' AND o.user_id = ?';
    params.push(req.user.id);
  }
  sql += ' ORDER BY oi.id ASC';

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    // Also 404 when the order belongs to someone else, so we don't reveal it exists
    if (results.length === 0) return res.status(404).json({ message: 'Order not found' });

    // Every row repeats the order info, so take it from the first row,
    // then turn each row into one item.
    const first = results[0];
    res.json({
      id: first.order_id,
      status: first.status,
      total_amount: first.total_amount,
      created_at: first.created_at,
      items: results.map((row) => ({
        id: row.item_id,
        product_name: row.product_name,
        quantity: row.quantity,
        price_at_purchase: row.price_at_purchase,
        subtotal: row.subtotal,
      })),
    });
  });
};

module.exports = { createOrder, getAllOrders, getMyOrders, getOrderById };
