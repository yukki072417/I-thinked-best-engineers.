# API 設計書

## 共通仕様

- Base URL: `http://localhost:4567`
- レスポンス形式: `application/json`
- 認証が必要なエンドポイントは `Authorization: Bearer <access_token>` ヘッダーを付与する

### 共通エラーレスポンス

```json
{
  "error": "エラーコード",
  "message": "エラーの説明"
}
```

| ステータス | エラーコード          | 説明                         |
| ---------- | --------------------- | ---------------------------- |
| 400        | `bad_request`         | リクエストパラメータ不正     |
| 401        | `unauthorized`        | トークン未指定・無効         |
| 404        | `not_found`           | リソースが存在しない         |
| 500        | `internal_error`      | サーバー内部エラー           |

---

## 認証 `/auth`

### `GET /auth/github`

GitHub OAuth の認可URLへリダイレクトする。

**クエリパラメータ**

| パラメータ | 型      | 必須 | 説明                                                              |
| ---------- | ------- | ---- | ----------------------------------------------------------------- |
| `private`  | boolean | No   | `true` のとき `repo` スコープを要求（プライベートリポジトリ許可） |

**レスポンス**

`302 Redirect` → `https://github.com/login/oauth/authorize?...`

---

### `GET /auth/github/callback`

GitHub からのコールバック。認可コードをアクセストークンに交換し、フロントエンドへリダイレクトする。

**クエリパラメータ（GitHub から付与）**

| パラメータ | 型     | 説明               |
| ---------- | ------ | ------------------ |
| `code`     | string | 認可コード         |
| `state`    | string | CSRF防止用トークン |
| `error`    | string | 認可失敗時のエラー |

**成功時**

`302 Redirect` → `{FRONTEND_ORIGIN}/create-character?token=<access_token>`

**失敗時**

`302 Redirect` → `{FRONTEND_ORIGIN}/create-character?error=<error_code>`

---

## キャラクター `/characters`

### `POST /characters`

GitHub アクセストークンを使って GitHub API からデータを取得し、キャラクターを生成・保存する。

**リクエストヘッダー**

```
Authorization: Bearer <github_access_token>
```

**リクエストボディ**

```json
{}
```

（ボディ不要。トークンからユーザー情報を取得する）

**レスポンス `201 Created`**

