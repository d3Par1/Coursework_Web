// helpers/format.js — Intl-based money/date formatters for EJS views.
const uah = new Intl.NumberFormat('uk-UA', {
  style: 'currency', currency: 'UAH', minimumFractionDigits: 2,
});
const fmt = new Map();
function formatter(code) {
  if (!fmt.has(code)) {
    fmt.set(code, new Intl.NumberFormat('uk-UA', {
      style: 'currency', currency: code, minimumFractionDigits: 2,
    }));
  }
  return fmt.get(code);
}

module.exports = {
  money: (amount, currency = 'UAH') => formatter(currency).format(amount || 0),
  signed: (amount, type, currency = 'UAH') => {
    const sign = type === 'income' ? '+ ' : '− ';
    return sign + formatter(currency).format(Math.abs(amount || 0));
  },
  date: (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const ytd = new Date(today); ytd.setDate(ytd.getDate() - 1);
    if (d >= today) return 'Today';
    if (d >= ytd) return 'Yesterday';
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  },
  /**
   * Compute a two-letter avatar label from a person's name. Strips
   * academic-group-code tokens (e.g. "ТВ-43", "TB-43") that some users
   * include in their name field — "ТВ-43 Артем" → "АР", not "ТА".
   * Single-token fallback: first two letters. No valid tokens: "?".
   */
  initials: (name) => {
    if (!name || typeof name !== 'string') return '?';
    const groupCode = /^[A-Za-zА-Яа-яҐґЄєІіЇї]{1,4}-?\d+$/;
    const words = name.split(/\s+/).filter((w) => w && !groupCode.test(w));
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return words.map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  },
  /** "Today · 14:02" / "Yesterday · 09:18" / "Sat 4 May · 03:14" */
  dateTime: (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const ytd = new Date(today); ytd.setDate(ytd.getDate() - 1);
    let day;
    if (d >= today) day = 'Today';
    else if (d >= ytd) day = 'Yesterday';
    else day = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    return `${day} · ${time}`;
  },
};
