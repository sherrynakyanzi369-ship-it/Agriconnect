const express = require('express');
const router = express.Router();
const {
  getLogin,
  postLogin,
  getRegister,
  postRegister,
  logout,
} = require('../controllers/authController');
const { ensureGuest } = require('../middleware/auth');

router.get('/login', ensureGuest, getLogin);
router.post('/login', postLogin);
router.get('/register', ensureGuest, getRegister);
router.post('/register', postRegister);
router.get('/logout', logout);

module.exports = router;