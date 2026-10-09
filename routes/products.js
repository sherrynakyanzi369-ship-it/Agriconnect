const express = require('express');
const router = express.Router();
const {
  listProducts,
  getProduct,
  getNewProduct,
  postProduct,
  getEditProduct,
  putProduct,
  deleteProduct,
} = require('../controllers/productController');
const { isFarmer } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', listProducts);
router.get('/new', isFarmer, getNewProduct);
router.post('/', isFarmer, upload.single('image'), postProduct);
router.get('/:id', getProduct);
router.get('/:id/edit', isFarmer, getEditProduct);
router.put('/:id', isFarmer, upload.single('image'), putProduct);
router.delete('/:id', isFarmer, deleteProduct);

module.exports = router;