# Git Tutorial для командної роботи

## Початкове налаштування (один раз)

### 1. Клонувати репозиторій

```bash
git clone https://github.com/d3Par1/Coursework_Web.git
cd Coursework_Web
```

### 2. Перевірити що ви на гілці develop

```bash
git branch
# Має показати: * develop
```

Якщо ні:
```bash
git checkout develop
```

---

## Щоденний робочий процес

### Крок 1: Оновити develop перед початком роботи

```bash
git checkout develop
git pull origin develop
```

> Це завантажує всі зміни напарника. **Завжди робіть це першим!**

### Крок 2: Створити feature branch

```bash
git checkout -b feature/назва-фічі
```

**Приклади назв:**
- `feature/auth` — авторизація
- `feature/accounts` — робота з рахунками
- `feature/transactions` — транзакції
- `feature/dashboard` — дашборд
- `feature/budgets` — бюджети
- `feature/filters` — фільтрація

> Кожна фіча = окрема гілка. Не працюйте напряму в develop!

### Крок 3: Працювати і комітити

```bash
# Подивитись що змінилось
git status

# Додати конкретні файли
git add routes/auth.js models/User.js views/auth/login.ejs

# АБО додати всі змінені файли
git add .

# Зробити коміт з описом
git commit -m "feat: add user registration form and route"
```

**Конвенція комітів:**
```
feat: add login page with session support
fix: correct balance calculation on transaction delete
docs: update README with setup instructions
style: improve form layout on mobile
```

### Крок 4: Запушити гілку на GitHub

```bash
git push origin feature/назва-фічі
```

### Крок 5: Створити Pull Request (PR)

1. Відкрийте GitHub → ваш репозиторій
2. Побачите банер "feature/назва-фічі had recent pushes" → натисніть **Compare & pull request**
3. **Base:** `develop` ← **Compare:** `feature/назва-фічі`
4. Додайте опис що зроблено
5. Натисніть **Create pull request**
6. Напарник може переглянути, потім **Merge**

### Крок 6: Після merge — прибрати і оновити

```bash
# Переключитись на develop
git checkout develop

# Отримати зміни (включно з merge)
git pull origin develop

# Видалити стару feature гілку локально
git branch -d feature/назва-фічі

# Створити нову гілку для наступної фічі
git checkout -b feature/наступна-фіча
```

---

## Типові ситуації

### Напарник запушив зміни, як отримати?

```bash
git checkout develop
git pull origin develop
```

Якщо ви на feature branch і хочете отримати нові зміни з develop:

```bash
git checkout feature/ваша-фіча
git merge develop
```

### Merge конфлікт!

Якщо Git каже "CONFLICT":

1. Відкрийте файл у WebStorm — побачите маркери:
```
<<<<<<< HEAD
ваш код
=======
код напарника
>>>>>>> develop
```

2. Виберіть правильну версію (або об'єднайте обидві)
3. Збережіть файл
4. `git add файл-з-конфліктом`
5. `git commit -m "fix: resolve merge conflict in routes/auth.js"`

### Хочу скасувати незакомічені зміни

```bash
# Скасувати зміни в одному файлі
git checkout -- routes/auth.js

# Скасувати ВСІ незакомічені зміни
git checkout -- .
```

### Забув переключити гілку і вже зробив зміни

```bash
# Зберегти зміни в "схованку"
git stash

# Переключити гілку
git checkout -b feature/правильна-гілка

# Відновити зміни
git stash pop
```

---

## Візуальна схема workflow

```
master ─────────────────────────────────── (стабільні релізи)
   │
develop ──●──●──●──●──●──●──●──●──●───── (основна розробка)
          │        ↑     │       ↑
          │   merge│     │  merge│
          ↓        │     ↓       │
feature/auth ●──●──┘   feature/  │
  (Назар)          transactions──┘
                     (Артем)
```

---

## Корисні команди

| Команда | Що робить |
|---------|-----------|
| `git status` | Показати стан файлів |
| `git log --oneline -10` | Останні 10 комітів |
| `git branch` | Показати всі гілки |
| `git branch -a` | Показати всі гілки (включно з remote) |
| `git diff` | Показати незакомічені зміни |
| `git stash` | Тимчасово сховати зміни |
| `git stash pop` | Відновити сховані зміни |

## WebStorm підказки

- **Git panel** внизу (Alt+9) — показує гілки, логи, зміни
- **Ctrl+K** — вікно коміту
- **Ctrl+Shift+K** — push
- **Ctrl+T** — pull (оновити)
- Правий клік на файл → Git → Compare with Branch — порівняти з develop
