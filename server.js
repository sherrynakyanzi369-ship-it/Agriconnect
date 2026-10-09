require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const connectDB = require('./config/db');
const helpers = require('./utils/helpers');
const Cart = require('./models/Cart');

const app = express();

connectDB();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
  })
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.h = helpers;
  res.locals.cartCount = 0;
  next();
});

app.use(async (req, res, next) => {
  if (req.session && req.session.user) {
    try {
      const cart = await Cart.findOne({ customer: req.session.user.id });
      if (cart) res.locals.cartCount = cart.items.reduce((n, i) => n + i.quantity, 0);
    } catch (err) {
      console.error('cart count failed:', err.message);
    }
  }
  next();
});

app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/farm', require('./routes/farm'));
app.use('/products', require('./routes/products'));
app.use('/orders', require('./routes/orders'));
app.use('/cart', require('./routes/cart'));

app.use(require('./middleware/notfound'));
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AgriConnect running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});