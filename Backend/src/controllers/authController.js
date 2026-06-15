const { v4: uuidv4 } = require('uuid');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Register new user
const register = async (req, res) => {
  try {
    const { username, email, phone, password, confirmPassword } = req.body;

    // Validation
    if (!username || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const connection = await pool.getConnection();

    // Check if user exists
    const [existingUser] = await connection.query(
      'SELECT email FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      connection.release();
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);
    const user_id = uuidv4();

    // Insert user
    await connection.query(
      'INSERT INTO users (user_id, username, email, phone, password, status) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, username, email, phone, hashedPassword, 'active']
    );

    connection.release();

    // Generate JWT token
    const token = jwt.sign(
      { user_id, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '9d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: { user_id, username, email, phone },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const connection = await pool.getConnection();

    // Find user
    const [users] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const passwordMatch = await bcryptjs.compare(password, user.password);

    if (!passwordMatch) {
      connection.release();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check user status
    if (user.status !== 'active') {
      connection.release();
      return res.status(403).json({ message: 'User account is inactive' });
    }

    connection.release();

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '9d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        phone: user.phone
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const { user_id } = req.user;

    const connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT user_id, username, email, phone, status, created_at FROM users WHERE user_id = ?',
      [user_id]
    );

    connection.release();

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Google Login
const axios = require('axios');

const googleLogin = async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) {
      return res.status(400).json({ message: 'Access token is required' });
    }

    // Fetch user info from Google
    const googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    const { email, name } = googleRes.data;

    const connection = await pool.getConnection();

    // Check if user exists
    const [users] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    let user;

    if (users.length === 0) {
      // Create new user with random password
      const randomPassword = uuidv4() + Math.random().toString(36).slice(-8);
      const hashedPassword = await bcryptjs.hash(randomPassword, 10);
      const user_id = uuidv4();

      await connection.query(
        'INSERT INTO users (user_id, username, email, phone, password, status) VALUES (?, ?, ?, ?, ?, ?)',
        [user_id, name, email, 'Not provided', hashedPassword, 'active']
      );

      user = { user_id, username: name, email, phone: 'Not provided' };
    } else {
      user = users[0];
      if (user.status !== 'active') {
        connection.release();
        return res.status(403).json({ message: 'User account is inactive' });
      }
    }

    connection.release();

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '9d' }
    );

    res.json({
      message: 'Google login successful',
      user: {
        user_id: user.user_id,
        username: user.username || user.name,
        email: user.email,
        phone: user.phone
      },
      token
    });
  } catch (error) {
    console.error('Google Login error:', error);
    res.status(500).json({ message: 'Google authentication failed', error: error.message });
  }
};

module.exports = { register, login, getProfile, googleLogin };
