// public/js/filters.js
// Client-side enhancements for the transactions filter form.
// Works alongside the server-side filtering in routes/transactions.js.

(function () {
    'use strict';

    // ── Auto-submit on select change ─────────────────────────────────────────
    // When the user changes a dropdown filter, submit the form immediately
    // so they don't need to click the search button.
    const filterForm = document.querySelector('form[action="/transactions"]');
    if (filterForm) {
        const autoSubmitSelects = filterForm.querySelectorAll('select');
        autoSubmitSelects.forEach(function (sel) {
            sel.addEventListener('change', function () {
                filterForm.submit();
            });
        });
    }

    // ── Date range guard ─────────────────────────────────────────────────────
    // Prevent "Date To" from being before "Date From"
    const dateFrom = document.querySelector('input[name="dateFrom"]');
    const dateTo   = document.querySelector('input[name="dateTo"]');

    if (dateFrom && dateTo) {
        dateFrom.addEventListener('change', function () {
            if (dateTo.value && dateTo.value < dateFrom.value) {
                dateTo.value = dateFrom.value;
            }
            dateTo.min = dateFrom.value;
        });

        dateTo.addEventListener('change', function () {
            if (dateFrom.value && dateTo.value < dateFrom.value) {
                dateFrom.value = dateTo.value;
            }
        });
    }

    // ── Active filter badge count ────────────────────────────────────────────
    // Show a count badge on the filter card header to indicate active filters
    (function updateFilterBadge() {
        const filterHeader = document.querySelector('.card-header h6');
        if (!filterHeader) return;

        const params = new URLSearchParams(window.location.search);
        const activeFilters = ['dateFrom', 'dateTo', 'category_id', 'account_id', 'type']
            .filter(k => params.get(k) && params.get(k) !== '').length;

        if (activeFilters > 0) {
            const badge = document.createElement('span');
            badge.className = 'badge bg-primary ms-2';
            badge.textContent = activeFilters;
            badge.title = `${activeFilters} active filter${activeFilters > 1 ? 's' : ''}`;
            filterHeader.appendChild(badge);
        }
    })();

    // ── Confirm delete ───────────────────────────────────────────────────────
    // Extra safety check before deleting a transaction (in addition to inline onsubmit)
    document.querySelectorAll('form[action$="/delete"]').forEach(function (form) {
        form.addEventListener('submit', function (e) {
            if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
                e.preventDefault();
            }
        });
    });

    // ── Amount formatting hint ───────────────────────────────────────────────
    // Format amount input to 2 decimal places on blur
    const amountInput = document.querySelector('input[name="amount"]');
    if (amountInput) {
        amountInput.addEventListener('blur', function () {
            const val = parseFloat(this.value);
            if (!isNaN(val) && val > 0) {
                this.value = val.toFixed(2);
            }
        });
    }

})();
