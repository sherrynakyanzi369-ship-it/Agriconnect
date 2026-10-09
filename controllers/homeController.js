const Product = require('../models/Product');
const FarmerProfile = require('../models/FarmerProfile');
const Category = require('../models/Category');
const attachProfiles = require('../utils/attachProfiles');

exports.getHome = async (req, res, next) => {
  try {
    const [featuredProducts, farmsCount, productsCount, categories] = await Promise.all([
      Product.find({ status: 'AVAILABLE' })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('farmer', 'name')
        .populate('category', 'name'),
      FarmerProfile.countDocuments({ isVerified: true }),
      Product.countDocuments({ status: 'AVAILABLE' }),
      Category.find().sort({ name: 1 }),
    ]);

    await attachProfiles(featuredProducts);

    const categoryTiles = categories.map((c) => ({
      _id: c._id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: c.image || 'uploads/default-product.png',
    }));

    res.render('home', {
      title: 'AgriConnect',
      featuredProducts,
      farmsCount,
      productsCount,
      categories: categoryTiles,
    });
  } catch (err) {
    next(err);
  }
};