module.exports = {
  isAuthenticated(req, res, next) {
    if (req.session.user) return next();
    req.flash('error_msg', 'Please log in to continue');
    return res.redirect('/auth/login');
  },

  isFarmer(req, res, next) {
    if (!req.session.user) {
      req.flash('error_msg', 'Please log in to continue');
      return res.redirect('/auth/login');
    }
    if (req.session.user.role === 'FARMER') return next();
    req.flash('error_msg', 'This section is only available to farmers');
    return res.redirect('back');
  },

  isCustomer(req, res, next) {
    if (!req.session.user) {
      req.flash('error_msg', 'Please log in to continue');
      return res.redirect('/auth/login');
    }
    if (req.session.user.role === 'CUSTOMER') return next();
    req.flash('error_msg', 'This section is only available to customers');
    return res.redirect('back');
  },

  ensureGuest(req, res, next) {
    if (!req.session.user) return next();
    return res.redirect('/');
  },

  ensureRole(...roles) {
    return (req, res, next) => {
      if (!req.session.user) {
        req.flash('error_msg', 'Please log in to continue');
        return res.redirect('/auth/login');
      }
      if (roles.includes(req.session.user.role)) return next();
      req.flash('error_msg', 'You do not have permission to access this page');
      return res.redirect('back');
    };
  },
};