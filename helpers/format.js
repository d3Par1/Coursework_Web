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
