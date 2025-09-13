import { DatabaseSync } from "node:sqlite";

export const db = new DatabaseSync("bot.db", {
    verbose: console.log,
});

export const initDb = () =>
    db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    telegram_id INTEGER PRIMARY KEY,
    username TEXT,
    supabase_user_id TEXT,
    refresh_token TEXT,
    language TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export const createNewUser = (
    { telegramId, username, supabaseUserId, refresh_token, language },
) => {
    const stmt = db.prepare(
        "INSERT INTO users (telegram_id, username, supabase_user_id, refresh_token, language) VALUES (?, ?, ?,?,?)",
    );

    stmt.run(
        telegramId,
        username,
        supabaseUserId,
        refresh_token,
        language,
    );
};

export const findUserByTelegramId = (telegramId) => {
    const stmt = db.prepare("SELECT * FROM users WHERE telegram_id = ?");
    return stmt.get(telegramId);
};
