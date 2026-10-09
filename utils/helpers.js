module.exports = {
  currency(value) {
    return Number(value || 0).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  },
  image(path, fallback = 'uploads/default-product.png') {
    return path || fallback;
  },
  imageUrl(value, fallback = 'uploads/default-product.png') {
    const src = value || fallback;
    return /^https?:\/\//i.test(src) ? src : `/${src}`;
  },
};