const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('budgets/index', { title: 'Budgets' });
});

module.exports = router;
