const express = require('express');
const router = express.Router();
const razorpayController = require('../controllers/razorpayController');

router.get('/', razorpayController.getAllKeys);
router.post('/', razorpayController.addKey);
router.put('/:id', razorpayController.updateKey);
router.delete('/:id', razorpayController.deleteKey);

module.exports = router;
