const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('categories/index', { title: 'Categories' });
});

module.exports = router;
