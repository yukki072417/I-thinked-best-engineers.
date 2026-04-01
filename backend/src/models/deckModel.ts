import { pool } from "../db.js";
import type { Character } from "./characterModel.js";

export interface DeckMember {
  github_login: string;
  name: string | null;
  avatar_url: string;
  skill_impl: number;
  skill_planning: number;
  skill_speed: number;
  tendency: Character["tendency"];
}

export interface Deck {
  id: string;
  owner_login: string;
  deck_score: number;
  is_registered: boolean;
  registered_at: string | null;
  members: DeckMember[];
}

export async function findByOwner(owner_login: string): Promise<Deck | null> {
  const [decks] = await pool.execute<any[]>(
    "SELECT * FROM decks WHERE owner_login = ?",
    [owner_login]
  );
  if (!decks[0]) return null;

  const deck = decks[0];
  const [members] = await pool.execute<any[]>(
    `SELECT c.github_login, u.name, u.avatar_url,
            c.skill_impl, c.skill_planning, c.skill_speed, c.tendency
     FROM deck_members dm
     JOIN characters c ON c.github_login = dm.member_login
     JOIN users u      ON u.github_login = dm.member_login
     WHERE dm.deck_id = ?
     ORDER BY dm.position`,
    [deck.id]
  );

  return { ...deck, is_registered: !!deck.is_registered, members };
}

export async function upsertDeck(owner_login: string, member_logins: string[]): Promise<Deck> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // deck_score を計算（実装力×0.45 + 開発速度×0.35 + 企画力×0.20）
    const [chars] = await conn.execute<any[]>(
      `SELECT
         skill_impl,
         skill_planning,
         skill_speed,
         skill_review,
         skill_stamina,
         skill_adaptability
       FROM characters WHERE github_login IN (${member_logins.map(() => "?").join(",")})`,
      member_logins
    );
    const deckScore = Math.round(
      chars.reduce((sum: number, c: any) => {
        return (
          sum +
          c.skill_impl * 0.3 +
          c.skill_speed * 0.23 +
          c.skill_planning * 0.17 +
          c.skill_review * 0.12 +
          c.skill_stamina * 0.1 +
          c.skill_adaptability * 0.08
        );
      }, 0)
    );

    await conn.execute(
      `INSERT INTO decks (owner_login, deck_score)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE deck_score = VALUES(deck_score)`,
      [owner_login, deckScore]
    );

    const [decks] = await conn.execute<any[]>(
      "SELECT id FROM decks WHERE owner_login = ?",
      [owner_login]
    );
    const deckId = decks[0].id;

    await conn.execute("DELETE FROM deck_members WHERE deck_id = ?", [deckId]);
    for (let i = 0; i < member_logins.length; i++) {
      await conn.execute(
        "INSERT INTO deck_members (deck_id, member_login, position) VALUES (?, ?, ?)",
        [deckId, member_logins[i], i + 1]
      );
    }

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  return findByOwner(owner_login) as Promise<Deck>;
}

export async function registerDeck(owner_login: string): Promise<{ deck_score: number; registered_at: string }> {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  await pool.execute(
    "UPDATE decks SET is_registered = 1, registered_at = ? WHERE owner_login = ?",
    [now, owner_login]
  );
  const [rows] = await pool.execute<any[]>(
    "SELECT deck_score, registered_at FROM decks WHERE owner_login = ?",
    [owner_login]
  );
  return rows[0];
}

export async function findRegisteredNear(
  deckScore: number,
  excludeLogin: string,
  difficulty: string,
  recentOpponents: string[]
): Promise<{ owner_login: string; deck_score: number } | null> {
  const exclude = [excludeLogin, ...recentOpponents];
  const placeholders = exclude.map(() => "?").join(",");
  const [rows] = await pool.execute<any[]>(
    `SELECT owner_login, deck_score FROM decks
     WHERE is_registered = 1
       AND owner_login NOT IN (${placeholders})
     ORDER BY ABS(deck_score - ?) ASC
     LIMIT 1`,
    [...exclude, deckScore]
  );
  return rows[0] ?? null;
}
