const Product = require('../models/Product');
const Category = require('../models/Category');
const FarmerProfile = require('../models/FarmerProfile');
const mongoose = require('mongoose');
const attachProfiles = require('../utils/attachProfiles');

exports.listProducts = async (req, res, next) => {
  try {
    const { q, category, farm, location, min, max } = req.query;
    const filter = {};

    if (q) filter.$text = { $search: q };
    if (category) {
      const cat = await Category.findOne(
        mongoose.isValidObjectId(category) ? { _id: category } : { slug: category }
      );
      if (cat) filter.category = cat._id;
    }
    if (farm) {
      const profile = await FarmerProfile.findById(farm);
      if (profile) filter.farmer = profile.user;
    }
    if (location) {
      const parts = location
        .split(',')
        .map((s) => (s || '').trim())
        .filter(Boolean);
      const profileFilter = {};
      if (parts[0]) profileFilter['location.city'] = parts[0];
      if (parts[1]) profileFilter['location.state'] = parts[1];
      const matches = await FarmerProfile.find(profileFilter);
      filter.farmer = { $in: matches.map((p) => p.user) };
    }
    if (min !== undefined || max !== undefined) {
      filter.price = {};
      if (min !== undefined) filter.price.$gte = Number(min);
      if (max !== undefined) filter.price.$lte = Number(max);
    }

    const [products, profiles, categories] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).populate('farmer', 'name').populate('category', 'name'),
      FarmerProfile.find().select('farmName location'),
      Category.find().sort({ name: 1 }),
    ]);

    await attachProfiles(products);

    const locations = [];
    profiles.forEach((f) => {
      if (f.location && f.location.city && f.location.state) {
        const key = `${f.location.city}, ${f.location.state}`;
        if (!locations.includes(key)) locations.push(key);
      }
    });
    locations.sort();

    res.render('products/list', {
      title: 'Browse Produce',
      products,
      farms: profiles.map((f) => ({ _id: f._id, name: f.farmName, location: f.location })),
      categories,
      locations,
      query: req.query,
    });
  } catch (err) {
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('farmer', 'name').populate('category', 'name');
    if (!product) {
      req.flash('error_msg', 'Product not found');
      return res.redirect('/products');
    }
    await attachProfiles([product]);
    res.render('products/show', { title: product.name, product });
  } catch (err) {
    next(err);
  }
};

exports.getNewProduct = async (req, res, next) => {
  try {
    const profile = await FarmerProfile.findOne({ user: req.session.user.id });
    if (!profile) {
      req.flash('error_msg', 'Create your farm profile before adding products');
      return res.redirect('/farm/create');
    }
    const categories = await Category.find().sort({ name: 1 });
    if (!categories.length) {
      req.flash('error_msg', 'No categories exist yet. Ask an admin to run `npm run seed` first.');
      return res.redirect('/farm/dashboard');
    }
    res.render('farmer/product-form', { title: 'Add Product', product: null, categories, farm: profile });
  } catch (err) {
    next(err);
  }
};

exports.postProduct = async (req, res, next) => {
  try {
    const profile = await FarmerProfile.findOne({ user: req.session.user.id });
    if (!profile) {
      req.flash('error_msg', 'Create your farm profile before adding products');
      return res.redirect('/farm/create');
    }

    const { name, description, category, price, unit, quantityAvailable, harvestDate } = req.body;

    const cat = await Category.findById(category);
    if (!cat) {
      req.flash('error_msg', 'Please choose a valid category');
      return res.redirect('/products/new');
    }

    const image = req.file ? `uploads/${req.file.filename}` : cat.image || 'uploads/default-product.png';

    await Product.create({
      farmer: req.session.user.id,
      category: cat._id,
      name,
      description,
      price,
      unit,
      quantityAvailable,
      harvestDate: harvestDate || undefined,
      image,
    });

    req.flash('success_msg', 'Product listed successfully');
    res.redirect('/farm/dashboard');
  } catch (err) {
    next(err);
  }
};

exports.getEditProduct = async (req, res, next) => {
  try {
    const profile = await FarmerProfile.findOne({ user: req.session.user.id });
    const product = await Product.findById(req.params.id);
    if (!profile || !product || product.farmer.toString() !== req.session.user.id) {
      req.flash('error_msg', 'Product not found');
      return res.redirect('/farm/dashboard');
    }
    const categories = await Category.find().sort({ name: 1 });
    res.render('farmer/product-form', { title: 'Edit Product', product, categories, farm: profile });
  } catch (err) {
    next(err);
  }
};

exports.putProduct = async (req, res, next) => {
  try {
    const profile = await FarmerProfile.findOne({ user: req.session.user.id });
    const product = await Product.findById(req.params.id);
    if (!profile || !product || product.farmer.toString() !== req.session.user.id) {
      req.flash('error_msg', 'Product not found');
      return res.redirect('/farm/dashboard');
    }

    const { name, description, category, price, unit, quantityAvailable, harvestDate } = req.body;
    product.name = name;
    product.description = description;
    product.category = category;
    product.price = price;
    product.unit = unit;
    product.quantityAvailable = quantityAvailable;
    product.harvestDate = harvestDate || undefined;

    if (req.file) product.image = `uploads/${req.file.filename}`;

    await product.save();
    req.flash('success_msg', 'Product updated successfully');
    res.redirect('/farm/dashboard');
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const profile = await FarmerProfile.findOne({ user: req.session.user.id });
    const product = await Product.findById(req.params.id);
    if (!profile || !product || product.farmer.toString() !== req.session.user.id) {
      req.flash('error_msg', 'Product not found');
      return res.redirect('/farm/dashboard');
    }
    await product.deleteOne();
    req.flash('success_msg', 'Product removed');
    res.redirect('/farm/dashboard');
  } catch (err) {
    next(err);
  }
};