module.exports = (req, res, next) => {
  res.status(404).render('error', {
    title: 'Not Found',
    status: 404,
    message: 'The page you are looking for does not exist.',
  });
};