// public/js/dashboard-charts.js
// Renders Chart.js pie + bar charts on the dashboard.
// Fetches JSON from /api/charts/* and degrades gracefully on empty/error.

(function () {
  'use strict';

  function showEmptyState(canvasId, message) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.fillStyle = '#6c757d';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    ctx.restore();
  }

  async function renderCategoryPie() {
    const canvas = document.getElementById('chart-categories');
    if (!canvas || typeof Chart === 'undefined') return;

    try {
      const res = await fetch('/api/charts/categories');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (!json.labels.length) {
        showEmptyState('chart-categories', 'No expense data for this month yet');
        return;
      }

      const moneyFmt = new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0 });
      new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: json.labels,
          datasets: [{
            data: json.data,
            backgroundColor: json.colors,
            borderWidth: 2,
            borderColor: '#fbfaf6',
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '60%',
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12, font: { size: 12 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
                  const pct = sum ? ((ctx.parsed / sum) * 100).toFixed(1) : 0;
                  return `${ctx.label}: ${moneyFmt.format(ctx.parsed)} (${pct}%)`;
                },
              },
            },
          },
        },
      });
    } catch (err) {
      showEmptyState('chart-categories', 'Failed to load chart data');
      console.error('[charts] categories:', err);
    }
  }

  async function renderMonthlyBar() {
    const canvas = document.getElementById('chart-monthly');
    if (!canvas || typeof Chart === 'undefined') return;

    try {
      const res = await fetch('/api/charts/monthly?months=6');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (!json.labels.length) {
        showEmptyState('chart-monthly', 'No transaction data yet');
        return;
      }

      const moneyFmt = new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0 });
      new Chart(canvas, {
        type: 'bar',
        data: {
          labels: json.labels,
          datasets: [
            {
              label: 'Income',
              data: json.income,
              backgroundColor: 'rgba(75, 137, 95, 0.75)',
              borderColor: 'rgba(58, 110, 75, 1)',
              borderWidth: 1,
              borderRadius: 4,
            },
            {
              label: 'Expense',
              data: json.expense,
              backgroundColor: 'rgba(193, 79, 53, 0.75)',
              borderColor: 'rgba(157, 60, 38, 1)',
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 12, padding: 12, font: { size: 12 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${moneyFmt.format(ctx.parsed.y)}`,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(230, 224, 210, 0.6)' },
              ticks: {
                callback: (val) => val >= 1000 ? (val / 1000) + 'k ₴' : val + ' ₴',
                font: { size: 11 },
              },
            },
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 } },
            },
          },
        },
      });
    } catch (err) {
      showEmptyState('chart-monthly', 'Failed to load chart data');
      console.error('[charts] monthly:', err);
    }
  }

  function init() {
    renderCategoryPie();
    renderMonthlyBar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
