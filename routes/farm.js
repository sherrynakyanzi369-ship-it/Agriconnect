const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getCreateFarm,
  postCreateFarm,
  getEditFarm,
  putFarm,
  getFarmPublic,
} = require('../controllers/farmController');
const { isAuthenticated, isFarmer, ensureRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/create', isAuthenticated, ensureRole('FARMER', 'CUSTOMER'), getCreateFarm);
router.post(
  '/create',
  isAuthenticated,
  ensureRole('FARMER', 'CUSTOMER'),
  upload.single('profileImage'),
  postCreateFarm
);
router.get('/edit', isFarmer, getEditFarm);
router.put('/edit', isFarmer, upload.single('profileImage'), putFarm);
router.get('/dashboard', isFarmer, getDashboard);
router.get('/:id', getFarmPublic);

module.exports = router;