const express = require('express');
const router = express.Router();
const {
  checkout,
  getMyOrders,
  getOrder,
  updateOrderStatus,
} = require('../controllers/orderController');
const { isAuthenticated } = require('../middleware/auth');

router.post('/', isAuthenticated, checkout);
router.get('/', isAuthenticated, getMyOrders);
router.get('/:id', isAuthenticated, getOrder);
router.put('/:id', isAuthenticated, updateOrderStatus);

module.exports = router;