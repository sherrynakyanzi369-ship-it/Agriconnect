const Order = require('../models/Order');
const Product = require('../models/Product');

async function isOrderSupplier(order, userId) {
  const productIds = order.items.map((i) => i.product);
  if (!productIds.length) return false;
  const products = await Product.find({ _id: { $in: productIds } }).select('farmer');
  return products.some((p) => p.farmer.toString() === userId);
}

exports.checkout = async (req, res, next) => {
  try {
    const { items, shippingAddress, notes } = req.body;

    if (!items || !items.length) {
      req.flash('error_msg', 'Your order is empty');
      return res.redirect('/products');
    }

    const productIds = items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: productIds } });
    if (products.length !== productIds.length) {
      req.flash('error_msg', 'One or more products are no longer available');
      return res.redirect('/products');
    }

    const orderItems = items.map((raw) => {
      const product = products.find((p) => p._id.toString() === raw.product);
      const quantity = Number(raw.quantity);
      if (product.quantityAvailable < quantity) {
        throw Object.assign(new Error('Sorry, not enough stock available'), {
          status: 400,
          flash: `${product.name} only has ${product.quantityAvailable} in stock`,
        });
      }
      return {
        product: product._id,
        name: product.name,
        unit: product.unit,
        price: product.price,
        quantity,
      };
    });

    if (
      !shippingAddress ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.state
    ) {
      req.flash('error_msg', 'A shipping address is required');
      return res.redirect('back');
    }

    const order = await Order.create({
      customer: req.session.user.id,
      items: orderItems,
      shippingAddress,
      notes,
    });

    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantityAvailable: -item.quantity },
      });
    }

    req.flash('success_msg', 'Order placed successfully');
    res.redirect(`/orders/${order._id}`);
  } catch (err) {
    if (err.flash) {
      req.flash('error_msg', err.flash);
      return res.redirect('back');
    }
    next(err);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.session.user.id }).sort({ createdAt: -1 });
    res.render('orders/list', { title: 'My Orders', orders });
  } catch (err) {
    next(err);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer', 'name email');
    if (!order) {
      req.flash('error_msg', 'Order not found');
      return res.redirect('/orders');
    }
    const isSupplier = await isOrderSupplier(order, req.session.user.id);
    const isOwner =
      order.customer._id.toString() === req.session.user.id ||
      req.session.user.role === 'ADMIN' ||
      isSupplier;
    if (!isOwner) {
      req.flash('error_msg', 'You are not authorized to view this order');
      return res.redirect('/orders');
    }
    res.render('orders/show', { title: 'Order Details', order, canManage: isOwner });
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      req.flash('error_msg', 'Order not found');
      return res.redirect('/orders');
    }
    const allowed =
      req.session.user.role === 'ADMIN' ||
      order.customer.toString() === req.session.user.id ||
      (await isOrderSupplier(order, req.session.user.id));
    if (!allowed) {
      req.flash('error_msg', 'You are not authorized to update this order');
      return res.redirect(`/orders/${order._id}`);
    }
    order.status = status;
    await order.save();
    req.flash('success_msg', 'Order status updated');
    res.redirect(`/orders/${order._id}`);
  } catch (err) {
    next(err);
  }
};