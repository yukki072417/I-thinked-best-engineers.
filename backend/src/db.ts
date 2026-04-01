import mysql, { type RowDataPacket } from "mysql2/promise";

export const pool = mysql.createPool({
  host:     process.env.DB_HOST     ?? "127.0.0.1",
  port:     Number(process.env.DB_PORT ?? 3306),
  database: process.env.DB_NAME     ?? "engineer_game",
  user:     process.env.DB_USER     ?? "engineer_game_user",
  password: process.env.DB_PASSWORD ?? "password",
  waitForConnections: true,
  connectionLimit: 10,
});

type ColumnInfo = RowDataPacket & {
  DATA_TYPE: string;
};

async function getColumnType(
  tableName: string,
  columnName: string
): Promise<string | null> {
  const [rows] = await pool.execute<ColumnInfo[]>(
    `SELECT DATA_TYPE
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );

  return rows[0]?.DATA_TYPE ?? null;
}

export async function ensureDatabaseSchema(): Promise<void> {
  const skillImplType = await getColumnType("characters", "skill_impl");
  if (skillImplType === null) {
    return;
  }

  const skillReviewType = await getColumnType("characters", "skill_review");
  if (skillReviewType === null) {
    await pool.execute(`
      ALTER TABLE characters
        ADD COLUMN skill_review INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'レビュー力スコア（上限なし）' AFTER skill_speed,
        ADD COLUMN skill_stamina INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '持続力スコア（上限なし）' AFTER skill_review,
        ADD COLUMN skill_adaptability INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '適応力スコア（上限なし）' AFTER skill_stamina
    `);
  }

  if (skillImplType !== "int") {
    await pool.execute(`
      ALTER TABLE characters
        MODIFY COLUMN skill_impl INT UNSIGNED NOT NULL COMMENT '実装力スコア（上限なし）',
        MODIFY COLUMN skill_planning INT UNSIGNED NOT NULL COMMENT '企画力スコア（上限なし）',
        MODIFY COLUMN skill_speed INT UNSIGNED NOT NULL COMMENT '開発速度スコア（上限なし）',
        MODIFY COLUMN skill_review INT UNSIGNED NOT NULL COMMENT 'レビュー力スコア（上限なし）',
        MODIFY COLUMN skill_stamina INT UNSIGNED NOT NULL COMMENT '持続力スコア（上限なし）',
        MODIFY COLUMN skill_adaptability INT UNSIGNED NOT NULL COMMENT '適応力スコア（上限なし）',
        MODIFY COLUMN deck_score INT UNSIGNED NOT NULL COMMENT '総合スコア（上限なし）'
    `);
  }

  const deckScoreType = await getColumnType("decks", "deck_score");
  if (deckScoreType !== "int") {
    await pool.execute(`
      ALTER TABLE decks
        MODIFY COLUMN deck_score INT UNSIGNED NOT NULL DEFAULT 0
    `);
  }

  const developmentScoreType = await getColumnType(
    "matches",
    "player_development_score"
  );
  if (developmentScoreType !== "bigint") {
    await pool.execute(`
      ALTER TABLE matches
        MODIFY COLUMN player_deck_score INT UNSIGNED NOT NULL,
        MODIFY COLUMN opponent_deck_score INT UNSIGNED NOT NULL,
        MODIFY COLUMN player_development_score BIGINT UNSIGNED NOT NULL,
        MODIFY COLUMN opponent_development_score BIGINT UNSIGNED NOT NULL
    `);
  }
}
