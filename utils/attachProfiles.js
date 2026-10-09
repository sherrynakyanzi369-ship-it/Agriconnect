const FarmerProfile = require('../models/FarmerProfile');

async function attachProfiles(products) {
  const farmerIds = [
    ...new Set(
      products
        .map((p) => (p.farmer && p.farmer._id ? p.farmer._id.toString() : null))
        .filter(Boolean)
    ),
  ];
  if (!farmerIds.length) return;
  const profiles = await FarmerProfile.find({ user: { $in: farmerIds } });
  const map = new Map(profiles.map((pr) => [pr.user.toString(), pr]));
  products.forEach((p) => {
    if (p.farmer && p.farmer._id) p.profile = map.get(p.farmer._id.toString()) || null;
  });
}

module.exports = attachProfiles;