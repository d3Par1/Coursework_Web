/**
 * calendar.js — custom date picker for transaction form
 * Shows a 4-week grid with dots on days that already have transactions.
 * Writes the selected date into a hidden <input name="date">.
 */
(function () {
    'use strict';

    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    function pad(n) { return String(n).padStart(2, '0'); }

    function toISO(y, m, d) {
        return `${y}-${pad(m)}-${pad(d)}`;
    }

    function monthLabel(y, m) {
        return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }

    function buildCalendar(container, hiddenInput, initialDate) {
        let current = initialDate ? new Date(initialDate) : new Date();
        let selectedISO = initialDate || toISO(current.getFullYear(), current.getMonth() + 1, current.getDate());
        let dots = {};

        // ── fetch dot data from API ──────────────────────────────────────────────
        async function fetchDots(y, m) {
            try {
                const month = `${y}-${pad(m)}`;
                const res   = await fetch(`/api/transactions/calendar?month=${month}`);
                dots = await res.json();
            } catch (_) { dots = {}; }
            render();
        }

        // ── render ───────────────────────────────────────────────────────────────
        function render() {
            const y = current.getFullYear();
            const m = current.getMonth() + 1; // 1-based

            // First day of month → ISO weekday (Mon=1…Sun=7)
            const firstDow = (() => {
                const d = new Date(y, m - 1, 1).getDay(); // Sun=0
                return d === 0 ? 7 : d;
            })();

            const daysInMonth = new Date(y, m, 0).getDate();
            const today = toISO(
                new Date().getFullYear(),
                new Date().getMonth() + 1,
                new Date().getDate()
            );

            // Build grid cells: leading empty + day cells
            const cells = [];
            for (let i = 1; i < firstDow; i++) cells.push(null);
            for (let d = 1; d <= daysInMonth; d++) cells.push(d);

            // Pad to complete last row
            while (cells.length % 7 !== 0) cells.push(null);

            container.innerHTML = `
        <div class="cal-wrap">
          <div class="cal-nav">
            <button type="button" class="cal-prev btn btn-sm btn-outline-secondary">‹</button>
            <span class="cal-title">${monthLabel(y, m)}</span>
            <button type="button" class="cal-next btn btn-sm btn-outline-secondary">›</button>
          </div>
          <div class="cal-grid">
            ${DAYS.map(d => `<div class="cal-dow">${d}</div>`).join('')}
            ${cells.map(d => {
                if (!d) return '<div class="cal-cell cal-empty"></div>';
                const iso = toISO(y, m, d);
                const isSelected = iso === selectedISO;
                const isToday    = iso === today;
                const hasDot     = !!dots[iso];
                return `
                <div class="cal-cell${isSelected ? ' cal-selected' : ''}${isToday ? ' cal-today' : ''}"
                     data-date="${iso}">
                  ${d}
                  ${hasDot ? '<span class="cal-dot"></span>' : ''}
                </div>`;
            }).join('')}
          </div>
        </div>
      `;

            // Nav buttons
            container.querySelector('.cal-prev').addEventListener('click', () => {
                current = new Date(y, m - 2, 1); // previous month
                fetchDots(current.getFullYear(), current.getMonth() + 1);
            });
            container.querySelector('.cal-next').addEventListener('click', () => {
                current = new Date(y, m, 1); // next month
                fetchDots(current.getFullYear(), current.getMonth() + 1);
            });

            // Day click
            container.querySelectorAll('.cal-cell:not(.cal-empty)').forEach(cell => {
                cell.addEventListener('click', () => {
                    selectedISO = cell.dataset.date;
                    hiddenInput.value = selectedISO;
                    // Update the visible label next to the picker
                    const label = document.getElementById('cal-selected-label');
                    if (label) label.textContent = new Date(selectedISO).toLocaleDateString('en-GB', {
                        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                    });
                    render();
                });
            });
        }

        // Initial load
        fetchDots(current.getFullYear(), current.getMonth() + 1);
    }

    // ── init on DOMContentLoaded ───────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        const hiddenInput = document.querySelector('input[name="date"][type="hidden"]');
        const container   = document.getElementById('cal-picker');
        if (!container || !hiddenInput) return;
        buildCalendar(container, hiddenInput, hiddenInput.value);
    });
})();
