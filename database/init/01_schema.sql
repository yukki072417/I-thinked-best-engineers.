-- =============================================================
-- Engineer Game Database Schema
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- -------------------------------------------------------------
-- users
-- GitHub OAuth で認証したユーザー
-- -------------------------------------------------------------
CREATE TABLE users (
  id                       CHAR(36)     NOT NULL DEFAULT (UUID()),
  github_login             VARCHAR(39)  NOT NULL,
  name                     VARCHAR(255),
  avatar_url               TEXT         NOT NULL,
  friend_approval_required TINYINT(1)   NOT NULL DEFAULT 0,
  created_at               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_github_login (github_login)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- characters
-- ユーザー 1人につき 1キャラクター
-- -------------------------------------------------------------
CREATE TABLE characters (
  id               CHAR(36)      NOT NULL DEFAULT (UUID()),
  github_login     VARCHAR(39)   NOT NULL,
  skill_impl       INT UNSIGNED NOT NULL COMMENT '実装力スコア（上限なし）',
  skill_planning   INT UNSIGNED NOT NULL COMMENT '企画力スコア（上限なし）',
  skill_speed      INT UNSIGNED NOT NULL COMMENT '開発速度スコア（上限なし）',
  skill_review     INT UNSIGNED NOT NULL COMMENT 'レビュー力スコア（上限なし）',
  skill_stamina    INT UNSIGNED NOT NULL COMMENT '持続力スコア（上限なし）',
  skill_adaptability INT UNSIGNED NOT NULL COMMENT '適応力スコア（上限なし）',
  tech_primary     JSON          NOT NULL COMMENT '主要技術 (上位2言語)',
  tech_all         JSON          NOT NULL COMMENT '保有技術 (全言語)',
  tendency         ENUM('implementation','planning','balanced') NOT NULL,
  deck_score       INT UNSIGNED NOT NULL COMMENT '総合スコア（上限なし）',
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_characters_github_login (github_login),
  CONSTRAINT fk_characters_user
    FOREIGN KEY (github_login) REFERENCES users (github_login)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- decks
-- ユーザー 1人につき 1デッキ（UPSERT で管理）
-- -------------------------------------------------------------
CREATE TABLE decks (
  id              CHAR(36)    NOT NULL DEFAULT (UUID()),
  owner_login     VARCHAR(39) NOT NULL,
  deck_score      INT UNSIGNED NOT NULL DEFAULT 0,
  is_registered   TINYINT(1)  NOT NULL DEFAULT 0 COMMENT 'マッチング対象として登録済みか',
  registered_at   DATETIME,
  created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_decks_owner (owner_login),
  CONSTRAINT fk_decks_user
    FOREIGN KEY (owner_login) REFERENCES users (github_login)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- deck_members
-- デッキに編成されたキャラクター（最大7人）
-- -------------------------------------------------------------
CREATE TABLE deck_members (
  deck_id          CHAR(36)    NOT NULL,
  member_login     VARCHAR(39) NOT NULL,
  position         TINYINT UNSIGNED NOT NULL COMMENT '1-7',
  PRIMARY KEY (deck_id, member_login),
  CONSTRAINT fk_deck_members_deck
    FOREIGN KEY (deck_id) REFERENCES decks (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_deck_members_character
    FOREIGN KEY (member_login) REFERENCES characters (github_login)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- friends
-- フレンド関係（申請者 → 被申請者）
-- -------------------------------------------------------------
CREATE TABLE friends (
  requester_login  VARCHAR(39) NOT NULL,
  requestee_login  VARCHAR(39) NOT NULL,
  status           ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  created_at       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (requester_login, requestee_login),
  CONSTRAINT fk_friends_requester
    FOREIGN KEY (requester_login) REFERENCES users (github_login)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_friends_requestee
    FOREIGN KEY (requestee_login) REFERENCES users (github_login)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- matches
-- 対戦結果
-- -------------------------------------------------------------
CREATE TABLE matches (
  id                           CHAR(36)    NOT NULL DEFAULT (UUID()),
  player_login                 VARCHAR(39) NOT NULL,
  opponent_login               VARCHAR(39) NOT NULL,
  difficulty                   ENUM('beginner','intermediate','advanced') NOT NULL,
  result                       ENUM('win','lose','draw') NOT NULL,
  player_deck_score            INT UNSIGNED NOT NULL,
  opponent_deck_score          INT UNSIGNED NOT NULL,
  player_development_score     BIGINT UNSIGNED NOT NULL,
  opponent_development_score   BIGINT UNSIGNED NOT NULL,
  played_at                    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_matches_player  (player_login, played_at DESC),
  KEY idx_matches_opponent (opponent_login),
  CONSTRAINT fk_matches_player
    FOREIGN KEY (player_login) REFERENCES users (github_login)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_matches_opponent
    FOREIGN KEY (opponent_login) REFERENCES users (github_login)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- match_turns
-- 対戦のターンごとの詳細ログ
-- -------------------------------------------------------------
CREATE TABLE match_turns (
  id                  CHAR(36)    NOT NULL DEFAULT (UUID()),
  match_id            CHAR(36)    NOT NULL,
  turn_number         TINYINT UNSIGNED NOT NULL,
  phase               ENUM('planning','implementation') NOT NULL,
  progress            INT UNSIGNED NOT NULL,
  condition_state     ENUM('great','normal','sick','ill') NOT NULL,
  condition_effect    TINYINT     NOT NULL DEFAULT 0 COMMENT '補正値 (%)',
  motivation_state    ENUM('best','normal','unmotivated') NOT NULL,
  motivation_effect   TINYINT     NOT NULL DEFAULT 0 COMMENT '補正値 (%)',
  event_type          ENUM('lucky','accident') NULL,
  event_effect        TINYINT     NULL COMMENT '補正値 (%)',
  PRIMARY KEY (id),
  UNIQUE KEY uq_match_turns (match_id, turn_number),
  CONSTRAINT fk_match_turns_match
    FOREIGN KEY (match_id) REFERENCES matches (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
