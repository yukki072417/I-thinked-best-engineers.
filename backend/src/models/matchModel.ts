import { pool } from "../db.js";

export type Difficulty = "beginner" | "intermediate" | "advanced";
export type MatchResult = "win" | "lose" | "draw";

export interface MatchTurn {
  turn: number;
  phase: "planning" | "implementation";
  progress: number;
  modifiers: {
    condition:  { state: string; effect: number };
    motivation: { state: string; effect: number };
    event: { type: string; effect: number } | null;
  };
}

export interface Match {
  id: string;
  difficulty: Difficulty;
  result: MatchResult;
  my_deck_score: number;
  opponent_login: string;
  opponent_deck_score: number;
  my_development_score: number;
  opponent_development_score: number;
  turns: MatchTurn[];
  played_at: string;
}

export async function saveMatch(
  player_login: string,
  data: Omit<Match, "turns"> & { turns: MatchTurn[] }
): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `INSERT INTO matches
         (id, player_login, opponent_login, difficulty, result,
          player_deck_score, opponent_deck_score,
          player_development_score, opponent_development_score, played_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        player_login,
        data.opponent_login,
        data.difficulty,
        data.result,
        data.my_deck_score,
        data.opponent_deck_score,
        data.my_development_score,
        data.opponent_development_score,
        data.played_at,
      ]
    );

    for (const t of data.turns) {
      await conn.execute(
        `INSERT INTO match_turns
           (match_id, turn_number, phase, progress,
            condition_state, condition_effect,
            motivation_state, motivation_effect,
            event_type, event_effect)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id,
          t.turn,
          t.phase,
          t.progress,
          t.modifiers.condition.state,
          t.modifiers.condition.effect,
          t.modifiers.motivation.state,
          t.modifiers.motivation.effect,
          t.modifiers.event?.type ?? null,
          t.modifiers.event?.effect ?? null,
        ]
      );
    }

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function findMatches(
  player_login: string,
  limit: number,
  offset: number
): Promise<{ total: number; matches: Omit<Match, "turns">[] }> {
  const [countRows] = await pool.execute<any[]>(
    "SELECT COUNT(*) AS total FROM matches WHERE player_login = ?",
    [player_login]
  );
  const total = countRows[0].total;

  const [rows] = await pool.execute<any[]>(
    `SELECT id, difficulty, result,
            player_deck_score AS my_deck_score,
            opponent_login,
            opponent_deck_score,
            player_development_score AS my_development_score,
            opponent_development_score,
            played_at
     FROM matches
     WHERE player_login = ?
     ORDER BY played_at DESC
     LIMIT ? OFFSET ?`,
    [player_login, limit, offset]
  );

  return { total, matches: rows };
}

export async function findRecentOpponents(player_login: string, count = 3): Promise<string[]> {
  const [rows] = await pool.execute<any[]>(
    `SELECT opponent_login FROM matches
     WHERE player_login = ?
     ORDER BY played_at DESC LIMIT ?`,
    [player_login, count]
  );
  return rows.map((r: any) => r.opponent_login);
}
