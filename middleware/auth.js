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
      email: req.session.userEmail,
      isAdmin: Boolean(req.session.isAdmin),
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

/**
 * Require admin role. Must be combined AFTER requireAuth.
 * Returns 403 instead of redirecting — admin pages aren't user-discoverable.
 */
function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  if (!req.session.isAdmin) {
    return res.status(403).render('errors/403', { title: 'Forbidden' });
  }
  next();
}

module.exports = { setCurrentUser, requireAuth, requireAdmin };
