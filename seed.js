require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Category = require('./models/Category');
const User = require('./models/User');
const FarmerProfile = require('./models/FarmerProfile');
const Product = require('./models/Product');

function unsplash(photoId) {
  return `https://images.unsplash.com/photo-${photoId}?w=1200&q=80&auto=format&fit=crop`;
}

const categories = [
  {
    name: 'Vegetables',
    description: 'Fresh vegetables grown on local farms',
    image: unsplash('1631021967261-c57ee4dfa9bb'),
  },
  {
    name: 'Fruits',
    description: 'Seasonal orchard, berry and field fruits',
    image: unsplash('1717625940956-421a56f5bdc8'),
  },
  {
    name: 'Dairy & Poultry',
    description: 'Milk, cheese, butter and farm-fresh eggs',
    image: unsplash('1677476155176-d2595a4eb9e2'),
  },
  {
    name: 'Grains & Tubers',
    description: 'Grains, tubers and staple harvests',
    image: unsplash('1760368104765-f0441f4f4d6c'),
  },
];

const products = [
  // Vegetables
  { category: 'Vegetables', name: 'Sweet Tomatoes', description: 'Sun-ripened tomatoes with a rich, juicy bite. Perfect for salads and sauces.', price: 2.5, unit: 'kg', quantityAvailable: 60, image: unsplash('1741517287380-cf3a9ef75be1') },
  { category: 'Vegetables', name: 'Baby Spinach', description: 'Tender, nutrient-packed leaves harvested young for the freshest salads.', price: 4.2, unit: 'kg', quantityAvailable: 35, image: unsplash('1519995672084-d21490e86ba6') },
  { category: 'Vegetables', name: 'Fresh Carrots', description: 'Crisp, sweet orange carrots, pulled straight from the field.', price: 1.8, unit: 'kg', quantityAvailable: 80, image: unsplash('1590779033100-9f60a05a013d') },
  { category: 'Vegetables', name: 'Bell Peppers', description: 'Colorful, crunchy bell peppers bursting with flavor.', price: 3.1, unit: 'kg', quantityAvailable: 40, image: unsplash('1741515042633-fabad7ce2c57') },
  { category: 'Vegetables', name: 'Crisp Lettuce', description: 'Cool, crunchy heads of lettuce — ideal for fresh garden salads.', price: 1.5, unit: 'each', quantityAvailable: 30, image: unsplash('1450893979860-22a2c0a0518f') },
  { category: 'Vegetables', name: 'Red Onions', description: 'Sweet, mild red onions with a tender, flavorful flesh.', price: 1.4, unit: 'kg', quantityAvailable: 70, image: unsplash('1678568800071-afd8c6ec20a7') },
  // Fruits
  { category: 'Fruits', name: 'Ripe Strawberries', description: 'Sweet, juicy strawberries picked at peak ripeness.', price: 5.5, unit: 'kg', quantityAvailable: 25, image: unsplash('1717625940956-421a56f5bdc8') },
  { category: 'Fruits', name: 'Honeycrisp Apples', description: 'Crisp, honey-sweet apples — a favorite for snacking and baking.', price: 2.9, unit: 'kg', quantityAvailable: 55, image: unsplash('1636958925527-1c98a88458d2') },
  { category: 'Fruits', name: 'Bananas', description: 'Firm, naturally sweet bananas fresh from the grove.', price: 1.2, unit: 'kg', quantityAvailable: 90, image: unsplash('1743007361489-72f5f054d86e') },
  { category: 'Fruits', name: 'Hass Avocados', description: 'Creamy, buttery avocados, perfect for toast and guacamole.', price: 1.9, unit: 'each', quantityAvailable: 45, image: unsplash('1752937314407-5897308639c2') },
  { category: 'Fruits', name: 'Passion Fruit', description: 'Exotic, tangy-sweet passion fruit with an aromatic pulp.', price: 3.6, unit: 'dozen', quantityAvailable: 20, image: unsplash('1747644208239-6cf92b710129') },
  // Dairy & Poultry
  { category: 'Dairy & Poultry', name: 'Farm-fresh Milk', description: 'Creamy, small-batch milk in old-fashioned glass bottles.', price: 3.5, unit: 'each', quantityAvailable: 48, image: unsplash('1772990977842-55d675ce427e') },
  { category: 'Dairy & Poultry', name: 'Free-range Eggs', description: 'Rich, golden-yolked eggs from pasture-raised hens.', price: 4.8, unit: 'dozen', quantityAvailable: 60, image: unsplash('1701252776710-d81bfd7a5806') },
  { category: 'Dairy & Poultry', name: 'Artisan Cheddar', description: 'Aged farmhouse cheddar with a sharp, complex flavor.', price: 6.4, unit: 'kg', quantityAvailable: 20, image: unsplash('1677476155176-d2595a4eb9e2') },
  { category: 'Dairy & Poultry', name: 'Creamy Butter', description: 'Rich, churned butter made fresh every week.', price: 5.2, unit: 'kg', quantityAvailable: 30, image: unsplash('1603596310923-dbb12732f9c7') },
  // Grains & Tubers
  { category: 'Grains & Tubers', name: 'Sweet Corn', description: 'Plump, juicy ears of sweet corn, perfect for grilling.', price: 0.9, unit: 'each', quantityAvailable: 100, image: unsplash('1756220072755-7163d1c177b2') },
  { category: 'Grains & Tubers', name: 'Golden Potatoes', description: 'Versatile, earthy potatoes that roast and mash beautifully.', price: 1.6, unit: 'kg', quantityAvailable: 120, image: unsplash('1760368104765-f0441f4f4d6c') },
  { category: 'Grains & Tubers', name: 'Fresh Cassava', description: 'Starchy, farm-harvested cassava roots — a kitchen staple.', price: 1.1, unit: 'kg', quantityAvailable: 50, image: unsplash('1757281096972-10fd02b0f5ea') },
  { category: 'Grains & Tubers', name: 'Long-grain Rice', description: 'Fluffy, high-quality rice for everyday cooking.', price: 3.4, unit: 'kg', quantityAvailable: 40, image: unsplash('1586201375761-83865001e31c') },
];

