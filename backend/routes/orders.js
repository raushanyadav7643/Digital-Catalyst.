const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getUserOrders, cancelOrder, deleteOrder } = require('../controllers/orderController');
const { protect, optionalAuth } = require('../middlewares/auth');

router.post('/create', optionalAuth, createOrder);
router.post('/verify', optionalAuth, verifyPayment);
router.get('/myorders', protect, getUserOrders);
router.post('/cancel-order', protect, cancelOrder);
router.delete('/:id', protect, deleteOrder);

module.exports = router;
