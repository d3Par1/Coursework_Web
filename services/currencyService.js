// services/currencyService.js
// Fetches live exchange rates from open.er-api.com (no API key required).
// Caches the result for 1 hour to avoid hammering the upstream service.

const API_URL = 'https://open.er-api.com/v6/latest/';
const CACHE_TTL_MS = 60 * 60 * 1000;

const cache = new Map();

async function fetchRates(base = 'UAH') {
  const key = base.toUpperCase();
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.fetchedAt) < CACHE_TTL_MS) {
    return cached.data;
  }

  const res = await fetch(API_URL + key);
  if (!res.ok) {
    throw new Error(`ExchangeRate API responded with ${res.status}`);
  }
  const json = await res.json();
  if (json.result !== 'success') {
    throw new Error(`ExchangeRate API error: ${json['error-type'] || 'unknown'}`);
  }

  const data = {
    base: json.base_code,
    rates: json.rates,
    lastUpdated: json.time_last_update_utc,
  };
  cache.set(key, { data, fetchedAt: Date.now() });
  return data;
}

async function convert(amount, from, to) {
  if (from === to) return amount;
  const rates = await fetchRates(from);
  const rate = rates.rates[to.toUpperCase()];
  if (!rate) throw new Error(`Unknown currency: ${to}`);
  return amount * rate;
}

async function getPopularRates(base = 'UAH') {
  const data = await fetchRates(base);
  const popular = ['USD', 'EUR', 'PLN', 'GBP'];
  return popular
    .filter(code => code !== base.toUpperCase() && data.rates[code])
    .map(code => ({
      code,
      rate: data.rates[code],
      inverse: 1 / data.rates[code],
    }));
}

module.exports = { fetchRates, convert, getPopularRates };
