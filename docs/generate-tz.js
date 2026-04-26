const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageBreak, Table, TableRow, TableCell, WidthType, BorderStyle,
  convertMillimetersToTwip, LineRuleType,
} = require("docx");

const OUTPUT = path.join(__dirname, "TZ_TB-43_Stepanenko_Anishchenko.docx");

const FONT = "Times New Roman";
const PT14 = 28;
const PT16 = 32;
const PT12 = 24;
const LINE_SPACING = { line: 360, rule: LineRuleType.AUTO };

function txt(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: opts.size || PT14, bold: !!opts.bold, italics: !!opts.italics });
}

function para(runs, opts = {}) {
  if (typeof runs === "string") runs = [txt(runs, opts)];
  return new Paragraph({
    children: runs,
    alignment: opts.alignment || AlignmentType.JUSTIFIED,
    spacing: { after: opts.after !== undefined ? opts.after : 120, ...LINE_SPACING },
    indent: opts.indent ? { firstLine: convertMillimetersToTwip(12.5) } : undefined,
    heading: opts.heading,
  });
}

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

function bodyPara(text) { return para(text, { indent: true }); }
function emptyPara(n = 1) {
  const a = [];
  for (let i = 0; i < n; i++) a.push(new Paragraph({ children: [txt("")], spacing: LINE_SPACING }));
  return a;
}

const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
const TABLE_BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER, insideHorizontal: BORDER, insideVertical: BORDER };

