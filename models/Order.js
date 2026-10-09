const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'An order item must reference a product'],
  },
  name: { type: String, required: [true, 'Item name is required'], trim: true },
  unit: { type: String, required: [true, 'Item unit is required'], trim: true },
  price: {
    type: Number,
    required: [true, 'Item price is required'],
    min: [0, 'Price cannot be negative'],
  },
  quantity: {
    type: Number,
    required: [true, 'Item quantity is required'],
    min: [1, 'Quantity must be at least 1'],
  },
});

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Order must be linked to a customer'],
      index: true,
    },
    items: { type: [orderItemSchema], required: [true, 'Order must contain at least one item'] },
    totalPrice: { type: Number, required: true, min: [0, 'Total price cannot be negative'] },
    shippingAddress: {
      street: { type: String, required: [true, 'Shipping street address is required'], trim: true },
      city: { type: String, required: [true, 'Shipping city is required'], trim: true },
      state: { type: String, required: [true, 'Shipping state is required'], trim: true },
      zip: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'DELIVERED'],
      default: 'PENDING',
      required: true,
    },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

orderSchema.pre('validate', function (next) {
  this.totalPrice = Number(
    this.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
  );
  next();
});

module.exports = mongoose.model('Order', orderSchema);