const pool = require('../config/db');

exports.getDashboardStats = async (req, res) => {
  try {
    // We'll run all these independent queries concurrently using Promise.all
    const [
      [usersResult],
      [productsResult],
      [ordersResult],
      [orderStatusResult],
      [monthlyStatsResult],
      [topProductsResult],
      [categoriesResult],
      [liveStockResult],
      [todayOrdersResult]
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS count FROM users`),
      pool.query(`SELECT COUNT(*) AS count FROM products`),
      pool.query(`SELECT SUM(total) AS revenue FROM orders`),
      pool.query(`SELECT status, COUNT(*) AS count FROM orders WHERE status IN ('Delivered', 'Cancelled') GROUP BY status`),
      pool.query(`
        SELECT 
          DATE_FORMAT(created_at, '%b') AS month,
          SUM(total) AS revenue,
          COUNT(*) AS count 
        FROM orders 
        GROUP BY DATE_FORMAT(created_at, '%b'), MONTH(created_at)
        ORDER BY MONTH(created_at)
      `),
      pool.query(`
        SELECT 
          product_name,
          DATE_FORMAT(orders.created_at, '%b') AS month,
          SUM(quantity) AS qty
        FROM order_items
        JOIN orders ON order_items.order_id = orders.id
        GROUP BY product_name, DATE_FORMAT(orders.created_at, '%b'), MONTH(orders.created_at)
      `),
      pool.query(`SELECT category, COUNT(*) AS count FROM products GROUP BY category`),
      pool.query(`SELECT productId, name, stock, productType, count, colors, category FROM products`),
      pool.query(`SELECT * FROM orders WHERE DATE(created_at) = CURDATE() ORDER BY created_at DESC`)
    ]);

    // Parse scalar values
    const usersCount = usersResult[0]?.count || 0;
    const productsCount = productsResult[0]?.count || 0;
    const totalRevenue = ordersResult[0]?.revenue || 0;
    
    // Parse order statuses
    let deliveryOrders = 0;
    let cancelledOrders = 0;
    orderStatusResult.forEach(row => {
      if (row.status === 'Delivered') deliveryOrders = row.count;
      if (row.status === 'Cancelled') cancelledOrders = row.count;
    });

    // Helper: compute true total stock for a product
    const computeTotalStock = (row) => {
      try {
        const colors = typeof row.colors === 'string' ? JSON.parse(row.colors) : row.colors;
        if (Array.isArray(colors) && colors.length > 0) {
          return colors.reduce((total, c) => {
            if (c?.stock && typeof c.stock === 'object') {
              return total + Object.values(c.stock).reduce((sum, v) => sum + (Number(v) || 0), 0);
            }
            return total + (Number(c?.stock) || 0);
          }, 0);
        }
      } catch (e) {
        // fallback to stock column
      }
      return Number(row.stock) || 0;
    };

    // Parse low stock
    let lowStockCount = 0;
    const liveStocks = liveStockResult.map(row => {
      const totalStock = computeTotalStock(row);
      if (totalStock < 3) lowStockCount++;
      return { name: row.name, stock: totalStock };
    }).sort((a, b) => a.stock - b.stock).slice(0, 20);

    // Parse monthly stats
    const monthlyRevenue = [];
    const monthlyOrders = [];
    const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize months to have continuous chart data
    const existingMonths = new Set(monthlyStatsResult.map(row => row.month));
    allMonths.forEach(m => {
      if (existingMonths.has(m) || m === new Date().toLocaleString('default', { month: 'short' })) {
        const row = monthlyStatsResult.find(r => r.month === m);
        monthlyRevenue.push({ month: m, amount: row ? row.revenue : 0 });
        monthlyOrders.push({ month: m, count: row ? row.count : 0 });
      }
    });

    // Parse top products (Transform into datasets: {label, data: []})
    const productDataMap = {};
    topProductsResult.forEach(row => {
      if (!productDataMap[row.product_name]) productDataMap[row.product_name] = {};
      productDataMap[row.product_name][row.month] = row.qty;
    });

    // Get overall top 3
    const topProductsOverall = Object.keys(productDataMap).map(name => {
      const totalQty = Object.values(productDataMap[name]).reduce((a, b) => a + b, 0);
      return { name, totalQty };
    }).sort((a, b) => b.totalQty - a.totalQty).slice(0, 5); // Take top 5 for chart

    const topProducts = topProductsOverall.map(p => {
      return {
        label: p.name,
        data: monthlyRevenue.map(m => productDataMap[p.name][m.month] || 0)
      };
    });

    // Parse product categories
    const productCategories = categoriesResult.map(row => ({
      name: row.category || 'Other',
      value: row.count
    }));

    // Today's orders map
    const todayOrders = todayOrdersResult;

    // Send the compiled stats payload
    res.json({
      success: true,
      data: {
        stats: {
          users: usersCount,
          products: productsCount,
          revenue: totalRevenue,
          deliveryOrders,
          cancelledOrders,
          lowStockCount
        },
        monthlyRevenue,
        monthlyOrders,
        topProducts,
        productCategories,
        liveStocks,
        todayOrders
      }
    });

  } catch (err) {
    console.error('getDashboardStats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};

exports.getHeaderStats = async (req, res) => {
  try {
    const [
      [todayOrdersResult],
      [lowStockResult],
      [notificationsResult]
    ] = await Promise.all([
      pool.query(`SELECT id, orderId, total, status, shipping_name, shipping_email, created_at FROM orders WHERE DATE(created_at) = CURDATE() ORDER BY created_at DESC`),
      pool.query(`SELECT productId, name, category, stock, productType, count, colors FROM products`),
      pool.query(`SELECT user_id, username, email, phone, created_at FROM users ORDER BY created_at DESC LIMIT 20`)
    ]);

    // Compute real total stock for each product and filter low stock
    const computeTotalStock = (row) => {
      try {
        const colors = typeof row.colors === 'string' ? JSON.parse(row.colors) : row.colors;
        if (Array.isArray(colors) && colors.length > 0) {
          return colors.reduce((total, c) => {
            if (c?.stock && typeof c.stock === 'object') {
              return total + Object.values(c.stock).reduce((sum, v) => sum + (Number(v) || 0), 0);
            }
            return total + (Number(c?.stock) || 0);
          }, 0);
        }
      } catch (e) {
        // fallback to stock column
      }
      return Number(row.stock) || 0;
    };

    const lowStockFiltered = lowStockResult
      .map(row => ({ productId: row.productId, name: row.name, category: row.category, stock: computeTotalStock(row) }))
      .filter(row => row.stock < 5)
      .sort((a, b) => a.stock - b.stock);

    res.json({
      success: true,
      data: {
        todayOrders: todayOrdersResult,
        lowStockProducts: lowStockFiltered,
        notifications: todayOrdersResult.map(order => ({
          id: order.id,
          type: 'order',
          orderId: order.orderId,
          name: order.shipping_name,
          total: order.total,
          status: order.status,
          time: order.created_at
        }))
      }
    });
  } catch (err) {
    console.error('getHeaderStats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch header stats' });
  }
};
