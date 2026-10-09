module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  console.error(err.stack);
  res.status(status).render('error', {
    title: `${status} Error`,
    status,
    message: err.message || 'Something went wrong on the server.',
  });
};