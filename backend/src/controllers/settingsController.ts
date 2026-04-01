import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import * as userModel from "../models/userModel.js";

export async function getSettings(req: Request, res: Response): Promise<void> {
  const { githubLogin } = req as AuthRequest;
  const user = await userModel.findByLogin(githubLogin);
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }
  res.json({ friend_approval_required: !!user.friend_approval_required });
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  const { githubLogin } = req as AuthRequest;
  const { friend_approval_required } = req.body as { friend_approval_required: boolean };

  if (typeof friend_approval_required !== "boolean") {
    res.status(400).json({ error: "bad_request", message: "friend_approval_required must be boolean" });
    return;
  }

  await userModel.updateSettings(githubLogin, friend_approval_required);
  res.json({ friend_approval_required });
}
