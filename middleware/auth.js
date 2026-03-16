// middleware/auth.js — Authentication middleware

/**
 * Set res.locals.currentUser from session data.
 * Available in all EJS templates as `currentUser`.
 */
function setCurrentUser(req, res, next) {
  if (req.session && req.session.userId) {
    res.locals.currentUser = {
      id: req.session.userId,
      name: req.session.userName,
      email: req.session.userEmail
    };
  } else {
    res.locals.currentUser = null;
  }
  next();
}

/**
 * Require authentication. Redirects to login if not authenticated.
 */
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    req.flash('error', 'Please log in to access this page');
    return res.redirect('/auth/login');
  }
  next();
}

module.exports = { setCurrentUser, requireAuth };
