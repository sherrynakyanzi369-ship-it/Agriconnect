const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');

const customerId = (req) => req.session.user.id;

async function getCustomerCart(req) {
  return Cart.findOne({ customer: customerId(req) });
}

async function buildLines(items) {
  const productIds = items.map((i) => i.product);
  const products = productIds.length ? await Product.find({ _id: { $in: productIds } }) : [];
  const map = new Map(products.map((p) => [p._id.toString(), p]));
  return items.map((item) => {
    const product = map.get(item.product.toString());
    return {
      productId: item.product,
      name: product ? product.name : 'Unavailable',
      unit: product ? product.unit : '',
      image: product ? product.image : 'uploads/default-product.png',
      price: item.price,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
      available: product ? product.quantityAvailable : 0,
      outOfStock: !product || product.quantityAvailable < 1,
    };
  });
}

function serializeCart(cart) {
  return {
    count: cart.items.reduce((n, i) => n + i.quantity, 0),
    cartTotal: cart.totalPrice,
    lines: cart.items.map((i) => ({
      productId: i.product.toString(),
      quantity: i.quantity,
      totalPrice: i.totalPrice,
    })),
  };
}

exports.getCart = async (req, res, next) => {
  try {
    const cart = await getCustomerCart(req);
    const items = cart ? cart.items : [];
    const lines = await buildLines(items);
    res.render('cart/index', {
      title: 'Your Cart',
      cart,
      lines,
      empty: !items.length,
    });
  } catch (err) {
    next(err);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const wantsJson = req.xhr || req.body._format === 'json';
    const fail = (status, message, url) => {
      if (wantsJson) return res.status(status).json({ ok: false, message });
      req.flash('error_msg', message);
      return res.redirect(url);
    };

    const product = await Product.findById(req.body.product);
    if (!product) {
      return fail(404, 'Product not found', '/products');
    }

    const qty = Math.max(1, parseInt(req.body.quantity, 10) || 1);
    if (product.quantityAvailable < qty) {
      return fail(400, `Only ${product.quantityAvailable} ${product.unit} of ${product.name} available`, `/products/${product._id}`);
    }

    let cart = await getCustomerCart(req);
    if (!cart) cart = new Cart({ customer: customerId(req) });

    const existing = cart.items.find((i) => i.product.toString() === product._id.toString());
    const combined = (existing ? existing.quantity : 0) + qty;
    if (combined > product.quantityAvailable) {
      return fail(
        400,
        `You already have ${existing.quantity} ${product.unit} of ${product.name} in your cart. Only ${product.quantityAvailable} is available.`,
        `/products/${product._id}`
      );
    }

    cart.addItem(product._id, qty, product.price);
    await cart.save();

    const count = cart.items.reduce((n, i) => n + i.quantity, 0);
    if (wantsJson) {
      return res.json({ ok: true, count, message: `${qty}${product.unit ? ' ' + product.unit : ''} of ${product.name} added to cart` });
    }
    req.flash('success_msg', `${qty}${product.unit ? ' ' + product.unit : ''} of ${product.name} added to cart`);
    res.redirect('/cart');
  } catch (err) {
    next(err);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    const cart = await getCustomerCart(req);
    const productId = req.params.productId;
    const wantsJson = req.xhr || req.body._format === 'json';

    if (!cart) {
      if (wantsJson) return res.status(404).json({ ok: false, message: 'Cart not found' });
      return res.redirect('/cart');
    }

    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item) {
      if (wantsJson) return res.status(404).json({ ok: false, message: 'Item not found in cart' });
      req.flash('error_msg', 'Item not found in your cart');
      return res.redirect('/cart');
    }

    const qty = parseInt(req.body.quantity, 10);
    let message = null;

    if (!qty || qty < 1) {
      cart.removeItem(productId);
      await cart.save();
    } else {
      const product = await Product.findById(productId).select('name quantityAvailable unit');
      if (!product) {
        cart.removeItem(productId);
        await cart.save();
      } else if (qty > product.quantityAvailable) {
        message = `Only ${product.quantityAvailable} ${product.unit} available for ${product.name}`;
        item.quantity = product.quantityAvailable;
        await cart.save();
      } else {
        item.quantity = qty;
        await cart.save();
      }
    }

    if (wantsJson) {
      const data = serializeCart(cart);
      data.ok = true;
      if (message) data.message = message;
      const lines = await buildLines(cart.items);
      data.lines = lines.map((l) => ({
        productId: l.productId.toString(),
        quantity: l.quantity,
        totalPrice: l.totalPrice,
        name: l.name,
        unavailable: l.outOfStock,
      }));
      return res.json(data);
    }

    if (message) req.flash('error_msg', message);
    res.redirect('/cart');
  } catch (err) {
    next(err);
  }
};

exports.removeItem = async (req, res, next) => {
  try {
    const cart = await getCustomerCart(req);
    const productId = req.params.productId;
    const wantsJson = req.xhr || (req.body && req.body._format === 'json');

    if (!cart) {
      if (wantsJson) return res.status(404).json({ ok: false, message: 'Cart not found' });
      return res.redirect('/cart');
    }

    cart.removeItem(productId);
    await cart.save();

    if (wantsJson) {
      const data = serializeCart(cart);
      data.ok = true;
      return res.json(data);
    }

    req.flash('success_msg', 'Item removed from cart');
    res.redirect('/cart');
  } catch (err) {
    next(err);
  }
};

exports.getCheckout = async (req, res, next) => {
  try {
    const cart = await getCustomerCart(req);
    if (!cart || !cart.items.length) {
      req.flash('error_msg', 'Your cart is empty');
      return res.redirect('/cart');
    }
    const lines = await buildLines(cart.items);
    res.render('cart/checkout', { title: 'Checkout', cart, lines });
  } catch (err) {
    next(err);
  }
};

exports.postCheckout = async (req, res, next) => {
  try {
    const cart = await getCustomerCart(req);
    if (!cart || !cart.items.length) {
      req.flash('error_msg', 'Your cart is empty');
      return res.redirect('/cart');
    }

    const shippingAddress = req.body.shippingAddress || {};
    const notes = (req.body.notes || '').trim();
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state) {
      req.flash('error_msg', 'Street, city, and state are required for shipping');
      return res.redirect('/cart/checkout');
    }

    const productIds = cart.items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    for (const item of cart.items) {
      const product = productMap.get(item.product.toString());
      if (!product || product.quantityAvailable < item.quantity) {
        req.flash(
          'error_msg',
          `Only ${product ? product.quantityAvailable : 0} of ${item.name || 'an item'} are available. Please adjust your cart.`
        );
        return res.redirect('/cart');
      }
    }

    const orderItems = cart.items.map((item) => {
      const product = productMap.get(item.product.toString());
      return {
        product: product._id,
        name: product.name,
        unit: product.unit,
        price: product.price,
        quantity: item.quantity,
      };
    });

    const order = await Order.create({
      customer: customerId(req),
      items: orderItems,
      shippingAddress,
      notes,
    });

    for (const item of orderItems) {
      const product = productMap.get(item.product.toString());
      product.quantityAvailable -= item.quantity;
      await product.save();
    }

    cart.items = [];
    await cart.save();

    req.flash('success_msg', 'Order placed successfully');
    res.redirect(`/orders/${order._id}`);
  } catch (err) {
    next(err);
  }
};