const pool = require('../config/db');

// Helper to generate the next Order ID
async function generateOrderId(connection) {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  
  // Find orders created today to determine the daily sequence number
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  const [rows] = await connection.query(
    'SELECT COUNT(*) AS cnt FROM orders WHERE created_at >= ? AND created_at <= ?',
    [startOfDay, endOfDay]
  );
  
  const count = rows[0].cnt + 1;
  const seq = String(count).padStart(2, '0');
  
  return `ORD${mm}${dd}${seq}`;
}

exports.createOrder = async (req, res) => {
  let connection;
  try {
    const { items, subtotal, shippingCost, total, status, ordertype, shipping, clientCreatedAt, user_id } = req.body;

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
        orderId, user_id, subtotal, shippingCost, total, status, ordertype,
        shipping_name, shipping_email, shipping_phone, shipping_address,
        shipping_city, shipping_state, shipping_zip, shipping_country, clientCreatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      orderIdStr, user_id || null, subtotal, shippingCost, total, status || 'Pending', ordertype || 'Shop',
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

exports.getOrders = async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    
    // Fetch items for each order
    const orderIds = orders.map(o => o.id);
    let itemsMap = {};
    if (orderIds.length > 0) {
      const [items] = await pool.query('SELECT * FROM order_items WHERE order_id IN (?)', [orderIds]);
      items.forEach(item => {
        if (!itemsMap[item.order_id]) {
          itemsMap[item.order_id] = [];
        }
        itemsMap[item.order_id].push({
          ...item,
          name: item.product_name,
          image: item.image,
          size: item.size,
          color: item.color,
          price: parseFloat(item.price) || 0,
          quantity: parseInt(item.quantity) || 0,
        });
      });
    }

    const mappedOrders = orders.map(o => {
      // Structure the shipping object
      const shipping = {
        name: o.shipping_name,
        email: o.shipping_email,
        phone: o.shipping_phone,
        address: o.shipping_address,
        city: o.shipping_city,
        state: o.shipping_state,
        zip: o.shipping_zip,
        country: o.shipping_country
      };

      return {
        ...o,
        docId: o.id.toString(), // For backward compatibility with frontend
        items: itemsMap[o.id] || [],
        shipping: shipping,
        createdAt: o.created_at,
        date: o.created_at
      };
    });

    res.status(200).json({ success: true, data: mappedOrders });
  } catch (error) {
    console.error('getOrders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const { user_id } = req.user;
    const [orders] = await pool.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [user_id]);
    
    // Fetch items for each order
    const orderIds = orders.map(o => o.id);
    let itemsMap = {};
    if (orderIds.length > 0) {
      const [items] = await pool.query('SELECT * FROM order_items WHERE order_id IN (?)', [orderIds]);
      items.forEach(item => {
        if (!itemsMap[item.order_id]) {
          itemsMap[item.order_id] = [];
        }
        itemsMap[item.order_id].push({
          ...item,
          name: item.product_name,
          image: item.image,
          size: item.size,
          color: item.color,
          price: parseFloat(item.price) || 0,
          quantity: parseInt(item.quantity) || 0,
        });
      });
    }

    const mappedOrders = orders.map(o => {
      // Structure the shipping object
      const shipping = {
        name: o.shipping_name,
        email: o.shipping_email,
        phone: o.shipping_phone,
        address: o.shipping_address,
        city: o.shipping_city,
        state: o.shipping_state,
        zip: o.shipping_zip,
        country: o.shipping_country
      };

      return {
        ...o,
        docId: o.id.toString(), // For backward compatibility with frontend
        items: itemsMap[o.id] || [],
        shipping: shipping,
        createdAt: o.created_at,
        date: o.created_at
      };
    });

    res.status(200).json({ success: true, data: mappedOrders });
  } catch (error) {
    console.error('getUserOrders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user orders' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, docketNumber, qname, cancelReasons, cancelledAt, statusUpdatedAt } = req.body;

    let updateFields = [];
    let queryParams = [];

    if (status) {
      updateFields.push('status = ?');
      queryParams.push(status);
    }
    if (docketNumber !== undefined) {
      updateFields.push('docketNumber = ?');
      queryParams.push(docketNumber);
    }
    if (qname !== undefined) {
      updateFields.push('qname = ?');
      queryParams.push(qname);
    }
    if (cancelReasons !== undefined) {
      updateFields.push('cancelReasons = ?');
      queryParams.push(cancelReasons);
    }
    if (cancelledAt) {
      updateFields.push('cancelledAt = ?');
      queryParams.push(new Date(cancelledAt));
    }
    if (statusUpdatedAt) {
      updateFields.push('statusUpdatedAt = ?');
      queryParams.push(new Date(statusUpdatedAt));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    queryParams.push(id);

    const query = `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`;
    await pool.query(query, queryParams);

    res.status(200).json({ success: true, message: 'Order updated successfully' });
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    const o = orders[0];
    const [rawItems] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
    const items = rawItems.map(item => ({
      ...item,
      name: item.product_name,
      image: item.image,
      size: item.size,
      color: item.color,
      price: parseFloat(item.price) || 0,
      quantity: parseInt(item.quantity) || 0,
    }));

    const shipping = {
      name: o.shipping_name,
      email: o.shipping_email,
      phone: o.shipping_phone,
      address: o.shipping_address,
      city: o.shipping_city,
      state: o.shipping_state,
      zip: o.shipping_zip,
      country: o.shipping_country
    };

    res.status(200).json({ 
      success: true, 
      data: { 
        ...o, 
        docId: o.id.toString(), 
        items, 
        shipping, 
        createdAt: o.created_at, 
        date: o.created_at 
      } 
    });
  } catch (error) {
    console.error('getOrderById error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
