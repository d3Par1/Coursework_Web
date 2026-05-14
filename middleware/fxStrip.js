// middleware/fxStrip.js
// Surfaces current date + a small set of FX rates on every page via the
// masthead strip rendered in layout.ejs. Failures are silent — if the
// ExchangeRate API is down or slow, the strip just hides itself.
const { getPopularRates } = require('../services/currencyService');

const WANT = ['USD', 'EUR', 'GBP'];

module.exports = async function fxStrip(req, res, next) {
  try {
    const rates = await getPopularRates('UAH');
    const byCode = Object.fromEntries(rates.map((r) => [r.code, r]));
    res.locals.fxStrip = {
      date: new Date(),
      rates: WANT.map((code) => ({ code, rate: byCode[code]?.rate })).filter((r) => r.rate),
    };
  } catch {
    // silent — strip is optional
  }
  next();
};
