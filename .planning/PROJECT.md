# Personal Finance Manager (Додаток для фінансового менеджменту)

## What This Is

A web application for personal financial management that allows users to track income and expenses, manage multiple accounts/wallets, categorize transactions, set monthly budgets, and visualize their financial state through charts and reports. Built as a course work (Тема 31) for "Основи Веб-програмування" at KPI, developed by a team of two.

## Core Value

Users can quickly add financial transactions and immediately see where their money goes — clear, categorized expense/income tracking with visual budget feedback.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can register an account and log in securely
- [ ] User can manage multiple accounts/wallets (cash, card, savings)
- [ ] User can add, edit, and delete transactions (income/expense)
- [ ] Each transaction has: amount, date, category, type (income/expense), comment, linked account
- [ ] User can view transaction history with filtering by date range, category, account
- [ ] User can create and manage expense/income categories
- [ ] User can set monthly budgets per category and see execution/overrun
- [ ] User can view financial statistics: totals, category breakdown charts, period comparisons
- [ ] Dashboard shows current financial state at a glance (balances, recent transactions, budget status)
- [ ] Responsive design that works on desktop and mobile browsers

### Out of Scope

- Bank API integration (Monobank, etc.) — complexity exceeds course scope
- Cryptocurrency tracking — not relevant to core personal finance
- Cloud deployment (AWS, Netlify) — local/simple server deployment sufficient
- Mobile native app — this is a web programming course
- Multi-user shared budgets — single-user personal finance only
- AI-powered insights — unnecessary complexity for course work

## Context

**Academic context:**
- Course: "Основи Веб-програмування. Курсова робота" (ТВ-43, 2nd Semester 2025/26)
- Professor: Недашківський Олексій Леонідович (Gagarin O.O. — consultant)
- Topic: Тема 31 — Додаток для фінансового менеджменту (Рек. 2 уч.)
- Team: Степаненко Назар Юрійович + Аніщенко Артем Олександрович

**Collaboration rules (from professor):**
- Equal distribution of work parts (frontend layout, DB elements, etc.)
- Individual course work reports (пояснювальні записки) with < 15% similarity
- Feature-based work split: each developer owns full-stack features

**Syllabus sections (10 розділів, 5 points each = 50 points):**
1. Component, interaction, and class diagrams
2. Menu structure design (UX/navigation)
3. Interface element placement and styling
4. Data model design and implementation
5. Data retrieval and update mechanisms
6. Database for storage and retrieval
7. Third-party service integration
8. Server architecture
9. Request handling and DB interaction on server
10. Testing and server deployment

**Grading:** 50 (sections) + 10 (report quality) + 40 (defense) = 100 points

**Reference projects analyzed:**
- KPI 2025 diploma: "Веб-система керування фінансами" — adapted goal/structure
- KPI 2019 diploma: "Мобільний додаток для персонального фінансового обліку" — adapted feature set

## Constraints

- **Tech stack**: Standard web technologies only — no FlutterFlow or similar no-code platforms. Allowed: HTML, CSS, JS, Python, PHP + MySQL/PostgreSQL/MongoDB/SQLite
- **Timeline**: Points 1-4 by March 15, Points 5-8 by April 26, All by May 10, Defense by May 17
- **Collaboration**: 1 shared GitHub repo, both developers as contributors, feature-based work split
- **Reports**: Individual пояснювальні записки required — < 15% similarity between team members
- **Defense**: Each student must explain their contribution and answer questions on the software

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web app (not mobile) | Course is "Web Programming" — syllabus sections are web-oriented | — Pending |
| 1 shared repo, contributors model | Simplest collaboration, clear commit history per developer | — Pending |
| Feature-based work split | Each developer owns full-stack features — clear individual contribution for defense | — Pending |
| Tech stack: TBD during research | Will research best fit during research phase — leaning Node.js + Express (aligns with PR3-5 practicals) vs Flask/Django | — Pending |

---
*Last updated: 2026-03-09 after initialization*
