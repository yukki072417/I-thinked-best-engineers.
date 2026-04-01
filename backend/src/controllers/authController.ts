import type { Request, Response } from "express";
import crypto from "crypto";
import * as userModel from "../models/userModel.js";
import type { AuthRequest } from "../middleware/auth.js";

const clientId = () => process.env.GITHUB_CLIENT_ID!;
const clientSecret = () => process.env.GITHUB_CLIENT_SECRET!;
const frontendOrigin = () =>
  process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";

// state を一時保持（本番はRedis等に移行）
const stateStore = new Set<string>();

async function fetchGithubUserProfile(token: string): Promise<{
  login: string;
  name: string | null;
  avatar_url: string;
}> {
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!userRes.ok) {
    throw new Error("github_user_fetch_failed");
  }

  return (await userRes.json()) as {
    login: string;
    name: string | null;
    avatar_url: string;
  };
}

export function redirectToGithub(req: Request, res: Response): void {
  const withPrivate = req.query.private === "true";
  const scope = withPrivate ? "read:user repo" : "read:user public_repo";
  const state = crypto.randomBytes(16).toString("hex");
  stateStore.add(state);

  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: `${req.protocol}://${req.get("host")}/auth/github/callback`,
    scope,
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
}

export async function handleCallback(
  req: Request,
  res: Response,
): Promise<void> {
  const { code, state, error } = req.query as Record<string, string>;

  if (error || !code) {
    res.redirect(
      `${frontendOrigin()}/create-character?error=${error ?? "missing_code"}`,
    );
    return;
  }

  if (!stateStore.has(state)) {
    res.redirect(`${frontendOrigin()}/create-character?error=invalid_state`);
    return;
  }
  stateStore.delete(state);

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId(),
      client_secret: clientSecret(),
      code,
    }),
  });

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    error?: string;
  };

  if (!tokenData.access_token) {
    res.redirect(
      `${frontendOrigin()}/create-character?error=${tokenData.error ?? "token_exchange_failed"}`,
    );
    return;
  }

  res.redirect(
    `${frontendOrigin()}/create-character?token=${tokenData.access_token}`,
  );
}

export async function syncMyAccount(
  req: Request,
  res: Response,
): Promise<void> {
  const { githubToken } = req as AuthRequest;

  try {
    const profile = await fetchGithubUserProfile(githubToken);
    const user = await userModel.upsertUser({
      github_login: profile.login,
      name: profile.name,
      avatar_url: profile.avatar_url,
    });

    res.json({
      id: user.id,
      github_login: user.github_login,
      name: user.name,
      avatar_url: user.avatar_url,
      friend_approval_required: user.friend_approval_required,
      created_at: user.created_at,
      updated_at: user.updated_at,
    });
  } catch (error) {
    console.error("[auth] account setup failed:", error);
    res.status(500).json({
      error: "account_setup_failed",
      message: "アカウント情報の保存に失敗しました",
    });
  }
}
