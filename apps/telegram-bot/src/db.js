import { DatabaseSync } from "node:sqlite";

export const db = new DatabaseSync("db/bot.db", {
  verbose: console.log,
});

export const initDb = () =>
  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    telegram_id INTEGER PRIMARY KEY,
    username TEXT,
    user_id TEXT,
    session_token TEXT,
    language TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export const createNewUser = ({
  telegramId,
  username,
  userId,
  session_token = null,
  language,
}) => {
  const stmt = db.prepare(
    "INSERT INTO users (telegram_id, username, user_id, session_token, language) VALUES (?, ?, ?, ?, ?)"
  );

  stmt.run(telegramId, username, userId, session_token, language);
};

export const findUserByTelegramId = (telegramId) => {
  const stmt = db.prepare("SELECT * FROM users WHERE telegram_id = ?");
  return stmt.get(telegramId);
};

export const updateUserByTelegramId = (
  telegramId,
  { session_token, userId }
) => {
  const updates = [];
  const values = [];

  if (session_token !== undefined) {
    updates.push("session_token = ?");
    values.push(session_token || null);
  }
  if (userId !== undefined) {
    updates.push("user_id = ?");
    values.push(userId);
  }

  if (updates.length === 0) return;

  values.push(telegramId);
  const stmt = db.prepare(
    `UPDATE users SET ${updates.join(", ")} WHERE telegram_id = ?`
  );
  return stmt.run(...values);
};
