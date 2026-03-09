# Архітектура системи

## Патерн: MVC (Model-View-Controller)

```
Browser (Bootstrap + Chart.js + JS)
        │ HTTP
Express Server (Node.js)
  ├── Routes (Controllers)
  ├── Models (SQL queries)
  └── Views (EJS templates)
        │ SQL
SQLite Database (finance.db)
```

## Структура проєкту

```
finance-app/
├── server.js              # Точка входу, налаштування Express
├── package.json
├── .env                   # DB path, session secret, API keys
│
├── config/
│   └── database.js        # Підключення SQLite
│
├── middleware/
│   ├── auth.js            # Перевірка сесії
│   └── validation.js      # Валідація введених даних
│
├── models/                # Доступ до даних (SQL запити)
│   ├── User.js
│   ├── Account.js
│   ├── Transaction.js
│   ├── Category.js
│   └── Budget.js
│
├── routes/                # Express роутери
│   ├── auth.js            # /auth/login, /auth/register, /auth/logout
│   ├── dashboard.js       # / (головна сторінка)
│   ├── accounts.js        # /accounts CRUD
│   ├── transactions.js    # /transactions CRUD + фільтрація
│   ├── categories.js      # /categories CRUD
│   ├── budgets.js         # /budgets CRUD
│   └── api.js             # /api/exchange-rates, /api/export
│
├── views/                 # EJS шаблони
│   ├── layout.ejs         # Спільний layout (nav, footer)
│   ├── dashboard.ejs
│   ├── auth/login.ejs, register.ejs
│   ├── accounts/index.ejs, form.ejs
│   ├── transactions/index.ejs, form.ejs
│   ├── categories/index.ejs
│   └── budgets/index.ejs, form.ejs
│
├── public/                # Статичні файли
│   ├── css/style.css
│   ├── js/charts.js, filters.js, validation.js
│   └── images/
│
├── db/
│   ├── schema.sql         # CREATE TABLE
│   └── seed.sql           # Тестові дані
│
└── tests/
```

## Схема бази даних

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,          -- cash, card, savings
    currency TEXT DEFAULT 'UAH',
    balance REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,             -- NULL = системна категорія
    name TEXT NOT NULL,
    type TEXT NOT NULL,           -- income, expense
    icon TEXT,
    color TEXT
);

CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    type TEXT NOT NULL,           -- income, expense
    amount REAL NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    month TEXT NOT NULL,          -- "2026-03"
    limit_amount REAL NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

## ER Діаграма (зв'язки)

```
users 1──────* accounts
users 1──────* categories
users 1──────* transactions
users 1──────* budgets
accounts 1───* transactions
categories 1─* transactions
categories 1─* budgets
```
