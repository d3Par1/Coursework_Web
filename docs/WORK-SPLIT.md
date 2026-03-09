# Розподіл роботи

## Назар (d3Par1)

| Фіча | Файли | Опис |
|-------|-------|------|
| **Авторизація** | `routes/auth.js`, `models/User.js`, `views/auth/*` | Реєстрація, вхід, сесії, bcrypt |
| **Акаунти/Гаманці** | `routes/accounts.js`, `models/Account.js`, `views/accounts/*` | CRUD рахунків (готівка, карта, заощадження) |
| **Дашборд** | `routes/dashboard.js`, `views/dashboard.ejs`, `public/js/charts.js` | Огляд балансу, графіки Chart.js |
| **API інтеграція** | `routes/api.js` | Курси валют (ExchangeRate-API) |
| **Спільні** | `server.js`, `views/layout.ejs`, `config/database.js` | Базова структура, layout, навігація |

## Артем (TBD)

| Фіча | Файли | Опис |
|-------|-------|------|
| **Категорії** | `routes/categories.js`, `models/Category.js`, `views/categories/*` | CRUD категорій (доход/витрата) |
| **Транзакції** | `routes/transactions.js`, `models/Transaction.js`, `views/transactions/*` | CRUD транзакцій з усіма полями |
| **Фільтрація** | `views/transactions/index.ejs`, `public/js/filters.js` | Фільтри по даті, категорії, рахунку, типу |
| **Бюджети** | `routes/budgets.js`, `models/Budget.js`, `views/budgets/*` | Місячні ліміти, прогрес-бари |
| **Експорт** | `routes/api.js` (export endpoint) | CSV експорт з фільтрами |
| **Email сповіщення** | `middleware/` або `services/` | Nodemailer при перевищенні бюджету |

## Правила

1. **Працюйте тільки у своїх файлах** — уникайте merge конфліктів
2. **Спільні файли** (`server.js`, `layout.ejs`, `schema.sql`) — тільки через PR з рев'ю
3. **Кожен feature = окрема гілка** (`feature/auth`, `feature/transactions`)
4. **Тестуйте локально перед push** — запустіть весь додаток
5. **Для захисту** — прочитайте код напарника, зрозумійте як він працює
