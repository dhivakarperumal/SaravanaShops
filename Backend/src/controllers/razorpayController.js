const pool = require('../config/db');

// Get all keys
exports.getAllKeys = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM razorpay_keys ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching razorpay keys:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add new key
exports.addKey = async (req, res) => {
  try {
    const { name, key } = req.body;
    if (!name || !key) {
      return res.status(400).json({ message: 'Name and key are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO razorpay_keys (name, key_id) VALUES (?, ?)',
      [name, key]
    );

    res.status(201).json({ id: result.insertId, name, key_id: key });
  } catch (error) {
    console.error('Error adding razorpay key:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update key
exports.updateKey = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, key } = req.body;
    
    if (!name || !key) {
      return res.status(400).json({ message: 'Name and key are required' });
    }

    const [result] = await pool.query(
      'UPDATE razorpay_keys SET name = ?, key_id = ? WHERE id = ?',
      [name, key, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Key not found' });
    }

    res.json({ message: 'Key updated successfully' });
  } catch (error) {
    console.error('Error updating razorpay key:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete key
exports.deleteKey = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM razorpay_keys WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Key not found' });
    }

    res.json({ message: 'Key deleted successfully' });
  } catch (error) {
    console.error('Error deleting razorpay key:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
