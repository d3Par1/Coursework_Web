# Personal Finance Manager

> Веб-додаток для персонального фінансового менеджменту
> Курсова робота з дисципліни «Основи Веб-програмування» — КПІ, ТВ-43, 2025/26

## Команда

| Розробник | GitHub | Відповідальність |
|-----------|--------|-----------------|
| Степаненко Назар | [@d3Par1](https://github.com/d3Par1) | Auth, акаунти, дашборд, графіки, API інтеграція |
| Аніщенко Артем | [@anishchenko64](https://github.com/anishchenko64) | Категорії, транзакції, фільтрація, бюджети, експорт |

## Стек технологій

- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js 4
- **Database:** SQLite (better-sqlite3)
- **Templates:** EJS
- **CSS:** Bootstrap 5
- **Charts:** Chart.js
- **Auth:** express-session + bcrypt

## Запуск

```bash
npm install
npm start
```

Додаток буде доступний на `http://localhost:3000`

## Git Workflow

### Гілки

- `master` — стабільна версія (тільки через PR з develop)
- `develop` — основна гілка розробки
- `feature/*` — фічі (створюються від develop)

### Як працювати

```bash
# 1. Переключитись на develop і оновити
git checkout develop
git pull origin develop

# 2. Створити feature branch
git checkout -b feature/назва-фічі

# 3. Працювати, комітити
git add .
git commit -m "feat: опис змін"

# 4. Запушити і створити PR в develop
git push origin feature/назва-фічі
# Створити Pull Request на GitHub: feature/* → develop
```

### Конвенція комітів

- `feat:` — нова функціональність
- `fix:` — виправлення бага
- `docs:` — документація
- `style:` — стилізація (CSS, форматування)
- `refactor:` — рефакторинг без зміни функціональності
- `test:` — тести

## Структура проєкту

```
finance-app/
├── server.js              # Entry point
├── config/database.js     # SQLite setup
├── models/                # Data access (SQL)
├── routes/                # Express routers
├── views/                 # EJS templates
├── public/                # Static (CSS, JS, images)
├── db/                    # Schema + seed SQL
└── tests/                 # Test files
```
