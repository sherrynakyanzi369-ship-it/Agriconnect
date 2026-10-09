const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const {
  getCart,
  addToCart,
  updateItem,
  removeItem,
  getCheckout,
  postCheckout,
} = require('../controllers/cartController');

router.get('/', isAuthenticated, getCart);
router.post('/add', isAuthenticated, addToCart);
router.post('/remove/:productId', isAuthenticated, removeItem);
router.post('/update/:productId', isAuthenticated, updateItem);
router.get('/checkout', isAuthenticated, getCheckout);
router.post('/checkout', isAuthenticated, postCheckout);

module.exports = router;