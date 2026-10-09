const FarmerProfile = require('../models/FarmerProfile');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

exports.getDashboard = async (req, res, next) => {
  try {
    const farmerId = req.session.user.id;
    const [profile, products] = await Promise.all([
      FarmerProfile.findOne({ user: farmerId }),
      Product.find({ farmer: farmerId })
        .sort({ createdAt: -1 })
        .populate('category', 'name'),
    ]);

    if (!profile) {
      req.flash('error_msg', 'You need to create a farm profile first');
      return res.redirect('/farm/create');
    }

    const productIds = products.map((p) => p._id);
    const orders = productIds.length
      ? await Order.find({ 'items.product': { $in: productIds } })
          .sort({ createdAt: -1 })
          .populate('customer', 'name email phone')
      : [];

    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.quantityAvailable, 0);
    const totalOrders = orders.length;
    const needRestock = products.filter((p) => p.quantityAvailable <= 5).length;

    res.render('farmer/dashboard', {
      title: 'AgriConnect - Farmer Dashboard',
      farm: profile,
      products,
      orders,
      totalProducts,
      totalStock,
      totalOrders,
      needRestock,
    });
  } catch (err) {
    next(err);
  }
};

exports.getCreateFarm = (req, res) => {
  res.render('farmer/create-farm', { title: 'Create Your Farm', farm: null });
};

exports.postCreateFarm = async (req, res, next) => {
  try {
    const { farmName, biography, address, city, state, zip, phone, email, certifications } = req.body;

    if (!farmName || !address || !city || !state) {
      req.flash('error_msg', 'Farm name, address, city, and state are required');
      return res.redirect('/farm/create');
    }

    const existing = await FarmerProfile.findOne({ user: req.session.user.id });
    if (existing) {
      req.flash('success_msg', 'You already have a farm profile. You can edit it instead.');
      return res.redirect('/farm/dashboard');
    }

    await FarmerProfile.create({
      user: req.session.user.id,
      farmName,
      biography,
      location: { address, city, state, zip },
      contactInfo: { phone, email },
      certifications: certifications ? [].concat(certifications) : [],
      profileImage: req.file ? `uploads/${req.file.filename}` : undefined,
    });

    await User.findByIdAndUpdate(req.session.user.id, { role: 'FARMER' }, { new: true });
    req.session.user.role = 'FARMER';

    req.flash('success_msg', 'Farm profile created successfully');
    res.redirect('/farm/dashboard');
  } catch (err) {
    next(err);
  }
};

exports.getEditFarm = async (req, res, next) => {
  try {
    const profile = await FarmerProfile.findOne({ user: req.session.user.id });
    if (!profile) {
      req.flash('error_msg', 'Farm profile not found');
      return res.redirect('/farm/create');
    }
    res.render('farmer/create-farm', { title: 'Edit Your Farm', farm: profile });
  } catch (err) {
    next(err);
  }
};

exports.putFarm = async (req, res, next) => {
  try {
    const profile = await FarmerProfile.findOne({ user: req.session.user.id });
    if (!profile) {
      req.flash('error_msg', 'Farm profile not found');
      return res.redirect('/farm/create');
    }

    const { farmName, biography, address, city, state, zip, phone, email, certifications } = req.body;
    profile.farmName = farmName || profile.farmName;
    profile.biography = biography;
    profile.location = { address, city, state, zip };
    profile.contactInfo = { phone, email };
    profile.certifications = certifications ? [].concat(certifications) : [];
    if (req.file) profile.profileImage = `uploads/${req.file.filename}`;

    await profile.save();
    req.flash('success_msg', 'Farm profile updated successfully');
    res.redirect('/farm/dashboard');
  } catch (err) {
    next(err);
  }
};

exports.getFarmPublic = async (req, res, next) => {
  try {
    const profile = await FarmerProfile.findById(req.params.id).populate('user', 'name email phone');
    if (!profile) {
      req.flash('error_msg', 'Farm not found');
      return res.redirect('/');
    }
    const products = await Product.find({ farmer: profile.user, status: 'AVAILABLE' })
      .sort({ createdAt: -1 })
      .populate('category', 'name');
    res.render('farm-public', { title: profile.farmName, farm: profile, products });
  } catch (err) {
    next(err);
  }
};