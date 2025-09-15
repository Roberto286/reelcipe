import { DatabaseSync } from "node:sqlite";

export const db = new DatabaseSync("db/bot.db", {
    verbose: console.log,
});

export const initDb = () =>
    db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    telegram_id INTEGER PRIMARY KEY,
    username TEXT,
    supabase_user_id TEXT,
    access_token TEXT,
    refresh_token TEXT,
    language TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export const createNewUser = (
    {
        telegramId,
        username,
        supabaseUserId,
        access_token = null,
        refresh_token,
        language,
    },
) => {
    const stmt = db.prepare(
        "INSERT INTO users (telegram_id, username, supabase_user_id, access_token, refresh_token, language) VALUES (?, ?, ?, ?, ?, ?)",
    );

    stmt.run(
        telegramId,
        username,
        supabaseUserId,
        access_token,
        refresh_token,
        language,
    );
};

export const findUserByTelegramId = (telegramId) => {
    const stmt = db.prepare("SELECT * FROM users WHERE telegram_id = ?");
    return stmt.get(telegramId);
};

export const updateUserByTelegramId = (
    telegramId,
    { access_token, refresh_token },
) => {
    const stmt = db.prepare(
        "UPDATE users SET access_token = ?, refresh_token = ? WHERE telegram_id = ?",
    );
    return stmt.run(access_token || null, refresh_token || null, telegramId);
};
