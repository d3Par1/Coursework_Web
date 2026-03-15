const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  convertMillimetersToTwip,
  LineRuleType,
  TableBorders,
} = require("docx");

const ROOT = path.resolve(__dirname, "..");
const DIAGRAMS = path.join(ROOT, "diagrams");
const SCREENSHOTS = path.join(__dirname, "screenshots");
const OUTPUT = path.join(__dirname, "CW_1-4_TB-43_Stepanenko.docx");

// ── helpers ──────────────────────────────────────────────────────────────────

const FONT = "Times New Roman";
const PT14 = 28; // half-points
const PT16 = 32;
const PT18 = 36;
const PT20 = 40;
const PT12 = 24;
const LINE_SPACING = { line: 360, rule: LineRuleType.AUTO }; // 1.5

function txt(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: opts.size || PT14, bold: !!opts.bold, italics: !!opts.italics, ...(opts.break ? { break: opts.break } : {}) });
}

function para(runs, opts = {}) {
  if (typeof runs === "string") runs = [txt(runs, opts)];
  return new Paragraph({
    children: runs,
    alignment: opts.alignment || AlignmentType.JUSTIFIED,
    spacing: { after: opts.after !== undefined ? opts.after : 120, ...(opts.lineSpacing !== false ? LINE_SPACING : {}) },
    indent: opts.indent ? { firstLine: convertMillimetersToTwip(12.5) } : undefined,
    heading: opts.heading,
    ...(opts.extra || {}),
  });
}

function emptyPara(count = 1) {
  const arr = [];
  for (let i = 0; i < count; i++) arr.push(new Paragraph({ children: [txt("")], spacing: LINE_SPACING }));
  return arr;
}

// ── Title page ───────────────────────────────────────────────────────────────