function buildTable(headerRow, dataRows) {
  const colCount = headerRow.length;
  const makeCell = (text, isHeader) =>
    new TableCell({
      children: [para([txt(text, { size: PT12, bold: isHeader })], { alignment: AlignmentType.LEFT, after: 40 })],
      width: { size: Math.floor(100 / colCount), type: WidthType.PERCENTAGE },
    });
  return new Table({
    rows: [
      new TableRow({ children: headerRow.map(h => makeCell(h, true)), tableHeader: true }),
      ...dataRows.map(r => new TableRow({ children: r.map(c => makeCell(c, false)) })),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
  });
}

async function main() {
  console.log("Generating ТЗ...");

  const c = (text, opts = {}) =>
    para([txt(text, opts)], { alignment: AlignmentType.CENTER, after: opts.after !== undefined ? opts.after : 60 });

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: FONT, size: PT14 }, paragraph: { spacing: LINE_SPACING } },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertMillimetersToTwip(20), bottom: convertMillimetersToTwip(20),
            left: convertMillimetersToTwip(30), right: convertMillimetersToTwip(20),
          },
        },
      },
      children: [
        // ── Title ──
        heading1("ТЕХНІЧНЕ ЗАВДАННЯ"),
        ...emptyPara(1),

        // ── Тема ──
        heading2("Обрана тема"),
        bodyPara("Тема 31. Додаток для фінансового менеджменту: веб-додаток, який дозволяє користувачам відстежувати свої доходи та витрати, керувати фінансовими рахунками, категоризувати транзакції, встановлювати місячні бюджети та візуалізувати фінансовий стан через інтерактивні графіки та звіти."),
        bodyPara("Додаток використовує зовнішні API для конвертації валют (ExchangeRate API) та надсилання email-повідомлень (Gmail SMTP) при перевищенні бюджету."),

        // ── Команда ──
        heading2("Команда"),
        bodyPara("Команда складається з двох осіб:"),
        para([txt("Степаненко Назар Юрійович", { bold: true }), txt(" — група ТВ-43")], { indent: true }),
        para([txt("Аніщенко Артем", { bold: true }), txt(" — група ТВ-43")], { indent: true }),

        // ── Стек ──
        heading2("Стек технологій"),
        buildTable(
          ["Технологія", "Версія", "Призначення"],
          [
            ["Node.js", "20 LTS", "Серверне середовище виконання"],
            ["Express", "4.x", "Веб-фреймворк (MVC, маршрутизація)"],
            ["SQLite", "better-sqlite3 12.x", "Реляційна СКБД (файлова)"],
            ["EJS", "3.x", "Шаблонізатор (серверний рендеринг)"],
            ["Bootstrap", "5.3", "CSS-фреймворк (адаптивний дизайн)"],
            ["Chart.js", "4.x", "Візуалізація даних (графіки)"],
            ["express-validator", "7.x", "Валідація вхідних даних"],
            ["bcrypt", "—", "Хешування паролів"],
            ["Nodemailer", "—", "Надсилання email-повідомлень"],
          ]
        ),
        ...emptyPara(1),

        // ── Функціональність ──
        heading2("Опис функціональності"),
        para([txt("Модуль авторизації:", { bold: true })], { indent: true }),
        para("— Реєстрація за допомогою email та пароля", { indent: true }),
        para("— Логін з перевіркою хешу пароля (bcrypt)", { indent: true }),
        para("— Логаут (знищення сесії)", { indent: true }),
        para("— Захист маршрутів через middleware", { indent: true }),
        ...emptyPara(1),
        para([txt("Рахунки/гаманці:", { bold: true })], { indent: true }),
        para("— Створення рахунків (готівка, картка, заощадження) з валютою", { indent: true }),
        para("— Перегляд, редагування та видалення рахунків", { indent: true }),
        para("— Автоматичне оновлення балансу при транзакціях", { indent: true }),
        ...emptyPara(1),
        para([txt("Категорії:", { bold: true })], { indent: true }),
        para("— 10 системних категорій (5 витрат, 5 доходів)", { indent: true }),
        para("— Створення, редагування та видалення користувацьких категорій", { indent: true }),
        ...emptyPara(1),
        para([txt("Транзакції:", { bold: true })], { indent: true }),
        para("— Додавання транзакцій (тип, сума, дата, категорія, рахунок, опис)", { indent: true }),
        para("— Редагування та видалення з оновленням балансу", { indent: true }),
        para("— Фільтрація за датою, категорією, рахунком, типом", { indent: true }),
        para("— Пагінація списку", { indent: true }),
        ...emptyPara(1),
        para([txt("Дашборд:", { bold: true })], { indent: true }),
        para("— Загальний баланс по всіх рахунках", { indent: true }),
        para("— Доходи/витрати поточного місяця", { indent: true }),
        para("— Останні транзакції", { indent: true }),
        para("— Кругова діаграма витрат за категоріями (Chart.js)", { indent: true }),
        para("— Стовпчикова діаграма доходи vs витрати по місяцях", { indent: true }),
        ...emptyPara(1),
        para([txt("Бюджети:", { bold: true })], { indent: true }),
        para("— Встановлення місячного ліміту витрат за категорією", { indent: true }),
        para("— Прогрес-бар виконання бюджету", { indent: true }),
        para("— Email-повідомлення при перевищенні ліміту", { indent: true }),
        ...emptyPara(1),
        para([txt("Інтеграція:", { bold: true })], { indent: true }),
        para("— Курси валют через ExchangeRate API", { indent: true }),
        para("— Конвертація сум між валютами", { indent: true }),
        para("— Email-нотифікації через Gmail SMTP (Nodemailer)", { indent: true }),
        ...emptyPara(1),
        para([txt("Експорт:", { bold: true })], { indent: true }),
        para("— Експорт транзакцій у CSV з урахуванням фільтрів", { indent: true }),

        new Paragraph({ children: [new PageBreak()] }),

        // ── Зони відповідальності ──
        heading2("Зони відповідальності"),
        para([txt("Степаненко Назар:", { bold: true })], { indent: true }),
        para("— Модуль авторизації (реєстрація, логін, логаут, захист маршрутів)", { indent: true }),
        para("— Рахунки/гаманці (CRUD, баланси)", { indent: true }),
        para("— Дашборд (зведена інформація, графіки Chart.js)", { indent: true }),
        para("— Інтеграція з ExchangeRate API та Gmail SMTP", { indent: true }),
        para("— Серверна архітектура та конфігурація", { indent: true }),
        ...emptyPara(1),
        para([txt("Аніщенко Артем:", { bold: true })], { indent: true }),
        para("— Категорії (CRUD, системні + користувацькі)", { indent: true }),
        para("— Транзакції (CRUD, фільтрація, пагінація)", { indent: true }),
        para("— Бюджети (CRUD, прогрес-бар, перевищення)", { indent: true }),
        para("— Експорт транзакцій у CSV", { indent: true }),

        // ── Календарний план ──
        ...emptyPara(1),
        heading2("Календарний план робіт"),
        buildTable(
          ["Етап", "Опис", "Строк"],
          [
            ["1", "Технічне завдання, діаграми, меню, UI, модель даних", "Тижні 1–6"],
            ["2", "Авторизація та CRUD рахунків/категорій", "Тижні 7–8"],
            ["3", "Транзакції, фільтрація, бюджети", "Тижні 9–11"],
            ["4", "Дашборд, графіки Chart.js", "Тижні 12–13"],
            ["5", "Інтеграція API, email, експорт CSV", "Тижні 14–15"],
            ["6", "Тестування та налаштування", "Тиждень 16"],
            ["7", "Оформлення звіту та здача", "Тиждень 17"],
          ]
        ),
        ...emptyPara(1),

        // ── Схема БД ──
        heading2("Модель даних"),
        bodyPara("База даних SQLite складається з 5 таблиць:"),
        para("— users (id, email, password_hash, name, created_at)", { indent: true }),
        para("— accounts (id, user_id, name, type, currency, balance, created_at)", { indent: true }),
        para("— categories (id, user_id, name, type, icon, color)", { indent: true }),
        para("— transactions (id, user_id, account_id, category_id, type, amount, description, date, created_at)", { indent: true }),
        para("— budgets (id, user_id, category_id, month, limit_amount)", { indent: true }),
        ...emptyPara(1),
        bodyPara("Зв'язки: User 1→* Account, User 1→* Transaction, Account 1→* Transaction, Category 1→* Transaction (RESTRICT), Category 1→* Budget (CASCADE), User 1→* Budget, User 1→* Category."),

        // ── GitHub ──
        ...emptyPara(1),
        heading2("Репозиторій"),
        bodyPara("GitHub: https://github.com/d3Par1/Coursework_Web"),
        bodyPara("Гілка розробки: develop"),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUTPUT, buffer);
  const stats = fs.statSync(OUTPUT);
  console.log(`Done! Output: ${OUTPUT}`);
  console.log(`File size: ${(stats.size / 1024).toFixed(1)} KB`);
}

main().catch(err => { console.error("Error:", err); process.exit(1); });
