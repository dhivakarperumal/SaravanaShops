const pool = require('../config/db');

// Get all addresses for a user
const getAddresses = async (req, res) => {
  try {
    const { user_id } = req.user;

    const connection = await pool.getConnection();
    const [addresses] = await connection.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );
    connection.release();

    res.json(addresses);
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAddressesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const [addresses] = await pool.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json(addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// Add a new address
const addAddress = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { firstname, lastname, contact, doorNumber, streetName, address, landmark, city, state, pin } = req.body;

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      `INSERT INTO addresses 
      (user_id, firstname, lastname, contact, doorNumber, streetName, address, landmark, city, state, pin) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, firstname, lastname, contact, doorNumber, streetName, address, landmark, city, state, pin]
    );
    connection.release();

    res.status(201).json({ message: 'Address added successfully', id: result.insertId });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update an address
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;
    const { firstname, lastname, contact, doorNumber, streetName, address, landmark, city, state, pin } = req.body;

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      `UPDATE addresses 
      SET firstname=?, lastname=?, contact=?, doorNumber=?, streetName=?, address=?, landmark=?, city=?, state=?, pin=? 
      WHERE id=? AND user_id=?`,
      [firstname, lastname, contact, doorNumber, streetName, address, landmark, city, state, pin, id, user_id]
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Address not found or unauthorized' });
    }

    res.json({ message: 'Address updated successfully' });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete an address
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.user;

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'DELETE FROM addresses WHERE id=? AND user_id=?',
      [id, user_id]
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Address not found or unauthorized' });
    }

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getAddresses, addAddress, updateAddress, deleteAddress };