```json
{
  "id": "uuid",
  "github_login": "octocat",
  "name": "The Octocat",
  "avatar_url": "https://avatars.githubusercontent.com/u/583231",
  "skills": {
    "implementation": 72,
    "planning": 45,
    "speed": 60
  },
  "tech": {
    "primary": ["TypeScript", "Go"],
    "all": ["TypeScript", "Go", "Python", "Shell"]
  },
  "tendency": "implementation",
  "deck_score": 95,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

---

### `GET /characters/:github_login`

指定した GitHub ログイン名のキャラクター情報を取得する。

**パスパラメータ**

| パラメータ      | 型     | 説明                  |
| --------------- | ------ | --------------------- |
| `github_login`  | string | GitHub のユーザー名   |

**レスポンス `200 OK`**

```json
{
  "id": "uuid",
  "github_login": "octocat",
  "name": "The Octocat",
  "avatar_url": "https://avatars.githubusercontent.com/u/583231",
  "skills": {
    "implementation": 72,
    "planning": 45,
    "speed": 60
  },
  "tech": {
    "primary": ["TypeScript", "Go"],
    "all": ["TypeScript", "Go", "Python", "Shell"]
  },
  "tendency": "implementation",
  "deck_score": 95,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

---

### `PUT /characters/me/rescan`

自分のキャラクターを最新の GitHub データで再スキャンして更新する。

**リクエストヘッダー**

```
Authorization: Bearer <github_access_token>
```

**レスポンス `200 OK`**

`POST /characters` と同じ形式

---

## デッキ `/decks`

### `GET /decks/me`

自分の現在のデッキを取得する。

**リクエストヘッダー**

```
Authorization: Bearer <github_access_token>
```

**レスポンス `200 OK`**

```json
{
  "id": "uuid",
  "owner_login": "octocat",
  "members": [
    {
      "github_login": "octocat",
      "name": "The Octocat",
      "avatar_url": "https://avatars.githubusercontent.com/u/583231",
      "skills": {
        "implementation": 72,
        "planning": 45,
        "speed": 60
      },
      "tendency": "implementation"
    }
  ],
  "deck_score": 95,
  "registered_at": "2025-01-01T00:00:00Z"
}
```

---

### `PUT /decks/me`

自分のデッキを更新する（メンバー最大7人）。

**リクエストヘッダー**

```
Authorization: Bearer <github_access_token>
```

**リクエストボディ**

```json
{
  "member_logins": ["octocat", "torvalds", "gvanrossum"]
}
```

| フィールド       | 型       | 必須 | 説明                          |
| ---------------- | -------- | ---- | ----------------------------- |
| `member_logins`  | string[] | Yes  | メンバーの GitHub ログイン名（最大7人） |

**レスポンス `200 OK`**

`GET /decks/me` と同じ形式

---

### `POST /decks/me/register`

自分のデッキをマッチング対象としてサーバーに登録する。

**リクエストヘッダー**

```
Authorization: Bearer <github_access_token>
```

**レスポンス `200 OK`**

```json
{
  "message": "デッキを登録しました",
  "deck_score": 95,
  "registered_at": "2025-01-01T00:00:00Z"
}
```

---

## フレンド `/friends`

### `GET /friends`

自分のフレンド一覧を取得する。

**リクエストヘッダー**

```
Authorization: Bearer <github_access_token>
```

**レスポンス `200 OK`**

```json
{
  "friends": [
    {
      "github_login": "torvalds",
      "name": "Linus Torvalds",
      "avatar_url": "https://avatars.githubusercontent.com/u/1024025",
      "status": "accepted"
    }
  ]
}
```

`status` の値: `pending` / `accepted` / `rejected`

---

### `POST /friends`

フレンド申請を送る。

**リクエストヘッダー**

```
Authorization: Bearer <github_access_token>
```

**リクエストボディ**

```json
{
  "github_login": "torvalds"
}
```

**レスポンス `201 Created`**

```json
{
  "github_login": "torvalds",
  "status": "pending"
}
```

> 申請先ユーザーが承認制オフの場合は即時 `accepted` になる。

---

### `PUT /friends/:github_login`

フレンド申請を承認または拒否する。

**パスパラメータ**

| パラメータ      | 型     | 説明                  |
| --------------- | ------ | --------------------- |
| `github_login`  | string | 申請者の GitHub ログイン名 |

**リクエストボディ**

```json
{
  "action": "accept"
}
```

| フィールド | 型     | 必須 | 説明                          |
| ---------- | ------ | ---- | ----------------------------- |
| `action`   | string | Yes  | `"accept"` または `"reject"`  |

**レスポンス `200 OK`**

```json
{
  "github_login": "torvalds",
  "status": "accepted"
}
```

---

## マッチング `/matches`

### `POST /matches`

デッキスコアが近い相手とマッチングしてシミュレーション対戦を実行する。

**リクエストヘッダー**

```
Authorization: Bearer <github_access_token>
```

**リクエストボディ**

```json
{
  "difficulty": "intermediate"
}
```

| フィールド   | 型     | 必須 | 説明                                          |
| ------------ | ------ | ---- | --------------------------------------------- |
| `difficulty` | string | Yes  | `"beginner"` / `"intermediate"` / `"advanced"` |

**レスポンス `200 OK`**

```json
{
  "id": "uuid",
  "difficulty": "intermediate",
  "result": "win",
  "my_deck_score": 95,
  "opponent_login": "torvalds",
  "opponent_deck_score": 88,
  "my_development_score": 4320,
  "opponent_development_score": 3980,
  "turns": [
    {
      "turn": 1,
      "phase": "planning",
      "progress": 120,
      "modifiers": {
        "condition": { "state": "normal", "effect": 0 },
        "motivation": { "state": "best", "effect": 15 },
        "event": null
      }
    }
  ],
  "played_at": "2025-01-01T00:00:00Z"
}
```

---

### `GET /matches`

自分の対戦履歴を取得する。

**リクエストヘッダー**

```
Authorization: Bearer <github_access_token>
```

**クエリパラメータ**

| パラメータ | 型     | 必須 | 説明                     |
| ---------- | ------ | ---- | ------------------------ |
| `limit`    | number | No   | 取得件数（デフォルト20） |
| `offset`   | number | No   | オフセット（デフォルト0）|

**レスポンス `200 OK`**

```json
{
  "total": 42,
  "matches": [
    {
      "id": "uuid",
      "difficulty": "intermediate",
      "result": "win",
      "my_development_score": 4320,
      "opponent_login": "torvalds",
      "opponent_development_score": 3980,
      "played_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

## ユーザー設定 `/settings`

### `GET /settings`

自分の設定を取得する。

**リクエストヘッダー**

```
Authorization: Bearer <github_access_token>
```

**レスポンス `200 OK`**

```json
{
  "friend_approval_required": false
}
```

---

### `PUT /settings`

自分の設定を更新する。

**リクエストヘッダー**

```
Authorization: Bearer <github_access_token>
```

**リクエストボディ**

```json
{
  "friend_approval_required": true
}
```

**レスポンス `200 OK`**

`GET /settings` と同じ形式