const DEMO_FARMER = {
  email: 'farmer@greenvalley.demo',
  password: 'password123',
  name: 'Jordan Green',
  farmName: 'Green Valley Farm',
  location: {
    address: '128 Orchard Lane',
    city: 'Stockton',
    state: 'CA',
    zip: '95205',
  },
  profileImage: unsplash('1560493676-04071c5f467b'),
};

async function seed() {
  await connectDB();

  let createdCategories = 0;
  let updatedCategories = 0;
  const keptNames = categories.map((c) => c.name);
  const removedCategories = await Category.deleteMany({ name: { $nin: keptNames } });
  if (removedCategories.deletedCount) {
    console.log(`Removed ${removedCategories.deletedCount} categories not in the new set.`);
  }

  for (const c of categories) {
    const existing = await Category.findOne({ name: c.name });
    if (!existing) {
      await Category.create(c);
      createdCategories += 1;
    } else {
      existing.description = c.description;
      existing.image = c.image;
      await existing.save();
      updatedCategories += 1;
    }
  }
  console.log(`Categories: ${createdCategories} created, ${updatedCategories} updated.`);

  let farmer = await User.findOne({ email: DEMO_FARMER.email });
  if (!farmer) {
    farmer = await User.create({
      name: DEMO_FARMER.name,
      email: DEMO_FARMER.email,
      password: DEMO_FARMER.password,
      role: 'FARMER',
    });
    console.log(`Demo farmer user created: ${DEMO_FARMER.email}`);
  }

  let profile = await FarmerProfile.findOne({ user: farmer._id });
  if (!profile) {
    profile = await FarmerProfile.create({
      user: farmer._id,
      farmName: DEMO_FARMER.farmName,
      location: DEMO_FARMER.location,
      profileImage: DEMO_FARMER.profileImage,
      biography:
        'Third-generation family farm growing fresh produce, raising dairy cattle and keeping the pantry full with staple grains and tubers. Deliveries to your door every week.',
      isVerified: true,
    });
    console.log('Demo farmer profile created: Green Valley Farm');
  }

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (!existingAdmin) {
      await User.create({
        name: process.env.ADMIN_NAME || 'Site Admin',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: 'ADMIN',
      });
      console.log(`Admin user created: ${process.env.ADMIN_EMAIL}`);
    } else {
      console.log('Admin user already exists, skipping.');
    }
  } else {
    console.log('ADMIN_EMAIL / ADMIN_PASSWORD not set - skipping admin creation.');
  }

  await Product.deleteMany({});
  const categoryByName = {};
  (await Category.find()).forEach((c) => {
    categoryByName[c.name] = c;
  });

  const day = 24 * 60 * 60 * 1000;
  let createdProducts = 0;
  for (const p of products) {
    const cat = categoryByName[p.category];
    await Product.create({
      farmer: farmer._id,
      category: cat._id,
      name: p.name,
      description: p.description,
      price: p.price,
      unit: p.unit,
      quantityAvailable: p.quantityAvailable,
      harvestDate: new Date(Date.now() - (2 + createdProducts) * day),
      image: p.image,
    });
    createdProducts += 1;
  }
  console.log(`Products: ${createdProducts} sample products listed.`);

  await mongoose.disconnect();
  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});