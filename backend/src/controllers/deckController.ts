import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import * as deckModel from "../models/deckModel.js";

export async function getMyDeck(req: Request, res: Response): Promise<void> {
  const { githubLogin } = req as AuthRequest;
  const deck = await deckModel.findByOwner(githubLogin);
  if (!deck) {
    res.status(404).json({ error: "not_found", message: "Deck not found" });
    return;
  }
  res.json(deck);
}

export async function updateMyDeck(req: Request, res: Response): Promise<void> {
  const { githubLogin } = req as AuthRequest;
  const { member_logins } = req.body as { member_logins: string[] };

  if (!Array.isArray(member_logins) || member_logins.length === 0 || member_logins.length > 7) {
    res.status(400).json({ error: "bad_request", message: "member_logins must be 1-7 items" });
    return;
  }

  const deck = await deckModel.upsertDeck(githubLogin, member_logins);
  res.json(deck);
}

export async function registerDeck(req: Request, res: Response): Promise<void> {
  const { githubLogin } = req as AuthRequest;
  const result = await deckModel.registerDeck(githubLogin);
  res.json({ message: "デッキを登録しました", ...result });
}
