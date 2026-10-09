const User = require('../models/User');

exports.getLogin = (req, res) => {
  res.render('auth/login', { title: 'Log In' });
};

exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/auth/login');
    }

    const roleLabel = user.role;
    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: roleLabel,
    };

    req.flash('success_msg', `Welcome back, ${user.name}!`);
    res.redirect(roleLabel === 'FARMER' ? '/farm/dashboard' : '/');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Something went wrong while logging in');
    res.redirect('/auth/login');
  }
};

exports.getRegister = (req, res) => {
  res.render('auth/register', { title: 'Create Account' });
};

exports.postRegister = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role, phone } = req.body;
    const address = {
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zip,
    };

    if (!name || !email || !password || !confirmPassword) {
      req.flash('error_msg', 'All fields are required');
      return res.redirect('/auth/register');
    }
    if (password !== confirmPassword) {
      req.flash('error_msg', 'Passwords do not match');
      return res.redirect('/auth/register');
    }

    const existing = await User.findOne({ email });
    if (existing) {
      req.flash('error_msg', 'An account with that email already exists');
      return res.redirect('/auth/register');
    }

    const user = await User.create({ name, email, password, phone, address });
    if (role === 'FARMER') {
      user.role = 'FARMER';
      await user.save();
    }
    user.password = undefined;

    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    req.flash('success_msg', 'Account created successfully');
    res.redirect(user.role === 'FARMER' ? '/farm/dashboard' : '/');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Registration failed. Please try again.');
    res.redirect('/auth/register');
  }
};

exports.logout = (req, res) => {
  req.session.regenerate(() => {
    req.flash('success_msg', 'You have been logged out. See you on the farm!');
    res.redirect('/');
  });
};