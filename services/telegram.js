// services/telegram.js
// Verifies Telegram Login Widget payloads.
// https://core.telegram.org/widgets/login#checking-authorization
//
// The widget POSTs (or GETs) the user's profile + hash + auth_date. The hash is
// HMAC-SHA256 of all other fields, sorted alphabetically and joined by \n,
// keyed by SHA-256(bot_token). We recompute and compare in constant time.
const crypto = require('crypto');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const telegramEnabled = Boolean(TELEGRAM_BOT_TOKEN);

const FIVE_MINUTES_SECONDS = 5 * 60;

/**
 * Verify the signature on a Telegram Login Widget payload.
 * @param {Object} payload - Query/body fields from the widget callback.
 * @returns {{ valid: boolean, reason?: string, user?: Object }}
 */
function verifyTelegramAuth(payload) {
  if (!telegramEnabled) return { valid: false, reason: 'telegram_disabled' };
  if (!payload || !payload.hash) return { valid: false, reason: 'missing_hash' };

  const { hash, ...fields } = payload;

  // Build the data_check_string per Telegram's spec.
  const dataCheckString = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join('\n');

  const secret = crypto.createHash('sha256').update(TELEGRAM_BOT_TOKEN).digest();
  const computed = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  // Constant-time compare prevents timing attacks on the signature.
  let signaturesMatch = false;
  try {
    signaturesMatch = crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(computed, 'hex')
    );
  } catch {
    return { valid: false, reason: 'bad_hash_format' };
  }

  if (!signaturesMatch) return { valid: false, reason: 'signature_mismatch' };

  // Reject stale payloads to limit replay window (recommended ≤ 24h; we use 5m).
  const ageSeconds = Math.floor(Date.now() / 1000) - Number(fields.auth_date || 0);
  if (Number.isNaN(ageSeconds) || ageSeconds > FIVE_MINUTES_SECONDS || ageSeconds < -30) {
    return { valid: false, reason: 'stale_or_future_payload' };
  }

  return {
    valid: true,
    user: {
      id: String(fields.id),
      first_name: fields.first_name || '',
      last_name: fields.last_name || '',
      username: fields.username || '',
      photo_url: fields.photo_url || null,
    },
  };
}

module.exports = {
  verifyTelegramAuth,
  telegramEnabled,
  TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME || '',
};
