# DB スキーマ設計
## 僕が考えた最強のエンジニアたち！！

---

## テーブル一覧

| テーブル名 | 概要 |
|---|---|
| users | 登録ユーザー（GitHub連携） |
| characters | キャラクター（自分 or フレンド由来） |
| character_skills | キャラクターのスキル値 |
| personality_diagnoses | 性格診断結果・補正値 |
| technologies | 技術マスター |
| character_technologies | キャラクターと技術の紐付け |
| friend_requests | フレンド申請 |
| decks | デッキ |
| deck_members | デッキメンバー（最大7人） |
| tournaments | ハッカソン大会 |
| tournament_technologies | 大会の参加要件技術 |
| tournament_entries | 大会エントリー |
| battles | 対戦 |
| battle_turns | ターンごとの補正・スコア |

---

## テーブル定義

### users

GitHubアカウントと連携したアプリユーザー。

```sql
CREATE TABLE users (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id                VARCHAR(64)  NOT NULL UNIQUE,
  github_username          VARCHAR(255) NOT NULL,
  github_url               VARCHAR(512) NOT NULL,
  avatar_url               VARCHAR(512),
  friend_approval_required BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

| カラム | 型 | 説明 |
|---|---|---|
| id | UUID | PK |
| github_id | VARCHAR | GitHub の数値ID（変わらない識別子） |
| github_username | VARCHAR | @ユーザー名 |
| github_url | VARCHAR | プロフィールURL |
| avatar_url | VARCHAR | アイコン画像URL |
| friend_approval_required | BOOLEAN | フレンド承認制フラグ（デフォルト: OFF） |

---

### characters

自分のキャラクター、またはフレンドのGitHubから生成されたキャラクター。
一人のユーザーが複数キャラを所有できる（自分 + フレンドの数だけ）。

```sql
CREATE TABLE characters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_github_id VARCHAR(64) NOT NULL,           -- ベースになったGitHubユーザーID
  display_name    VARCHAR(255) NOT NULL,
  avatar_url      VARCHAR(512),
  is_self         BOOLEAN      NOT NULL DEFAULT FALSE, -- 自分自身のキャラか
  skill_tendency  VARCHAR(32)  NOT NULL DEFAULT 'balanced',
    -- 'impl_specialized' | 'balanced'
  last_scanned_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id, source_github_id)
);
```

| カラム | 型 | 説明 |
|---|---|---|
| owner_id | UUID | FK → users.id（このキャラを所有するユーザー） |
| source_github_id | VARCHAR | キャラのベースになったGitHubユーザーID |
| is_self | BOOLEAN | 自分自身から生成されたキャラか |
| skill_tendency | VARCHAR | `impl_specialized`（実装特化型）/ `balanced`（バランス型） |
| last_scanned_at | TIMESTAMPTZ | 最後にGitHub再スキャンした日時 |

---

### character_skills

キャラクターのスキル値。スキャン時に再計算・上書きされる。

```sql
CREATE TABLE character_skills (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id         UUID        NOT NULL UNIQUE REFERENCES characters(id) ON DELETE CASCADE,
  implementation_power SMALLINT    NOT NULL DEFAULT 0 CHECK (implementation_power BETWEEN 0 AND 100),
  endurance            SMALLINT    NOT NULL DEFAULT 0 CHECK (endurance BETWEEN 0 AND 100),
  dev_speed            SMALLINT    NOT NULL DEFAULT 0 CHECK (dev_speed BETWEEN 0 AND 100),
  raw_github_stats     JSONB,        -- スキャン時の生データ（スター数・コミット数等）
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| カラム | 型 | 説明 |
|---|---|---|
| implementation_power | SMALLINT | 実装力 (0〜100) |
| endurance | SMALLINT | 継続力 (0〜100) |
| dev_speed | SMALLINT | 開発速度 (0〜100) |
| raw_github_stats | JSONB | スキャン時の生データ（デバッグ・再計算用） |

---

### personality_diagnoses

性格診断の回答・結果・スキル補正値。再診断すると新レコードが追加され、最新が有効。

```sql
CREATE TABLE personality_diagnoses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id      UUID        NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  personality_type  VARCHAR(64) NOT NULL,
  answers           JSONB       NOT NULL,   -- 質問IDと回答のマップ
  skill_corrections JSONB       NOT NULL,
    -- 例: {"implementation_power": 5, "endurance": -3, "dev_speed": 2}
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_personality_diagnoses_character_latest
  ON personality_diagnoses(character_id, created_at DESC);
```

| カラム | 型 | 説明 |
|---|---|---|
| personality_type | VARCHAR | 診断で決定した性格タイプ名 |
| answers | JSONB | 回答データ（`{question_id: answer_value}`) |
| skill_corrections | JSONB | スキルへの補正値マップ |

