const pool = require('../config/db');

// Helper to generate the next Order ID
async function generateOrderId(connection) {
  const [rows] = await connection.query('SELECT COUNT(*) AS cnt FROM orders');
  const count = rows[0].cnt + 1;
  return `ORD${String(count).padStart(6, '0')}`;
}

exports.createOrder = async (req, res) => {
  let connection;
  try {
    const { items, subtotal, shippingCost, total, status, ordertype, shipping, clientCreatedAt } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verify and update stock for each item
    for (const item of items) {
      // item.id here refers to the auto-increment 'id' of products table
      const [productRows] = await connection.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [item.id]);
      
      if (productRows.length === 0) {
        throw new Error(`Product ${item.name} not found`);
      }

      const product = productRows[0];
      const category = product.category ? product.category.toLowerCase() : '';
      const productType = product.productType ? product.productType.toLowerCase() : '';
      const isBangle = category.includes('bangle') || productType.includes('bangle');
      const countType = product.count; // e.g. SingleColor

      // Bangle logic for specific color/size stock
      if (isBangle && countType === 'SingleColor' && item.color && item.size) {
        let colorsArray = [];
        try {
          colorsArray = product.colors ? JSON.parse(product.colors) : [];
        } catch(e) {}
        
        let found = false;
        let sufficientStock = false;
        
        const updatedColors = colorsArray.map((c) => {
          if (String(c.color) === String(item.color) && c.stock?.[item.size] !== undefined) {
            found = true;
            if (c.stock[item.size] >= item.quantity) {
              sufficientStock = true;
              c.stock[item.size] = Math.max(0, c.stock[item.size] - item.quantity);
            }
          }
          return c;
        });

        if (!found || !sufficientStock) {
           throw new Error(`Not enough stock for ${item.name} (Color: ${item.color}, Size: ${item.size})`);
        }

        await connection.query('UPDATE products SET colors = ? WHERE id = ?', [JSON.stringify(updatedColors), item.id]);

      } else if (product.stock !== null && product.stock !== undefined) {
        // Simple stock tracking
        if (product.stock < item.quantity) {
          throw new Error(`Not enough stock for ${item.name}`);
        }
        await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.id]);
      }
    }

    const orderIdStr = await generateOrderId(connection);

    // Insert order
    const [orderResult] = await connection.query(`
      INSERT INTO orders (
        orderId, subtotal, shippingCost, total, status, ordertype,
        shipping_name, shipping_email, shipping_phone, shipping_address,
        shipping_city, shipping_state, shipping_zip, shipping_country, clientCreatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderIdStr, subtotal, shippingCost, total, status || 'Pending', ordertype || 'Shop',
      shipping?.name || null, shipping?.email || null, shipping?.phone || null,
      shipping?.address || null, shipping?.city || null, shipping?.state || null,
      shipping?.zip || null, shipping?.country || 'India', clientCreatedAt ? new Date(clientCreatedAt) : null
    ]);

    const orderDbId = orderResult.insertId;

    // Insert order items
    for (const item of items) {
      await connection.query(`
        INSERT INTO order_items (
          order_id, product_id, product_name, category, subcategory, size, color, image, mrp, price, quantity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderDbId, item.id, item.name, item.category, item.subcategory, item.size, item.color, item.image, item.mrp, item.price, item.quantity
      ]);
    }

    await connection.commit();
    res.status(201).json({ success: true, message: 'Order created successfully', orderId: orderIdStr });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('createOrder error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create order' });
  } finally {
    if (connection) connection.release();
  }
};
