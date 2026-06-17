const pool = require('../config/db');
const bcryptjs = require('bcryptjs');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT user_id, username, email, phone, status, role, created_at FROM users ORDER BY created_at DESC'
    );
    connection.release();

    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'DELETE FROM users WHERE user_id = ?',
      [id]
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user status
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'UPDATE users SET status = ? WHERE user_id = ?',
      [status, id]
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user details (e.g. role, phone)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, phone, username } = req.body;

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'UPDATE users SET role = COALESCE(?, role), phone = COALESCE(?, phone), username = COALESCE(?, username) WHERE user_id = ?',
      [role, phone, username, id]
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update current user profile
const updateProfile = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { username, phone } = req.body;

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'UPDATE users SET username = COALESCE(?, username), phone = COALESCE(?, phone) WHERE user_id = ?',
      [username, phone, user_id]
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const connection = await pool.getConnection();
    const [users] = await connection.query('SELECT password FROM users WHERE user_id = ?', [user_id]);

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    const passwordMatch = await bcryptjs.compare(currentPassword, user.password);

    if (!passwordMatch) {
      connection.release();
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    await connection.query('UPDATE users SET password = ? WHERE user_id = ?', [hashedPassword, user_id]);
    
    connection.release();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getAllUsers, deleteUser, updateUserStatus, updateUser, updateProfile, changePassword };