---

### technologies

技術マスターテーブル。

```sql
CREATE TABLE technologies (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(128) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

---

### character_technologies

キャラクターの技術特性（主要技術は最大2つ）。

```sql
CREATE TABLE character_technologies (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID        NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  technology_id UUID       NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
  is_primary   BOOLEAN     NOT NULL DEFAULT FALSE,  -- 主要技術フラグ
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (character_id, technology_id)
);

-- 主要技術は1キャラにつき最大2つ（アプリ側で制御）
```

---

### friend_requests

フレンド申請。承認制がONの場合は `pending` を経由する。

```sql
CREATE TABLE friend_requests (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_github_url    VARCHAR(512) NOT NULL,
  target_user_id       UUID        REFERENCES users(id) ON DELETE SET NULL,
  status               VARCHAR(16) NOT NULL DEFAULT 'pending',
    -- 'pending' | 'approved' | 'rejected' | 'auto_approved'
  generated_character_id UUID      REFERENCES characters(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| status | 説明 |
|---|---|
| `pending` | 承認待ち（対象ユーザーが承認制ONの場合） |
| `approved` | 承認済み（キャラクター生成済み） |
| `rejected` | 拒否された |
| `auto_approved` | 承認制OFF のため即時承認 |

---

### decks

ユーザーが持つデッキ。アクティブなデッキは1つ（is_active=true）。

```sql
CREATE TABLE decks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(128) NOT NULL DEFAULT 'My Deck',
  deck_score  NUMERIC(10,4) NOT NULL DEFAULT 0,  -- キャッシュされたデッキスコア
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

**デッキスコア計算式**

```
deck_score = Σ(実装力 × 0.45 + 開発速度 × 0.35 + 継続力 × 0.20) × (1000 / 700)
```

---

### deck_members

デッキに組み込まれたキャラクター（最大7人）。

```sql
CREATE TABLE deck_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id      UUID    NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  character_id UUID    NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  slot_order   SMALLINT NOT NULL CHECK (slot_order BETWEEN 1 AND 7),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (deck_id, character_id),
  UNIQUE (deck_id, slot_order)
);
```

---

### tournaments

ハッカソン大会。

```sql
CREATE TABLE tournaments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  difficulty      VARCHAR(16)  NOT NULL,  -- 'beginner' | 'intermediate' | 'advanced'
  total_turns     SMALLINT     NOT NULL,
  planning_turns  SMALLINT     NOT NULL DEFAULT 2,
  impl_turns      SMALLINT     NOT NULL,
  status          VARCHAR(16)  NOT NULL DEFAULT 'open',
    -- 'open' | 'in_progress' | 'closed'
  entry_start_at  TIMESTAMPTZ  NOT NULL,
  entry_end_at    TIMESTAMPTZ  NOT NULL,
  battle_start_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

| difficulty | total_turns | planning_turns | impl_turns |
|---|---|---|---|
| beginner | 7 | 2 | 5 |
| intermediate | 10 | 2 | 8 |
| advanced | 14 | 2 | 12 |

---

### tournament_technologies

大会の参加要件技術（保有技術の合致チェック用）。

```sql
CREATE TABLE tournament_technologies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID        NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  technology_id UUID        NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
  UNIQUE (tournament_id, technology_id)
);
```

---

### tournament_entries

大会へのデッキエントリー。

```sql
CREATE TABLE tournament_entries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id     UUID         NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  deck_id           UUID         NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  user_id           UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deck_score_at_entry NUMERIC(10,4) NOT NULL,  -- エントリー時点のデッキスコア（スナップショット）
  development_score NUMERIC(12,4) NOT NULL DEFAULT 0,  -- 累計開発スコア
  status            VARCHAR(16)  NOT NULL DEFAULT 'waiting',
    -- 'waiting' | 'matched' | 'completed'
  rank              INT,         -- 大会終了後に確定
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (tournament_id, user_id)
);
```

---

### battles

対戦（非同期シミュレーション）。

```sql
CREATE TABLE battles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   UUID        NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  entry1_id       UUID        NOT NULL REFERENCES tournament_entries(id),
  entry2_id       UUID        NOT NULL REFERENCES tournament_entries(id),
  winner_entry_id UUID        REFERENCES tournament_entries(id),
  status          VARCHAR(16) NOT NULL DEFAULT 'in_progress',
    -- 'in_progress' | 'completed'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  CHECK (entry1_id <> entry2_id)
);
```

---

### battle_turns

ターンごとの補正状態とスコア記録。

```sql
CREATE TABLE battle_turns (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id           UUID        NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  entry_id            UUID        NOT NULL REFERENCES tournament_entries(id),
  turn_number         SMALLINT    NOT NULL,
  -- 体調補正
  sleep_condition     VARCHAR(16) NOT NULL,
    -- 'good'(+10%) | 'normal'(±0%) | 'bad'(-10%) | 'sick'(-30%)
  -- モチベーション補正
  motivation_condition VARCHAR(16) NOT NULL,
    -- 'high'(+15%) | 'normal'(±0%) | 'low'(-20%)
  turn_score          NUMERIC(12,4) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (battle_id, entry_id, turn_number)
);
```

| sleep_condition | 実装力補正 | 発生確率 |
|---|---|---|
| good | +10% | 20% |
| normal | ±0% | 70% |
| bad | -10% | 9% |
| sick | -30% | 1% |

| motivation_condition | 開発速度補正 | 発生確率 |
|---|---|---|
| high | +15% | 18% |
| normal | ±0% | 80% |
| low | -20% | 2% |

---

## ER図（テキスト）

```
users
  ├── characters (owner_id)
  │     ├── character_skills
  │     ├── character_technologies ── technologies
  │     └── personality_diagnoses
  ├── friend_requests (requester_id / target_user_id)
  └── decks (user_id)
        ├── deck_members ── characters
        └── tournament_entries (deck_id)
              └── battles (entry1_id / entry2_id)
                    └── battle_turns

tournaments
  ├── tournament_technologies ── technologies
  └── tournament_entries
```

---

## インデックス設計

```sql
-- キャラクター検索
CREATE INDEX idx_characters_owner ON characters(owner_id);
CREATE INDEX idx_characters_source_github ON characters(source_github_id);

-- フレンド申請
CREATE INDEX idx_friend_requests_requester ON friend_requests(requester_id);
CREATE INDEX idx_friend_requests_target_user ON friend_requests(target_user_id);

-- デッキ
CREATE INDEX idx_decks_user_active ON decks(user_id, is_active);

-- 大会エントリー（マッチング用）
CREATE INDEX idx_tournament_entries_tournament_score
  ON tournament_entries(tournament_id, deck_score_at_entry);

-- バトル
CREATE INDEX idx_battles_tournament ON battles(tournament_id);
CREATE INDEX idx_battle_turns_battle_entry ON battle_turns(battle_id, entry_id);
```