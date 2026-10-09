const mongoose = require('mongoose');
const cartItemSchema = require('./CartItem');

const cartSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A cart must be linked to a customer'],
      unique: true,
      index: true,
    },
    items: [cartItemSchema],
    totalPrice: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

cartSchema.pre('save', function (next) {
  this.totalPrice = Number(
    this.items.reduce((sum, item) => sum + (item.totalPrice || item.price * item.quantity), 0).toFixed(2)
  );
  next();
});

cartSchema.methods.addItem = function (productId, quantity, price) {
  const existing = this.items.find((i) => i.product.toString() === productId.toString());
  if (existing) existing.quantity += quantity;
  else this.items.push({ product: productId, quantity, price });
  return this;
};

cartSchema.methods.removeItem = function (productId) {
  this.items = this.items.filter((i) => i.product.toString() !== productId.toString());
  return this;
};

module.exports = mongoose.model('Cart', cartSchema);