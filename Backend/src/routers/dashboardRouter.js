const express = require('express');
const router = express.Router();
const { getDashboardStats, getHeaderStats } = require('../controllers/dashboardController');

// GET /api/dashboard/stats
router.get('/stats', getDashboardStats);

// GET /api/dashboard/header
router.get('/header', getHeaderStats);

module.exports = router;
