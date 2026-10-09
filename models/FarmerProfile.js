const mongoose = require('mongoose');

const farmerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A farmer profile must be linked to a user'],
      unique: true,
    },
    farmName: {
      type: String,
      required: [true, 'Farm name is required'],
      trim: true,
      minlength: [2, 'Farm name must be at least 2 characters'],
      maxlength: [100, 'Farm name cannot exceed 100 characters'],
    },
    location: {
      address: { type: String, trim: true, required: [true, 'Street address is required'] },
      city: { type: String, trim: true, required: [true, 'City is required'] },
      state: { type: String, trim: true, required: [true, 'State is required'] },
      zip: { type: String, trim: true },
      coordinates: {
        lat: { type: Number, min: -90, max: 90 },
        lng: { type: Number, min: -180, max: 180 },
      },
    },
    biography: { type: String, trim: true, maxlength: [2000, 'Biography cannot exceed 2000 characters'] },
    contactInfo: {
      phone: {
        type: String,
        trim: true,
        validate: {
          validator(v) {
            return !v || /^\+?[\d\s().-]{7,20}$/.test(v);
          },
          message: 'Please provide a valid contact phone number',
        },
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid contact email'],
      },
    },
    certifications: [{ type: String, trim: true }],
    profileImage: { type: String, default: 'uploads/default-farm.png' },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

farmerProfileSchema.virtual('products', {
  ref: 'Product',
  localField: 'user',
  foreignField: 'farmer',
});

farmerProfileSchema.set('toJSON', { virtuals: true });
farmerProfileSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FarmerProfile', farmerProfileSchema);