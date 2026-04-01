import { pool } from "../db.js";

export interface Character {
  id: string;
  github_login: string;
  skill_impl: number;
  skill_planning: number;
  skill_speed: number;
  skill_review: number;
  skill_stamina: number;
  skill_adaptability: number;
  tech_primary: string[];
  tech_all: string[];
  tendency: "implementation" | "planning" | "balanced";
  deck_score: number;
  created_at: string;
  updated_at: string;
}

function toCharacter(row: any): Character {
  return {
    ...row,
    tech_primary: typeof row.tech_primary === "string" ? JSON.parse(row.tech_primary) : row.tech_primary,
    tech_all:     typeof row.tech_all     === "string" ? JSON.parse(row.tech_all)     : row.tech_all,
  };
}

export async function upsertCharacter(data: Omit<Character, "id" | "created_at" | "updated_at">): Promise<Character> {
  await pool.execute(
    `INSERT INTO characters
       (
         github_login,
         skill_impl,
         skill_planning,
         skill_speed,
         skill_review,
         skill_stamina,
         skill_adaptability,
         tech_primary,
         tech_all,
         tendency,
         deck_score
       )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       skill_impl = VALUES(skill_impl),
       skill_planning = VALUES(skill_planning),
       skill_speed = VALUES(skill_speed),
       skill_review = VALUES(skill_review),
       skill_stamina = VALUES(skill_stamina),
       skill_adaptability = VALUES(skill_adaptability),
       tech_primary = VALUES(tech_primary),
       tech_all = VALUES(tech_all),
       tendency = VALUES(tendency),
       deck_score = VALUES(deck_score)`,
    [
      data.github_login,
      data.skill_impl,
      data.skill_planning,
      data.skill_speed,
      data.skill_review,
      data.skill_stamina,
      data.skill_adaptability,
      JSON.stringify(data.tech_primary),
      JSON.stringify(data.tech_all),
      data.tendency,
      data.deck_score,
    ]
  );
  return findByLogin(data.github_login) as Promise<Character>;
}

export async function findByLogin(github_login: string): Promise<Character | null> {
  const [rows] = await pool.execute<any[]>(
    "SELECT * FROM characters WHERE github_login = ?",
    [github_login]
  );
  return rows[0] ? toCharacter(rows[0]) : null;
}
