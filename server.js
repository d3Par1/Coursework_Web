// server.js
require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database (runs schema on first start)
require('./config/database');

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session + Flash
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false
}));
app.use(flash());

// Make flash messages available in all views
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Auth middleware
const { setCurrentUser, requireAuth } = require('./middleware/auth');
app.use(setCurrentUser);

// Routes (auth first, then protected routes)
app.use('/auth', require('./routes/auth'));
app.use('/', requireAuth, require('./routes/dashboard'));
app.use('/accounts', requireAuth, require('./routes/accounts'));
app.use('/transactions', requireAuth, require('./routes/transactions'));
app.use('/categories', requireAuth, require('./routes/categories'));
app.use('/budgets', requireAuth, require('./routes/budgets'));
app.use('/api/currency', requireAuth, require('./routes/currency'));

// 404 handler
app.use((req, res) => {
  res.status(404).render('errors/404');
});

// Start server only when run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
