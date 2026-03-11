const { validationResult } = require('express-validator');

/**
 * Handle express-validator validation results.
 * If errors exist, re-renders the given view with errors and old input.
 * Returns true if errors were found (response already sent), false if no errors.
 */
function handleValidationErrors(req, res, viewName, extraData = {}) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).render(viewName, {
      errors: errors.array(),
      oldInput: req.body,
      ...extraData
    });
    return true; // Errors found, response sent
  }
  return false; // No errors -- caller should proceed
}

module.exports = { handleValidationErrors };
