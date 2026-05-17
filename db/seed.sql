-- Predefined system categories (user_id IS NULL = system category)
-- Expense categories
INSERT OR IGNORE INTO categories (user_id, name, type, icon, color)
SELECT NULL, 'Food & Dining', 'expense', '🛒', '#e74c3c'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Food & Dining');

INSERT OR IGNORE INTO categories (user_id, name, type, icon, color)
SELECT NULL, 'Transportation', 'expense', '🚌', '#e67e22'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Transportation');

INSERT OR IGNORE INTO categories (user_id, name, type, icon, color)
SELECT NULL, 'Housing', 'expense', '🏠', '#9b59b6'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Housing');

INSERT OR IGNORE INTO categories (user_id, name, type, icon, color)
SELECT NULL, 'Entertainment', 'expense', '🎬', '#3498db'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Entertainment');

INSERT OR IGNORE INTO categories (user_id, name, type, icon, color)
SELECT NULL, 'Healthcare', 'expense', '❤️', '#1abc9c'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Healthcare');

-- Income categories
INSERT OR IGNORE INTO categories (user_id, name, type, icon, color)
SELECT NULL, 'Salary', 'income', '💼', '#27ae60'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Salary');

INSERT OR IGNORE INTO categories (user_id, name, type, icon, color)
SELECT NULL, 'Freelance', 'income', '💻', '#2ecc71'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Freelance');

INSERT OR IGNORE INTO categories (user_id, name, type, icon, color)
SELECT NULL, 'Investments', 'income', '📈', '#f39c12'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Investments');

INSERT OR IGNORE INTO categories (user_id, name, type, icon, color)
SELECT NULL, 'Gifts', 'income', '🎁', '#e91e63'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Gifts');

INSERT OR IGNORE INTO categories (user_id, name, type, icon, color)
SELECT NULL, 'Other Income', 'income', '💵', '#95a5a6'
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE user_id IS NULL AND name = 'Other Income');