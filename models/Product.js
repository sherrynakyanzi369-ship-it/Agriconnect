const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Product must be linked to a farmer'],
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000 },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0.01, 'Price must be at least 0.01'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      enum: ['kg', 'lb', 'crate', 'bunch', 'each', 'dozen', 'bag', 'bushel'],
      default: 'kg',
    },
    quantityAvailable: {
      type: Number,
      required: [true, 'Quantity available is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    harvestDate: { type: Date },
    image: { type: String, default: 'uploads/default-product.png' },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OUT_OF_STOCK'],
      default: 'AVAILABLE',
      required: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });

productSchema.pre('validate', function (next) {
  if (typeof this.price === 'number') this.price = Number(this.price.toFixed(2));
  next();
});

productSchema.pre('save', function (next) {
  this.status = this.quantityAvailable > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK';
  next();
});

module.exports = mongoose.model('Product', productSchema);