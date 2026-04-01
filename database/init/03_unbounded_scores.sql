-- 既存環境向け: スコア系カラムを上限前提の型から拡張する

ALTER TABLE characters
  MODIFY COLUMN skill_impl INT UNSIGNED NOT NULL COMMENT '実装力スコア（上限なし）',
  MODIFY COLUMN skill_planning INT UNSIGNED NOT NULL COMMENT '企画力スコア（上限なし）',
  MODIFY COLUMN skill_speed INT UNSIGNED NOT NULL COMMENT '開発速度スコア（上限なし）',
  ADD COLUMN IF NOT EXISTS skill_review INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'レビュー力スコア（上限なし）' AFTER skill_speed,
  ADD COLUMN IF NOT EXISTS skill_stamina INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '持続力スコア（上限なし）' AFTER skill_review,
  ADD COLUMN IF NOT EXISTS skill_adaptability INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '適応力スコア（上限なし）' AFTER skill_stamina,
  MODIFY COLUMN deck_score INT UNSIGNED NOT NULL COMMENT '総合スコア（上限なし）';

ALTER TABLE decks
  MODIFY COLUMN deck_score INT UNSIGNED NOT NULL DEFAULT 0;

ALTER TABLE matches
  MODIFY COLUMN player_deck_score INT UNSIGNED NOT NULL,
  MODIFY COLUMN opponent_deck_score INT UNSIGNED NOT NULL,
  MODIFY COLUMN player_development_score BIGINT UNSIGNED NOT NULL,
  MODIFY COLUMN opponent_development_score BIGINT UNSIGNED NOT NULL;
