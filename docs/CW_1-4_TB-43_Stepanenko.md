
НАЦІОНАЛЬНИЙ ТЕХНІЧНИЙ УНІВЕРСИТЕТ УКРАЇНИ
«КИЇВСЬКИЙ ПОЛІТЕХНІЧНИЙ ІНСТИТУТ імені ІГОРЯ СІКОРСЬКОГО»

Кафедра інженерії програмного забезпечення в енергетиці

# КУРСОВА РОБОТА

з дисципліни: «Основи Веб-програмування»

на тему: «Додаток для фінансового менеджменту»

Студента 2 курсу групи ТВ-43
напряму підготовки 121 Інженерія програмного забезпечення

Степаненко Назар Юрійович

GitHub репозиторій: https://github.com/d3Par1/Coursework_Web

Керівник: д.т.н., доцент, Недашківський О. Л.

Київ – 2025/2026

---

## ЗМІСТ

1. [Створення діаграм компонентів, взаємодії та класів](#розділ-1)
   1.1. Діаграма компонентів
   1.2. Діаграма взаємодії
   1.3. Діаграма класів
2. [Проектування структури меню](#розділ-2)
   2.1. Загальна структура навігації
   2.2. Обґрунтування вибору структури меню
3. [Розміщення та стилізація елементів інтерфейсу](#розділ-3)
   3.1. Технології стилізації
   3.2. Майстер-шаблон (layout)
   3.3. Компоненти інтерфейсу
   3.4. Адаптивний дизайн
4. [Модель даних та її реалізація](#розділ-4)
   4.1. Обрана СКБД
   4.2. Схема бази даних
   4.3. Зв'язки між таблицями
   4.4. Ініціалізація бази даних

---

## ВСТУП

Управління особистими фінансами є актуальною задачею для кожної людини. У сучасному світі, де обсяги фінансових транзакцій постійно зростають, виникає потреба у зручних інструментах для обліку доходів та витрат, контролю бюджету та аналізу фінансового стану.

Метою даної курсової роботи є розробка веб-додатку для персонального фінансового менеджменту, який дозволяє користувачам відстежувати доходи та витрати, керувати рахунками, категоризувати транзакції, встановлювати місячні бюджети та візуалізувати фінансовий стан через графіки та звіти.

Додаток розробляється з використанням стеку технологій: Node.js 20 LTS, Express 4, шаблонізатор EJS, база даних SQLite (бібліотека better-sqlite3), CSS-фреймворк Bootstrap 5, бібліотека Chart.js для побудови графіків.

Проект розробляється командою з двох осіб з розподілом за функціональними модулями:
- **Степаненко Назар** — авторизація, рахунки/гаманці, дашборд, графіки, інтеграція з API
- **Аніщенко Артем** — категорії, транзакції, фільтрація, бюджети, експорт

У даному звіті описано роботу, виконану за пунктами 1–4 силабусу: створення UML-діаграм, проектування навігаційного меню, розміщення та стилізація елементів інтерфейсу, а також проектування і реалізація моделі даних.

---

<a id="розділ-1"></a>
## РОЗДІЛ 1. СТВОРЕННЯ ДІАГРАМ КОМПОНЕНТІВ, ВЗАЄМОДІЇ ТА КЛАСІВ

Для документування архітектури додатку було створено три UML-діаграми з використанням Mermaid (mermaid-js/mermaid-cli). Вихідні файли зберігаються у директорії `diagrams/` репозиторію як `.mmd` (текстовий формат) та `.png` (зображення для звіту).

### 1.1. Діаграма компонентів

Діаграма компонентів відображає загальну архітектуру системи та зв'язки між компонентами додатку.

**Файл:** `diagrams/component-diagram.png`

Система складається з трьох основних шарів:

1. **Browser (Client)** — клієнтська частина, що включає:
   - Bootstrap 5 — адаптивний інтерфейс користувача
   - Chart.js — візуалізація фінансових даних (графіки)
   - Client JavaScript — клієнтська валідація форм

2. **Express 4 Server** — серверна частина з архітектурою MVC:
   - **Middleware Layer** — проміжне програмне забезпечення: express-session (сесії), connect-flash (повідомлення), express-validator (валідація), morgan (логування), Body Parser (парсинг тіла запитів)
   - **Routes Layer** — маршрутизація: Auth (/auth/*), Dashboard (/), Accounts (/accounts/*), Transactions (/transactions/*), Categories (/categories/*), Budgets (/budgets/*)
   - **Models Layer** — моделі даних: User, Account, Transaction, Category, Budget
   - **Views Layer (EJS)** — шаблони: layout.ejs (майстер-шаблон), партіали (navbar, flash, footer), сторінки розділів

3. **SQLite Database** — база даних з 5 таблицями (users, accounts, categories, transactions, budgets)

4. **External Services (Phase 6)** — зовнішні сервіси:
   - ExchangeRate API — конвертація валют
   - Gmail SMTP — повідомлення електронною поштою

Зв'язки: Browser ↔ Server через HTTP-запити, Models ↔ Database через SQL-запити (better-sqlite3), Server → зовнішні сервіси через HTTP API та SMTP.

### 1.2. Діаграма взаємодії

Діаграма взаємодії (послідовності) демонструє типовий сценарій використання — додавання нової транзакції.

**Файл:** `diagrams/interaction-diagram.png`

**Учасники:** User (актор), Browser, Express Router (POST /transactions), express-validator, Transaction Model, SQLite Database, EJS View Engine.

**Сценарій:**
1. Користувач заповнює форму транзакції (рахунок, категорія, сума, дата)
2. Browser надсилає POST /transactions з даними форми
3. Express Router передає дані через ланцюжки валідації express-validator
4. **Альтернатива "Validation Failed":**
   - Router рендерить шаблон transactions/new.ejs з помилками та збереженими даними
   - Відповідь 422 Unprocessable Entity з повідомленнями про помилки під кожним полем
5. **Альтернатива "Validation Passed":**
   - Router викликає Transaction.create() з параметрами
   - Model виконує INSERT INTO transactions
   - Model оновлює баланс рахунку: UPDATE accounts SET balance = balance ± amount
   - Router зберігає flash-повідомлення та виконує 302 Redirect на GET /transactions
   - Browser завантажує список транзакцій з відповідним повідомленням про успіх

Діаграма демонструє патерн PRG (Post/Redirect/Get) та двостороню валідацію, які використовуються у всіх формах додатку.

### 1.3. Діаграма класів

Діаграма класів описує п'ять моделей даних додатку, їх атрибути, методи та зв'язки.

**Файл:** `diagrams/class-diagram.png`

**Класи:**

| Клас | Атрибути | Основні методи |
|------|----------|----------------|
| **User** | id, email, password_hash, name, created_at | create(), findByEmail(), findById() |
| **Account** | id, user_id, name, type, currency, balance, created_at | create(), findByUserId(), update(), delete(), updateBalance() |
| **Category** | id, user_id, name, type, icon, color | create(), findByUserId(), findSystem(), update(), delete() |
| **Transaction** | id, user_id, account_id, category_id, type, amount, description, date, created_at | create(), findByUserId(), findFiltered(), update(), delete() |
| **Budget** | id, user_id, category_id, month, limit_amount | create(), findByUserId(), findByMonth(), update(), delete(), getSpent() |

**Зв'язки (7 асоціацій):**
- User 1 → * Account (користувач має кілька рахунків)
- User 1 → * Transaction (користувач створює транзакції)
- User 1 → * Budget (користувач встановлює бюджети)
- User 1 → * Category (користувач визначає категорії)
- Account 1 → * Transaction (рахунок містить транзакції)
- Category 1 → * Transaction (категорія класифікує транзакції)
- Category 1 → * Budget (категорія обмежується бюджетом)

---

<a id="розділ-2"></a>
## РОЗДІЛ 2. ПРОЕКТУВАННЯ СТРУКТУРИ МЕНЮ

### 2.1. Загальна структура навігації

Навігаційне меню додатку реалізоване як адаптивний Bootstrap 5 navbar, розміщений у верхній частині кожної сторінки через партіал `views/partials/navbar.ejs`, який включається у майстер-шаблон `views/layout.ejs`.

Структура меню:

```
Finance Manager (бренд, посилання на головну)
├── Dashboard (/)           — головна сторінка з оглядом
├── Accounts (/accounts)    — управління рахунками/гаманцями
├── Transactions (/transactions) — список та додавання транзакцій
├── Categories (/categories)     — категорії доходів/витрат
├── Budgets (/budgets)           — місячні бюджети
└── [Праворуч]
    ├── Login (/auth/login)       — для неавторизованих
    ├── Register (/auth/register) — для неавторизованих
    └── [Ім'я] + Logout           — для авторизованих
```

Меню використовує клас `navbar-expand-lg` — на екранах ширше 992px пункти відображаються горизонтально, на менших екранах згортаються у гамбургер-меню з анімацією `collapse`.

### 2.2. Обґрунтування вибору структури меню

При проектуванні меню було враховано наступні фактори:

1. **Плоска структура** — всі основні розділи доступні в один клік з будь-якої сторінки. Для додатку з 5 основними розділами вкладені меню створюють зайву складність.

2. **Порядок пунктів** відповідає типовому користувацькому сценарію: Dashboard (огляд) → Accounts (налаштування рахунків) → Transactions (щоденна робота) → Categories (налаштування) → Budgets (планування).

3. **Авторизаційний стан** — пункти Login/Register та ім'я користувача/Logout відображаються умовно залежно від стану авторизації, що забезпечується через `res.locals.currentUser`.

4. **Адаптивність** — на мобільних пристроях меню згортається у кнопку-гамбургер (`navbar-toggler`), що забезпечує зручне використання на екранах будь-якого розміру.

5. **Візуальна ієрархія** — темний фон навбару (`navbar-dark bg-dark`) контрастує з основним контентом, забезпечуючи чітке розмежування навігації та вмісту.

---

<a id="розділ-3"></a>
## РОЗДІЛ 3. РОЗМІЩЕННЯ ТА СТИЛІЗАЦІЯ ЕЛЕМЕНТІВ ІНТЕРФЕЙСУ

### 3.1. Технології стилізації

Для оформлення інтерфейсу використовуються:

| Технологія | Версія | Призначення |
|-----------|--------|-------------|
| Bootstrap 5 | 5.3.3 | CSS-фреймворк: сітка, компоненти, утиліти |
| Bootstrap Icons | 1.11.3 | Іконки для навігації та кнопок |
| Custom CSS | — | Додаткові стилі (`public/css/style.css`) |

Bootstrap підключається через CDN, що не потребує системи збірки та спрощує розгортання.

### 3.2. Майстер-шаблон (layout)

Файл `views/layout.ejs` визначає загальну структуру HTML-сторінки. Використовується бібліотека `express-ejs-layouts`, яка забезпечує патерн `<%- body %>` для вставки контенту сторінки.

Структура шаблону:
```html
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Finance Manager</title>
  <!-- Bootstrap 5 CSS (CDN) -->
  <!-- Bootstrap Icons (CDN) -->
  <!-- Custom styles -->
</head>
<body>
  <!-- Navbar (партіал) -->
  <main class="container py-4">
    <!-- Flash messages (партіал) -->
    <!-- Контент сторінки (<%- body %>) -->
  </main>
  <!-- Footer (партіал) -->
  <!-- Bootstrap JS Bundle (CDN) -->
  <!-- Client validation script -->
</body>
</html>
```

Клас `container` обмежує ширину контенту та центрує його на великих екранах. Клас `py-4` забезпечує вертикальні відступи.

### 3.3. Компоненти інтерфейсу

**Навігаційна панель** (`views/partials/navbar.ejs`):
- `navbar-dark bg-dark` — темна тема
- `navbar-expand-lg` — адаптивне згортання
- `navbar-toggler` + `collapse` — гамбургер-меню на мобільних
- `nav-item` / `nav-link` — стилізовані пункти меню

**Flash-повідомлення** (`views/partials/flash.ejs`):
- `alert alert-success` / `alert alert-danger` — зелені/червоні банери
- `alert-dismissible fade show` — можливість закриття з анімацією
- `btn-close` — кнопка закриття повідомлення

**Картки розділів** — кожна сторінка-заглушка використовує Bootstrap `card` компонент:
- `card shadow-sm` — картка з легкою тінню
- `card-body p-4` — внутрішній відступ
- `card-title` — заголовок розділу

**Форми авторизації** (`views/auth/register.ejs`, `views/auth/login.ejs`):
- `form-control` — стилізовані поля введення
- `form-label` — мітки полів
- `needs-validation` + `novalidate` — Bootstrap валідація
- `is-invalid` / `invalid-feedback` — відображення помилок під полями
- `btn btn-primary w-100` — кнопка на повну ширину

### 3.4. Адаптивний дизайн

Адаптивність забезпечується сіткою Bootstrap 5:

| Елемент | Desktop (≥992px) | Mobile (<992px) |
|---------|-----------------|-----------------|
| Navbar | Горизонтальні пункти | Гамбургер-меню |
| Форми авторизації | `col-md-6 col-lg-5` (центровані) | Повна ширина |
| Контент | Обмежений `container` | Повна ширина з відступами |
| Таблиці | Стандартне відображення | `table-responsive` з горизонтальним скролом |

Мета-тег `<meta name="viewport" content="width=device-width, initial-scale=1">` забезпечує правильне масштабування на мобільних пристроях.

---

<a id="розділ-4"></a>
## РОЗДІЛ 4. МОДЕЛЬ ДАНИХ ТА ЇЇ РЕАЛІЗАЦІЯ

### 4.1. Обрана СКБД

Для зберігання даних обрано **SQLite** — вбудовану реляційну СКБД, що зберігає дані у одному файлі (`finance.db`). Підключення реалізовано через бібліотеку **better-sqlite3** (v12.x), яка надає синхронний API та найвищу продуктивність серед SQLite-драйверів для Node.js.

Обґрунтування вибору:
- Не потребує окремого сервера (на відміну від MySQL/PostgreSQL)
- Файлова база — спрощує розгортання та резервне копіювання
- Синхронний API better-sqlite3 узгоджується з архітектурою Express (серверний рендеринг)
- Достатня продуктивність для персонального фінансового додатку

### 4.2. Схема бази даних

База даних складається з 5 таблиць. Всі таблиці використовують `CREATE TABLE IF NOT EXISTS` для ідемпотентного запуску.

**Таблиця users** — користувачі системи:

| Поле | Тип | Обмеження | Опис |
|------|-----|-----------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Унікальний ідентифікатор |
| email | TEXT | UNIQUE NOT NULL | Електронна пошта (унікальна) |
| password_hash | TEXT | NOT NULL | Хеш пароля (bcrypt) |
| name | TEXT | NOT NULL | Ім'я користувача |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Дата реєстрації |

**Таблиця accounts** — рахунки/гаманці:

| Поле | Тип | Обмеження | Опис |
|------|-----|-----------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Унікальний ідентифікатор |
| user_id | INTEGER | NOT NULL, FK → users(id) ON DELETE CASCADE | Власник рахунку |
| name | TEXT | NOT NULL | Назва рахунку |
| type | TEXT | NOT NULL, CHECK(IN ('cash','card','savings')) | Тип рахунку |
| currency | TEXT | DEFAULT 'UAH' | Валюта |
| balance | REAL | DEFAULT 0 | Поточний баланс |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Дата створення |

**Таблиця categories** — категорії доходів/витрат:

| Поле | Тип | Обмеження | Опис |
|------|-----|-----------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Унікальний ідентифікатор |
| user_id | INTEGER | NULL (системні категорії) | Власник категорії |
| name | TEXT | NOT NULL | Назва категорії |
| type | TEXT | NOT NULL, CHECK(IN ('income','expense')) | Тип: дохід/витрата |
| icon | TEXT | — | Іконка |
| color | TEXT | — | Колір |

**Таблиця transactions** — фінансові транзакції:

| Поле | Тип | Обмеження | Опис |
|------|-----|-----------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Унікальний ідентифікатор |
| user_id | INTEGER | NOT NULL, FK → users(id) ON DELETE CASCADE | Автор транзакції |
| account_id | INTEGER | NOT NULL, FK → accounts(id) ON DELETE CASCADE | Рахунок |
| category_id | INTEGER | NOT NULL, FK → categories(id) ON DELETE RESTRICT | Категорія |
| type | TEXT | NOT NULL, CHECK(IN ('income','expense')) | Тип: дохід/витрата |
| amount | REAL | NOT NULL, CHECK(amount > 0) | Сума (завжди додатня) |
| description | TEXT | — | Опис/коментар |
| date | DATE | NOT NULL | Дата транзакції |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Дата створення запису |

**Таблиця budgets** — місячні бюджети:

| Поле | Тип | Обмеження | Опис |
|------|-----|-----------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Унікальний ідентифікатор |
| user_id | INTEGER | NOT NULL, FK → users(id) ON DELETE CASCADE | Власник бюджету |
| category_id | INTEGER | NOT NULL, FK → categories(id) ON DELETE CASCADE | Категорія |
| month | TEXT | NOT NULL | Місяць (формат YYYY-MM) |
| limit_amount | REAL | NOT NULL, CHECK(limit_amount > 0) | Ліміт витрат |
| | | UNIQUE(user_id, category_id, month) | Один бюджет на категорію/місяць |

### 4.3. Зв'язки між таблицями

```
users (1) ──────── (*) accounts
users (1) ──────── (*) transactions
users (1) ──────── (*) budgets
users (1) ──────── (*) categories
accounts (1) ────── (*) transactions
categories (1) ──── (*) transactions (ON DELETE RESTRICT)
categories (1) ──── (*) budgets (ON DELETE CASCADE)
```

Особливості:
- **CASCADE** — видалення користувача автоматично видаляє всі його рахунки, транзакції, бюджети
- **RESTRICT** — категорію неможливо видалити, якщо до неї прив'язані транзакції (захист даних)
- **PRAGMA foreign_keys = ON** — зовнішні ключі вмикаються при кожному підключенні (SQLite вимикає їх за замовчуванням)

### 4.4. Ініціалізація бази даних

Файл `config/database.js` виконує ініціалізацію при запуску додатку:

```javascript
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');    // Write-Ahead Logging для продуктивності
db.pragma('foreign_keys = ON');     // Увімкнення зовнішніх ключів
db.exec(schema);                    // Створення таблиць (IF NOT EXISTS)
```

Початкові дані (`db/seed.sql`) містять 10 передвизначених категорій:
- **Витрати (5):** Food & Dining, Transportation, Housing, Entertainment, Healthcare
- **Доходи (5):** Salary, Freelance, Investments, Gifts, Other Income

Сіди вставляються лише якщо таблиця категорій порожня, що запобігає дублюванню при перезапуску.

---

## ВИСНОВКИ

У ході виконання пунктів 1–4 курсової роботи було:

1. **Створено три UML-діаграми** (компонентів, взаємодії, класів) з використанням Mermaid, що документують архітектуру додатку, типовий сценарій взаємодії та модель даних.

2. **Спроектовано навігаційне меню** з використанням Bootstrap 5 navbar з адаптивним згортанням. Меню має плоску структуру з 5 основними розділами та умовним відображенням авторизаційних елементів.

3. **Розроблено інтерфейс** на основі Bootstrap 5 з використанням адаптивної сітки, компонентів (cards, forms, alerts, tables) та майстер-шаблону EJS. Інтерфейс коректно відображається на десктопних та мобільних пристроях.

4. **Реалізовано модель даних** у вигляді реляційної SQLite бази з 5 таблицями, 7 зв'язками через зовнішні ключі, CHECK-обмеженнями та ідемпотентною ініціалізацією при запуску.

Додаток запускається командою `npm start` та доступний за адресою http://localhost:3000.

---

## СПИСОК ВИКОРИСТАНИХ ДЖЕРЕЛ

1. Express.js 4.x — API Reference. URL: https://expressjs.com/en/4x/api.html
2. Bootstrap 5.3 — Documentation. URL: https://getbootstrap.com/docs/5.3/
3. better-sqlite3 — GitHub Repository. URL: https://github.com/WiseLibs/better-sqlite3
4. EJS — Embedded JavaScript Templates. URL: https://ejs.co/
5. express-validator 7.x — Documentation. URL: https://express-validator.github.io/docs/
6. express-ejs-layouts — npm Package. URL: https://www.npmjs.com/package/express-ejs-layouts
7. Mermaid — Diagramming and charting tool. URL: https://mermaid.js.org/
8. SQLite — Documentation. URL: https://www.sqlite.org/docs.html
9. Node.js 20 LTS — Documentation. URL: https://nodejs.org/docs/latest-v20.x/api/
10. Chart.js — Simple yet flexible JavaScript charting. URL: https://www.chartjs.org/