function titlePage() {
  const c = (text, opts = {}) =>
    para([txt(text, opts)], { alignment: AlignmentType.CENTER, after: opts.after !== undefined ? opts.after : 60 });
  const r = (text, opts = {}) =>
    para([txt(text, opts)], { alignment: AlignmentType.RIGHT, after: opts.after !== undefined ? opts.after : 40 });

  return [
    ...emptyPara(1),
    c("НАЦІОНАЛЬНИЙ ТЕХНІЧНИЙ УНІВЕРСИТЕТ УКРАЇНИ", { size: PT14, bold: true }),
    c("«КИЇВСЬКИЙ ПОЛІТЕХНІЧНИЙ ІНСТИТУТ імені ІГОРЯ СІКОРСЬКОГО»", { size: PT14, bold: true }),
    c(""),
    c("Кафедра інженерії програмного забезпечення в енергетиці", { size: PT14 }),
    ...emptyPara(3),
    c("КУРСОВА РОБОТА", { size: PT20, bold: true, after: 120 }),
    c("з дисципліни: «Основи Веб-програмування»", { size: PT14 }),
    c("на тему: «Додаток для фінансового менеджменту»", { size: PT14, bold: true }),
    ...emptyPara(2),
    r("Студента 2 курсу групи ТВ-43"),
    r("напряму підготовки 121 Інженерія програмного забезпечення"),
    r("Степаненко Назар Юрійович", { bold: true }),
    ...emptyPara(1),
    r("GitHub репозиторій: https://github.com/d3Par1/Coursework_Web"),
    ...emptyPara(1),
    r("Керівник: д.т.н., доцент, Недашківський О. Л."),
    ...emptyPara(2),
    para([txt("Національна оцінка ________________")], { alignment: AlignmentType.LEFT, after: 40 }),
    para([txt("Кількість балів: __________  Оцінка: ECTS _____")], { alignment: AlignmentType.LEFT, after: 40 }),
    ...emptyPara(1),
    para([txt("Член комісії")], { alignment: AlignmentType.LEFT, after: 40 }),
    para([txt("________________  ____________________________")], { alignment: AlignmentType.LEFT, after: 40 }),
    para([txt("________________  ____________________________")], { alignment: AlignmentType.LEFT, after: 40 }),
    ...emptyPara(2),
    c("Київ – 2025/2026", { size: PT14 }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ── ЗАВДАННЯ ────────────────────────────────────────────────────────────────

function zavdannyaPage() {
  const c = (text, opts = {}) =>
    para([txt(text, opts)], { alignment: AlignmentType.CENTER, after: opts.after !== undefined ? opts.after : 60 });

  return [
    c("НАЦІОНАЛЬНИЙ ТЕХНІЧНИЙ УНІВЕРСИТЕТ УКРАЇНИ", { size: PT12, bold: true }),
    c("«КИЇВСЬКИЙ ПОЛІТЕХНІЧНИЙ ІНСТИТУТ імені ІГОРЯ СІКОРСЬКОГО»", { size: PT12, bold: true }),
    ...emptyPara(1),
    para([txt("Навчально-науковий інститут атомної та теплової енергетики", { size: PT12 })], { after: 40 }),
    para([txt("Кафедра інженерії програмного забезпечення в енергетиці", { size: PT12 })], { after: 40 }),
    para([txt("Напрям підготовки 121 Інженерія програмного забезпечення", { size: PT12 })], { after: 40 }),
    ...emptyPara(1),
    c("З А В Д А Н Н Я", { size: PT16, bold: true }),
    c("НА КУРСОВУ РОБОТУ СТУДЕНТУ", { size: PT14, bold: true }),
    c("Степаненку Назару Юрійовичу", { size: PT14 }),
    ...emptyPara(1),
    bodyPara("1.  Тема роботи – «Додаток для фінансового менеджменту»"),
    bodyPara("Керівник курсової роботи – Недашківський О. Л., д.т.н., доцент"),
    bodyPara("2.  Строк подання студентом роботи: «17» травня 2026 р."),
    bodyPara("3.  Вихідні дані до проекту: мова програмування – JavaScript (Node.js), фреймворк – Express 4, база даних – SQLite (better-sqlite3), CSS-фреймворк – Bootstrap 5, візуалізація – Chart.js."),
    bodyPara("4.  Зміст розрахунково-пояснювальної записки: розробити веб-додаток для персонального фінансового менеджменту з функціями обліку доходів та витрат, керування рахунками, категоризації транзакцій, бюджетування та візуалізації фінансового стану."),
    bodyPara("5.  Дата видачі завдання: 15 лютого 2026 р."),
    ...emptyPara(1),
    c("КАЛЕНДАРНИЙ ПЛАН", { size: PT14, bold: true }),
    ...emptyPara(1),
    buildTable(
      ["№", "Назва етапу", "Строк виконання"],
      [
        ["1", "Створення діаграм компонентів, взаємодії та класів", "2 тиждень"],
        ["2", "Проектування структури меню", "3 тиждень"],
        ["3", "Розміщення та стилізація елементів інтерфейсу", "4–5 тижні"],
        ["4", "Проектування та реалізація моделей даних", "6 тиждень"],
        ["5", "Розробка механізмів отримання та оновлення даних", "7–8 тижні"],
        ["6", "Розробка бази даних", "9 тиждень"],
        ["7", "Інтеграція сторонніх сервісів", "10–11 тижні"],
        ["8", "Створення серверної архітектури", "12–13 тижні"],
        ["9", "Реалізація обробки запитів та взаємодії з БД", "14–15 тижні"],
        ["10", "Тестування та налаштування", "16 тиждень"],
      ]
    ),
    ...emptyPara(2),
    para([txt("Студент            _________                 Степаненко Н. Ю.")], { after: 40 }),
    para([txt("Керівник курсової роботи           _________     Недашківський О. Л.")], { after: 40 }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ── АНОТАЦІЯ ────────────────────────────────────────────────────────────────

function anotatsiya() {
  return [
    heading1("АНОТАЦІЯ"),
    bodyPara("У ході виконання курсової роботи розробляється веб-додаток для персонального фінансового менеджменту з використанням стеку технологій Node.js 20, Express 4, SQLite (better-sqlite3), Bootstrap 5, Chart.js. Додаток дозволяє користувачам реєструватись та авторизуватись, керувати фінансовими рахунками, категоризувати транзакції, встановлювати місячні бюджети та візуалізувати фінансовий стан через інтерактивні графіки."),
    bodyPara("Проект розробляється командою з двох осіб з розподілом за функціональними модулями. Автор даного звіту відповідає за модулі авторизації, рахунків/гаманців, дашборду, графіків та інтеграції з API."),
    bodyPara("У даному звіті описано роботу за пунктами 1–4: створення UML-діаграм, проектування меню, стилізація інтерфейсу та реалізація моделі даних."),
    ...emptyPara(1),
    heading1("ANNOTATION"),
    bodyPara("This course work involves the development of a personal finance management web application using Node.js 20, Express 4, SQLite (better-sqlite3), Bootstrap 5, and Chart.js. The application allows users to register and log in, manage financial accounts, categorize transactions, set monthly budgets, and visualize their financial status through interactive charts."),
    bodyPara("The project is developed by a team of two, with responsibilities divided by functional modules. The author of this report is responsible for authentication, accounts/wallets, dashboard, charts, and API integration."),
    bodyPara("This report covers points 1–4: creation of UML diagrams, menu structure design, UI styling, and data model implementation."),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ── Table builder ────────────────────────────────────────────────────────────

const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
const TABLE_BORDERS = {
  top: BORDER, bottom: BORDER, left: BORDER, right: BORDER,
  insideHorizontal: BORDER, insideVertical: BORDER,
};

function buildTable(headerRow, dataRows) {
  const colCount = headerRow.length;
  const makeCell = (text, isHeader) =>
    new TableCell({
      children: [para([txt(text, { size: PT12, bold: isHeader })], { alignment: AlignmentType.LEFT, after: 40 })],
      width: { size: Math.floor(100 / colCount), type: WidthType.PERCENTAGE },
    });

  const rows = [
    new TableRow({ children: headerRow.map((h) => makeCell(h, true)), tableHeader: true }),
    ...dataRows.map((r) => new TableRow({ children: r.map((c) => makeCell(c, false)) })),
  ];

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
  });
}

// ── Image helpers ────────────────────────────────────────────────────────────

function insertImage(filename, caption, opts = {}) {
  const imgPath = path.join(DIAGRAMS, filename);
  const imgBuf = fs.readFileSync(imgPath);
  // Read actual PNG dimensions to preserve aspect ratio
  const pngW = imgBuf.readUInt32BE(16);
  const pngH = imgBuf.readUInt32BE(20);
  const maxW = opts.width || 570;
  const ratio = pngH / pngW;
  const w = maxW;
  const h = Math.round(maxW * ratio);
  return [
    new Paragraph({ children: [] }),
    new Paragraph({
      children: [
        new ImageRun({
          data: imgBuf,
          transformation: { width: w, height: h },
          type: "png",
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    para([txt(caption, { italics: true, size: PT12 })], { alignment: AlignmentType.CENTER, after: 200 }),
  ];
}

function insertScreenshot(filename, caption, opts = {}) {
  const imgPath = path.join(SCREENSHOTS, filename);
  const imgBuf = fs.readFileSync(imgPath);
  const w = opts.width || 570;
  const h = opts.height || 380;
  return [
    new Paragraph({ children: [] }),
    new Paragraph({
      children: [
        new ImageRun({
          data: imgBuf,
          transformation: { width: w, height: h },
          type: "png",
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    para([txt(caption, { italics: true, size: PT12 })], { alignment: AlignmentType.CENTER, after: 200 }),
  ];
}

// ── Section helpers ──────────────────────────────────────────────────────────

function heading1(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: PT16, bold: true })],
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 200, ...LINE_SPACING },
  });
}

function heading2(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: PT14, bold: true })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 120, ...LINE_SPACING },
  });
}

function bodyPara(text) {
  return para(text, { indent: true });
}

// ── ЗМІСТ ────────────────────────────────────────────────────────────────────

function zmistEntry(text, page, indent = false) {
  return new Paragraph({
    children: [
      new TextRun({ text: (indent ? "    " : "") + text, font: FONT, size: PT14 }),
      new TextRun({ text: "\t", font: FONT, size: PT14 }),
      new TextRun({ text: String(page), font: FONT, size: PT14 }),
    ],
    tabStops: [{ type: "right", position: convertMillimetersToTwip(155), leader: "dot" }],
    alignment: AlignmentType.LEFT,
    spacing: { after: 60, ...LINE_SPACING },
  });
}

function zmistSection() {
  return [
    heading1("ЗМІСТ"),
    zmistEntry("АНОТАЦІЯ", 3),
    zmistEntry("ВСТУП", 5),
    zmistEntry("РОЗДІЛ 1. Створення діаграм компонентів, взаємодії та класів", 6),
    zmistEntry("1.1. Діаграма компонентів", 6, true),
    zmistEntry("1.2. Діаграма взаємодії", 8, true),
    zmistEntry("1.3. Діаграма класів", 9, true),
    zmistEntry("РОЗДІЛ 2. Проектування структури меню", 11),
    zmistEntry("2.1. Загальна структура навігації", 11, true),
    zmistEntry("2.2. Обґрунтування вибору структури меню", 12, true),
    zmistEntry("РОЗДІЛ 3. Розміщення та стилізація елементів інтерфейсу", 13),
    zmistEntry("3.1. Технології стилізації", 13, true),
    zmistEntry("3.2. Майстер-шаблон (layout)", 13, true),
    zmistEntry("3.3. Компоненти інтерфейсу", 14, true),
    zmistEntry("3.4. Адаптивний дизайн", 17, true),
    zmistEntry("РОЗДІЛ 4. Модель даних та її реалізація", 19),
    zmistEntry("4.1. Обрана СКБД", 19, true),
    zmistEntry("4.2. Схема бази даних", 19, true),
    zmistEntry("4.3. Зв'язки між таблицями", 21, true),
    zmistEntry("4.4. Ініціалізація бази даних", 22, true),
    zmistEntry("ВИСНОВКИ", 23),
    zmistEntry("СПИСОК ВИКОРИСТАНИХ ДЖЕРЕЛ", 24),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ── ВСТУП ────────────────────────────────────────────────────────────────────

function vstupSection() {
  return [
    heading1("ВСТУП"),
    bodyPara("Управління особистими фінансами є актуальною задачею для кожної людини. У сучасному світі, де обсяги фінансових транзакцій постійно зростають, виникає потреба у зручних інструментах для обліку доходів та витрат, контролю бюджету та аналізу фінансового стану."),
    bodyPara("Метою даної курсової роботи є розробка веб-додатку для персонального фінансового менеджменту, який дозволяє користувачам відстежувати доходи та витрати, керувати рахунками, категоризувати транзакції, встановлювати місячні бюджети та візуалізувати фінансовий стан через графіки та звіти."),
    bodyPara("Додаток розробляється з використанням стеку технологій: Node.js 20 LTS, Express 4, шаблонізатор EJS, база даних SQLite (бібліотека better-sqlite3), CSS-фреймворк Bootstrap 5, бібліотека Chart.js для побудови графіків."),
    bodyPara("Проект розробляється командою з двох осіб з розподілом за функціональними модулями:"),
    para([txt("Степаненко Назар", { bold: true }), txt(" — авторизація, рахунки/гаманці, дашборд, графіки, інтеграція з API")], { indent: true }),
    para([txt("Аніщенко Артем", { bold: true }), txt(" — категорії, транзакції, фільтрація, бюджети, експорт")], { indent: true }),
    bodyPara("У даному звіті описано роботу, виконану за пунктами 1–4 силабусу: створення UML-діаграм, проектування навігаційного меню, розміщення та стилізація елементів інтерфейсу, а також проектування і реалізація моделі даних."),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ── РОЗДІЛ 1 ──────────────────────────────────────────────────────────────────

function rozd1() {
  return [
    heading1("РОЗДІЛ 1. СТВОРЕННЯ ДІАГРАМ КОМПОНЕНТІВ, ВЗАЄМОДІЇ ТА КЛАСІВ"),
    bodyPara("Для документування архітектури додатку було створено три UML-діаграми з використанням Mermaid (mermaid-js/mermaid-cli). Вихідні файли зберігаються у директорії diagrams/ репозиторію як .mmd (текстовий формат) та .png (зображення для звіту)."),

    // 1.1
    heading2("1.1. Діаграма компонентів"),
    bodyPara("Діаграма компонентів відображає загальну архітектуру системи та зв'язки між компонентами додатку."),
    bodyPara("Система складається з трьох основних шарів:"),
    para([txt("1. ", { bold: true }), txt("Browser (Client)", { bold: true }), txt(" — клієнтська частина, що включає: Bootstrap 5 — адаптивний інтерфейс користувача; Chart.js — візуалізація фінансових даних (графіки); Client JavaScript — клієнтська валідація форм.")], { indent: true }),
    para([txt("2. ", { bold: true }), txt("Express 4 Server", { bold: true }), txt(" — серверна частина з архітектурою MVC: Middleware Layer (express-session, connect-flash, express-validator, morgan, Body Parser); Routes Layer (Auth, Dashboard, Accounts, Transactions, Categories, Budgets); Models Layer (User, Account, Transaction, Category, Budget); Views Layer (EJS) — layout.ejs, партіали, сторінки розділів.")], { indent: true }),
    para([txt("3. ", { bold: true }), txt("SQLite Database", { bold: true }), txt(" — база даних з 5 таблицями (users, accounts, categories, transactions, budgets).")], { indent: true }),
    para([txt("4. ", { bold: true }), txt("External Services (Phase 6)", { bold: true }), txt(" — зовнішні сервіси: ExchangeRate API — конвертація валют; Gmail SMTP — повідомлення електронною поштою.")], { indent: true }),
    bodyPara("Зв'язки: Browser ↔ Server через HTTP-запити, Models ↔ Database через SQL-запити (better-sqlite3), Server → зовнішні сервіси через HTTP API та SMTP."),
    ...insertImage("component-diagram.png", "Рис. 1.1 — Діаграма компонентів"),

    // 1.2
    heading2("1.2. Діаграма взаємодії"),
    bodyPara("Діаграма взаємодії (послідовності) демонструє типовий сценарій використання — додавання нової транзакції."),
    bodyPara("Учасники: User (актор), Browser, Express Router (POST /transactions), express-validator, Transaction Model, SQLite Database, EJS View Engine."),
    bodyPara("Сценарій:"),
    para("1. Користувач заповнює форму транзакції (рахунок, категорія, сума, дата).", { indent: true }),
    para("2. Browser надсилає POST /transactions з даними форми.", { indent: true }),
    para("3. Express Router передає дані через ланцюжки валідації express-validator.", { indent: true }),
    para([txt("4. Альтернатива \"Validation Failed\":", { bold: true }), txt(" Router рендерить шаблон transactions/new.ejs з помилками та збереженими даними. Відповідь 422 Unprocessable Entity з повідомленнями про помилки під кожним полем.")], { indent: true }),
    para([txt("5. Альтернатива \"Validation Passed\":", { bold: true }), txt(" Router викликає Transaction.create() з параметрами. Model виконує INSERT INTO transactions. Model оновлює баланс рахунку: UPDATE accounts SET balance = balance ± amount. Router зберігає flash-повідомлення та виконує 302 Redirect на GET /transactions. Browser завантажує список транзакцій з відповідним повідомленням про успіх.")], { indent: true }),
    bodyPara("Діаграма демонструє патерн PRG (Post/Redirect/Get) та двосторонню валідацію, які використовуються у всіх формах додатку."),
    ...insertImage("interaction-diagram.png", "Рис. 1.2 — Діаграма взаємодії"),

    // 1.3
    heading2("1.3. Діаграма класів"),
    bodyPara("Діаграма класів описує п'ять моделей даних додатку, їх атрибути, методи та зв'язки."),
    buildTable(
      ["Клас", "Атрибути", "Основні методи"],
      [
        ["User", "id, email, password_hash, name, created_at", "create(), findByEmail(), findById()"],
        ["Account", "id, user_id, name, type, currency, balance, created_at", "create(), findByUserId(), update(), delete(), updateBalance()"],
        ["Category", "id, user_id, name, type, icon, color", "create(), findByUserId(), findSystem(), update(), delete()"],
        ["Transaction", "id, user_id, account_id, category_id, type, amount, description, date, created_at", "create(), findByUserId(), findFiltered(), update(), delete()"],
        ["Budget", "id, user_id, category_id, month, limit_amount", "create(), findByUserId(), findByMonth(), update(), delete(), getSpent()"],
      ]
    ),
    ...emptyPara(1),
    bodyPara("Зв'язки (7 асоціацій):"),
    para("User 1 → * Account (користувач має кілька рахунків)", { indent: true }),
    para("User 1 → * Transaction (користувач створює транзакції)", { indent: true }),
    para("User 1 → * Budget (користувач встановлює бюджети)", { indent: true }),
    para("User 1 → * Category (користувач визначає категорії)", { indent: true }),
    para("Account 1 → * Transaction (рахунок містить транзакції)", { indent: true }),
    para("Category 1 → * Transaction (категорія класифікує транзакції)", { indent: true }),
    para("Category 1 → * Budget (категорія обмежується бюджетом)", { indent: true }),
    ...insertImage("class-diagram.png", "Рис. 1.3 — Діаграма класів"),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ── РОЗДІЛ 2 ──────────────────────────────────────────────────────────────────

function rozd2() {
  return [
    heading1("РОЗДІЛ 2. ПРОЕКТУВАННЯ СТРУКТУРИ МЕНЮ"),

    heading2("2.1. Загальна структура навігації"),
    bodyPara("Навігаційне меню додатку реалізоване як адаптивний Bootstrap 5 navbar, розміщений у верхній частині кожної сторінки через партіал views/partials/navbar.ejs, який включається у майстер-шаблон views/layout.ejs."),
    bodyPara("Структура меню:"),
    para("Finance Manager (бренд, посилання на головну)", { indent: true }),
    para("├── Dashboard (/) — головна сторінка з оглядом", { indent: true }),
    para("├── Accounts (/accounts) — управління рахунками/гаманцями", { indent: true }),
    para("├── Transactions (/transactions) — список та додавання транзакцій", { indent: true }),
    para("├── Categories (/categories) — категорії доходів/витрат", { indent: true }),
    para("├── Budgets (/budgets) — місячні бюджети", { indent: true }),
    para("└── Login / Register — для неавторизованих; Ім'я + Logout — для авторизованих", { indent: true }),
    bodyPara("Меню використовує клас navbar-expand-lg — на екранах ширше 992px пункти відображаються горизонтально, на менших екранах згортаються у гамбургер-меню з анімацією collapse."),
    ...insertScreenshot("01-login-page.png", "Рис. 2.1 — Навігаційне меню (десктопна версія)"),

    heading2("2.2. Обґрунтування вибору структури меню"),
    bodyPara("При проектуванні меню було враховано наступні фактори:"),
    para([txt("1. Плоска структура", { bold: true }), txt(" — всі основні розділи доступні в один клік з будь-якої сторінки. Для додатку з 5 основними розділами вкладені меню створюють зайву складність.")], { indent: true }),
    para([txt("2. Порядок пунктів", { bold: true }), txt(" відповідає типовому користувацькому сценарію: Dashboard (огляд) → Accounts (налаштування рахунків) → Transactions (щоденна робота) → Categories (налаштування) → Budgets (планування).")], { indent: true }),
    para([txt("3. Авторизаційний стан", { bold: true }), txt(" — пункти Login/Register та ім'я користувача/Logout відображаються умовно залежно від стану авторизації, що забезпечується через res.locals.currentUser.")], { indent: true }),
    para([txt("4. Адаптивність", { bold: true }), txt(" — на мобільних пристроях меню згортається у кнопку-гамбургер (navbar-toggler), що забезпечує зручне використання на екранах будь-якого розміру.")], { indent: true }),
    para([txt("5. Візуальна ієрархія", { bold: true }), txt(" — темний фон навбару (navbar-dark bg-dark) контрастує з основним контентом, забезпечуючи чітке розмежування навігації та вмісту.")], { indent: true }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ── РОЗДІЛ 3 ──────────────────────────────────────────────────────────────────

function rozd3() {
  return [
    heading1("РОЗДІЛ 3. РОЗМІЩЕННЯ ТА СТИЛІЗАЦІЯ ЕЛЕМЕНТІВ ІНТЕРФЕЙСУ"),

    heading2("3.1. Технології стилізації"),
    bodyPara("Для оформлення інтерфейсу використовуються:"),
    buildTable(
      ["Технологія", "Версія", "Призначення"],
      [
        ["Bootstrap 5", "5.3.3", "CSS-фреймворк: сітка, компоненти, утиліти"],
        ["Bootstrap Icons", "1.11.3", "Іконки для навігації та кнопок"],
        ["Custom CSS", "—", "Додаткові стилі (public/css/style.css)"],
      ]
    ),
    ...emptyPara(1),
    bodyPara("Bootstrap підключається через CDN, що не потребує системи збірки та спрощує розгортання."),

    heading2("3.2. Майстер-шаблон (layout)"),
    bodyPara("Файл views/layout.ejs визначає загальну структуру HTML-сторінки. Використовується бібліотека express-ejs-layouts, яка забезпечує патерн <%- body %> для вставки контенту сторінки."),
    bodyPara("Структура шаблону включає: DOCTYPE, head (meta charset, viewport, title, Bootstrap CSS/Icons CDN, custom styles), body (Navbar партіал, main.container.py-4 з flash-повідомленнями та контентом сторінки, Footer партіал, Bootstrap JS Bundle CDN, Client validation script)."),
    bodyPara("Клас container обмежує ширину контенту та центрує його на великих екранах. Клас py-4 забезпечує вертикальні відступи."),

    heading2("3.3. Компоненти інтерфейсу"),
    para([txt("Навігаційна панель", { bold: true }), txt(" (views/partials/navbar.ejs): navbar-dark bg-dark — темна тема; navbar-expand-lg — адаптивне згортання; navbar-toggler + collapse — гамбургер-меню на мобільних; nav-item / nav-link — стилізовані пункти меню.")], { indent: true }),
    para([txt("Flash-повідомлення", { bold: true }), txt(" (views/partials/flash.ejs): alert alert-success / alert-danger — зелені/червоні банери; alert-dismissible fade show — можливість закриття з анімацією; btn-close — кнопка закриття повідомлення.")], { indent: true }),
    para([txt("Картки розділів", { bold: true }), txt(" — кожна сторінка-заглушка використовує Bootstrap card компонент: card shadow-sm — картка з легкою тінню; card-body p-4 — внутрішній відступ; card-title — заголовок розділу.")], { indent: true }),
    para([txt("Форми авторизації", { bold: true }), txt(" (views/auth/register.ejs, views/auth/login.ejs): form-control — стилізовані поля введення; form-label — мітки полів; needs-validation + novalidate — Bootstrap валідація; is-invalid / invalid-feedback — відображення помилок під полями; btn btn-primary w-100 — кнопка на повну ширину.")], { indent: true }),
    ...insertScreenshot("04-dashboard.png", "Рис. 3.1 — Сторінка входу з flash-повідомленням"),
    ...insertScreenshot("02-register-page.png", "Рис. 3.2 — Форма реєстрації"),
    ...insertScreenshot("03-register-validation.png", "Рис. 3.3 — Валідація форми реєстрації"),
    ...insertScreenshot("05-accounts.png", "Рис. 3.4 — Сторінка рахунків з таблицею"),
    ...insertScreenshot("06-transactions.png", "Рис. 3.5 — Сторінка транзакцій з фільтрами"),

    heading2("3.4. Адаптивний дизайн"),
    bodyPara("Адаптивність забезпечується сіткою Bootstrap 5:"),
    buildTable(
      ["Елемент", "Desktop (≥992px)", "Mobile (<992px)"],
      [
        ["Navbar", "Горизонтальні пункти", "Гамбургер-меню"],
        ["Форми авторизації", "col-md-6 col-lg-5 (центровані)", "Повна ширина"],
        ["Контент", "Обмежений container", "Повна ширина з відступами"],
        ["Таблиці", "Стандартне відображення", "table-responsive з горизонтальним скролом"],
      ]
    ),
    ...emptyPara(1),
    bodyPara("Мета-тег <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> забезпечує правильне масштабування на мобільних пристроях."),
    ...insertScreenshot("07-mobile-dashboard.png", "Рис. 3.6 — Мобільна версія дашборду (375px)", { width: 285, height: 620 }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ── РОЗДІЛ 4 ──────────────────────────────────────────────────────────────────

function rozd4() {
  const dbTable = (title, rows) => [
    para([txt(title, { bold: true })], { after: 60 }),
    buildTable(
      ["Поле", "Тип", "Обмеження", "Опис"],
      rows
    ),
    ...emptyPara(1),
  ];

  return [
    heading1("РОЗДІЛ 4. МОДЕЛЬ ДАНИХ ТА ЇЇ РЕАЛІЗАЦІЯ"),

    heading2("4.1. Обрана СКБД"),
    bodyPara("Для зберігання даних обрано SQLite — вбудовану реляційну СКБД, що зберігає дані у одному файлі (finance.db). Підключення реалізовано через бібліотеку better-sqlite3 (v12.x), яка надає синхронний API та найвищу продуктивність серед SQLite-драйверів для Node.js."),
    bodyPara("Обґрунтування вибору:"),
    para("- Не потребує окремого сервера (на відміну від MySQL/PostgreSQL)", { indent: true }),
    para("- Файлова база — спрощує розгортання та резервне копіювання", { indent: true }),
    para("- Синхронний API better-sqlite3 узгоджується з архітектурою Express (серверний рендеринг)", { indent: true }),
    para("- Достатня продуктивність для персонального фінансового додатку", { indent: true }),

    heading2("4.2. Схема бази даних"),
    bodyPara("База даних складається з 5 таблиць. Всі таблиці використовують CREATE TABLE IF NOT EXISTS для ідемпотентного запуску."),

    ...dbTable("Таблиця users — користувачі системи:", [
      ["id", "INTEGER", "PRIMARY KEY AUTOINCREMENT", "Унікальний ідентифікатор"],
      ["email", "TEXT", "UNIQUE NOT NULL", "Електронна пошта (унікальна)"],
      ["password_hash", "TEXT", "NOT NULL", "Хеш пароля (bcrypt)"],
      ["name", "TEXT", "NOT NULL", "Ім'я користувача"],
      ["created_at", "DATETIME", "DEFAULT CURRENT_TIMESTAMP", "Дата реєстрації"],
    ]),
    ...dbTable("Таблиця accounts — рахунки/гаманці:", [
      ["id", "INTEGER", "PRIMARY KEY AUTOINCREMENT", "Унікальний ідентифікатор"],
      ["user_id", "INTEGER", "NOT NULL, FK → users(id) ON DELETE CASCADE", "Власник рахунку"],
      ["name", "TEXT", "NOT NULL", "Назва рахунку"],
      ["type", "TEXT", "NOT NULL, CHECK(IN ('cash','card','savings'))", "Тип рахунку"],
      ["currency", "TEXT", "DEFAULT 'UAH'", "Валюта"],
      ["balance", "REAL", "DEFAULT 0", "Поточний баланс"],
      ["created_at", "DATETIME", "DEFAULT CURRENT_TIMESTAMP", "Дата створення"],
    ]),
    ...dbTable("Таблиця categories — категорії доходів/витрат:", [
      ["id", "INTEGER", "PRIMARY KEY AUTOINCREMENT", "Унікальний ідентифікатор"],
      ["user_id", "INTEGER", "NULL (системні категорії)", "Власник категорії"],
      ["name", "TEXT", "NOT NULL", "Назва категорії"],
      ["type", "TEXT", "NOT NULL, CHECK(IN ('income','expense'))", "Тип: дохід/витрата"],
      ["icon", "TEXT", "—", "Іконка"],
      ["color", "TEXT", "—", "Колір"],
    ]),
    ...dbTable("Таблиця transactions — фінансові транзакції:", [
      ["id", "INTEGER", "PRIMARY KEY AUTOINCREMENT", "Унікальний ідентифікатор"],
      ["user_id", "INTEGER", "NOT NULL, FK → users(id) ON DELETE CASCADE", "Автор транзакції"],
      ["account_id", "INTEGER", "NOT NULL, FK → accounts(id) ON DELETE CASCADE", "Рахунок"],
      ["category_id", "INTEGER", "NOT NULL, FK → categories(id) ON DELETE RESTRICT", "Категорія"],
      ["type", "TEXT", "NOT NULL, CHECK(IN ('income','expense'))", "Тип: дохід/витрата"],
      ["amount", "REAL", "NOT NULL, CHECK(amount > 0)", "Сума (завжди додатня)"],
      ["description", "TEXT", "—", "Опис/коментар"],
      ["date", "DATE", "NOT NULL", "Дата транзакції"],
      ["created_at", "DATETIME", "DEFAULT CURRENT_TIMESTAMP", "Дата створення запису"],
    ]),
    ...dbTable("Таблиця budgets — місячні бюджети:", [
      ["id", "INTEGER", "PRIMARY KEY AUTOINCREMENT", "Унікальний ідентифікатор"],
      ["user_id", "INTEGER", "NOT NULL, FK → users(id) ON DELETE CASCADE", "Власник бюджету"],
      ["category_id", "INTEGER", "NOT NULL, FK → categories(id) ON DELETE CASCADE", "Категорія"],
      ["month", "TEXT", "NOT NULL", "Місяць (формат YYYY-MM)"],
      ["limit_amount", "REAL", "NOT NULL, CHECK(limit_amount > 0)", "Ліміт витрат"],
      ["", "", "UNIQUE(user_id, category_id, month)", "Один бюджет на категорію/місяць"],
    ]),

    heading2("4.3. Зв'язки між таблицями"),
    para("users (1) ——— (*) accounts", { indent: true }),
    para("users (1) ——— (*) transactions", { indent: true }),
    para("users (1) ——— (*) budgets", { indent: true }),
    para("users (1) ——— (*) categories", { indent: true }),
    para("accounts (1) ——— (*) transactions", { indent: true }),
    para("categories (1) ——— (*) transactions (ON DELETE RESTRICT)", { indent: true }),
    para("categories (1) ——— (*) budgets (ON DELETE CASCADE)", { indent: true }),
    ...emptyPara(1),
    bodyPara("Особливості:"),
    para([txt("CASCADE", { bold: true }), txt(" — видалення користувача автоматично видаляє всі його рахунки, транзакції, бюджети.")], { indent: true }),
    para([txt("RESTRICT", { bold: true }), txt(" — категорію неможливо видалити, якщо до неї прив'язані транзакції (захист даних).")], { indent: true }),
    para([txt("PRAGMA foreign_keys = ON", { bold: true }), txt(" — зовнішні ключі вмикаються при кожному підключенні (SQLite вимикає їх за замовчуванням).")], { indent: true }),

    heading2("4.4. Ініціалізація бази даних"),
    bodyPara("Файл config/database.js виконує ініціалізацію при запуску додатку:"),
    bodyPara("const db = new Database(DB_PATH);"),
    bodyPara("db.pragma('journal_mode = WAL'); // Write-Ahead Logging для продуктивності"),
    bodyPara("db.pragma('foreign_keys = ON'); // Увімкнення зовнішніх ключів"),
    bodyPara("db.exec(schema); // Створення таблиць (IF NOT EXISTS)"),
    ...emptyPara(1),
    bodyPara("Початкові дані (db/seed.sql) містять 10 передвизначених категорій:"),
    para([txt("Витрати (5):", { bold: true }), txt(" Food & Dining, Transportation, Housing, Entertainment, Healthcare")], { indent: true }),
    para([txt("Доходи (5):", { bold: true }), txt(" Salary, Freelance, Investments, Gifts, Other Income")], { indent: true }),
    bodyPara("Сіди вставляються лише якщо таблиця категорій порожня, що запобігає дублюванню при перезапуску."),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ── ВИСНОВКИ ─────────────────────────────────────────────────────────────────

function vysnovky() {
  return [
    heading1("ВИСНОВКИ"),
    bodyPara("У ході виконання пунктів 1–4 курсової роботи було:"),
    para([txt("1. Створено три UML-діаграми", { bold: true }), txt(" (компонентів, взаємодії, класів) з використанням Mermaid, що документують архітектуру додатку, типовий сценарій взаємодії та модель даних.")], { indent: true }),
    para([txt("2. Спроектовано навігаційне меню", { bold: true }), txt(" з використанням Bootstrap 5 navbar з адаптивним згортанням. Меню має плоску структуру з 5 основними розділами та умовним відображенням авторизаційних елементів.")], { indent: true }),
    para([txt("3. Розроблено інтерфейс", { bold: true }), txt(" на основі Bootstrap 5 з використанням адаптивної сітки, компонентів (cards, forms, alerts, tables) та майстер-шаблону EJS. Інтерфейс коректно відображається на десктопних та мобільних пристроях.")], { indent: true }),
    para([txt("4. Реалізовано модель даних", { bold: true }), txt(" у вигляді реляційної SQLite бази з 5 таблицями, 7 зв'язками через зовнішні ключі, CHECK-обмеженнями та ідемпотентною ініціалізацією при запуску.")], { indent: true }),
    bodyPara("Додаток запускається командою npm start та доступний за адресою http://localhost:3000."),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ── СПИСОК ДЖЕРЕЛ ────────────────────────────────────────────────────────────

function dzherela() {
  const sources = [
    "Express.js 4.x — API Reference. URL: https://expressjs.com/en/4x/api.html",
    "Bootstrap 5.3 — Documentation. URL: https://getbootstrap.com/docs/5.3/",
    "better-sqlite3 — GitHub Repository. URL: https://github.com/WiseLibs/better-sqlite3",
    "EJS — Embedded JavaScript Templates. URL: https://ejs.co/",
    "express-validator 7.x — Documentation. URL: https://express-validator.github.io/docs/",
    "express-ejs-layouts — npm Package. URL: https://www.npmjs.com/package/express-ejs-layouts",
    "Mermaid — Diagramming and charting tool. URL: https://mermaid.js.org/",
    "SQLite — Documentation. URL: https://www.sqlite.org/docs.html",
    "Node.js 20 LTS — Documentation. URL: https://nodejs.org/docs/latest-v20.x/api/",
    "Chart.js — Simple yet flexible JavaScript charting. URL: https://www.chartjs.org/",
  ];
  return [
    heading1("СПИСОК ВИКОРИСТАНИХ ДЖЕРЕЛ"),
    ...sources.map((s, i) => para(`${i + 1}. ${s}`, { indent: true })),
  ];
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Generating DOCX report...");

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: PT14 },
          paragraph: { spacing: LINE_SPACING },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertMillimetersToTwip(20),
              bottom: convertMillimetersToTwip(20),
              left: convertMillimetersToTwip(30),
              right: convertMillimetersToTwip(20),
            },
          },
        },
        children: [
          ...titlePage(),
          ...zavdannyaPage(),
          ...anotatsiya(),
          ...zmistSection(),
          ...vstupSection(),
          ...rozd1(),
          ...rozd2(),
          ...rozd3(),
          ...rozd4(),
          ...vysnovky(),
          ...dzherela(),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUTPUT, buffer);
  const stats = fs.statSync(OUTPUT);
  console.log(`Done! Output: ${OUTPUT}`);
  console.log(`File size: ${(stats.size / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
