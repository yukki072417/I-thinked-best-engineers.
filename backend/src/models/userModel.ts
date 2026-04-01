import { pool } from "../db.js";

export interface User {
  id: string;
  github_login: string;
  name: string | null;
  avatar_url: string;
  friend_approval_required: boolean;
  created_at: string;
  updated_at: string;
}

export async function upsertUser(data: Pick<User, "github_login" | "name" | "avatar_url">): Promise<User> {
  await pool.execute(
    `INSERT INTO users (github_login, name, avatar_url)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), avatar_url = VALUES(avatar_url)`,
    [data.github_login, data.name, data.avatar_url]
  );
  return findByLogin(data.github_login) as Promise<User>;
}

export async function findByLogin(github_login: string): Promise<User | null> {
  const [rows] = await pool.execute<any[]>(
    "SELECT * FROM users WHERE github_login = ?",
    [github_login]
  );
  return rows[0] ?? null;
}

export async function updateSettings(github_login: string, friend_approval_required: boolean): Promise<void> {
  await pool.execute(
    "UPDATE users SET friend_approval_required = ? WHERE github_login = ?",
    [friend_approval_required, github_login]
  );
}
