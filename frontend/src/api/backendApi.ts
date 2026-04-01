const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4567";

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BACKEND_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// --- 型定義 ---

export interface CharacterSkills {
  implementation: number;
  planning: number;
  speed: number;
  review: number;
  stamina: number;
  adaptability: number;
}

export interface Character {
  id: string;
  github_login: string;
  name: string | null;
  avatar_url: string;
  skills: CharacterSkills;
  tech: { primary: string[]; all: string[] };
  tendency: "implementation" | "planning" | "balanced";
  deck_score: number;
  created_at: string;
  updated_at: string;
}

export interface DeckMember {
  github_login: string;
  name: string | null;
  avatar_url: string;
  skill_impl: number;
  skill_planning: number;
  skill_speed: number;
  tendency: string;
}

export interface Deck {
  id: string;
  owner_login: string;
  members: DeckMember[];
  deck_score: number;
  registered_at: string | null;
}

export interface Friend {
  github_login: string;
  name: string | null;
  avatar_url: string;
  status: "pending" | "accepted" | "rejected";
}

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
  difficulty: "beginner" | "intermediate" | "advanced";
  result: "win" | "lose" | "draw";
  my_deck_score: number;
  opponent_login: string;
  opponent_deck_score: number;
  my_development_score: number;
  opponent_development_score: number;
  turns: MatchTurn[];
  played_at: string;
}

export interface Account {
  id: string;
  github_login: string;
  name: string | null;
  avatar_url: string;
  friend_approval_required: boolean;
  created_at: string;
  updated_at: string;
}

// --- 認証 ---
export const syncMyAccount = (token: string) =>
  request<Account>("/auth/me", {}, token);

// --- キャラクター ---
export const createCharacter = (token: string) =>
  request<Character>("/characters", { method: "POST" }, token);

export const getMyCharacter = (token: string) =>
  request<Character>("/characters/me", {}, token);

export const getCharacter = (github_login: string) =>
  request<Character>(`/characters/${github_login}`);

export const rescanCharacter = (token: string) =>
  request<Character>("/characters/me/rescan", { method: "PUT" }, token);

// --- デッキ ---
export const getMyDeck = (token: string) =>
  request<Deck>("/decks/me", {}, token);

export const updateMyDeck = (token: string, member_logins: string[]) =>
  request<Deck>("/decks/me", { method: "PUT", body: JSON.stringify({ member_logins }) }, token);

export const registerDeck = (token: string) =>
  request<{ message: string; deck_score: number; registered_at: string }>(
    "/decks/me/register", { method: "POST" }, token
  );

// --- フレンド ---
export const getFriends = (token: string) =>
  request<{ friends: Friend[] }>("/friends", {}, token);

export const addFriend = (token: string, github_login: string) =>
  request<{ github_login: string; status: string }>(
    "/friends", { method: "POST", body: JSON.stringify({ github_login }) }, token
  );

export const respondToFriend = (token: string, github_login: string, action: "accept" | "reject") =>
  request<{ github_login: string; status: string }>(
    `/friends/${github_login}`, { method: "PUT", body: JSON.stringify({ action }) }, token
  );

// --- マッチング ---
export const createMatch = (token: string, difficulty: "beginner" | "intermediate" | "advanced") =>
  request<Match>("/matches", { method: "POST", body: JSON.stringify({ difficulty }) }, token);

export const getMatches = (token: string, limit = 20, offset = 0) =>
  request<{ total: number; matches: Omit<Match, "turns">[] }>(
    `/matches?limit=${limit}&offset=${offset}`, {}, token
  );

// --- 設定 ---
export const getSettings = (token: string) =>
  request<{ friend_approval_required: boolean }>("/settings", {}, token);

export const updateSettings = (token: string, friend_approval_required: boolean) =>
  request<{ friend_approval_required: boolean }>(
    "/settings", { method: "PUT", body: JSON.stringify({ friend_approval_required }) }, token
  );
