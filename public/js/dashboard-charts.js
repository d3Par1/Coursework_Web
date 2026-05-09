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

      new Chart(canvas, {
        type: 'pie',
        data: {
          labels: json.labels,
          datasets: [{
            data: json.data,
            backgroundColor: json.colors,
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { boxWidth: 14 } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
                  const pct = sum ? ((ctx.parsed / sum) * 100).toFixed(1) : 0;
                  return `${ctx.label}: ${ctx.parsed.toFixed(2)} UAH (${pct}%)`;
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

      new Chart(canvas, {
        type: 'bar',
        data: {
          labels: json.labels,
          datasets: [
            {
              label: 'Income',
              data: json.income,
              backgroundColor: 'rgba(25, 135, 84, 0.7)',
              borderColor: 'rgba(25, 135, 84, 1)',
              borderWidth: 1,
            },
            {
              label: 'Expense',
              data: json.expense,
              backgroundColor: 'rgba(220, 53, 69, 0.7)',
              borderColor: 'rgba(220, 53, 69, 1)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} UAH`,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (val) => `${val} UAH`,
              },
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
