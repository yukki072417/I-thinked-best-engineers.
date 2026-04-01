import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import * as friendModel from "../models/friendModel.js";
import * as userModel from "../models/userModel.js";

export async function getFriends(req: Request, res: Response): Promise<void> {
  const { githubLogin } = req as AuthRequest;
  const friends = await friendModel.findFriends(githubLogin);
  res.json({ friends });
}

export async function addFriend(req: Request, res: Response): Promise<void> {
  const { githubLogin } = req as AuthRequest;
  const { github_login: targetLogin } = req.body as { github_login: string };

  if (!targetLogin) {
    res.status(400).json({ error: "bad_request", message: "github_login is required" });
    return;
  }
  if (targetLogin === githubLogin) {
    res.status(400).json({ error: "bad_request", message: "Cannot add yourself" });
    return;
  }

  const target = await userModel.findByLogin(targetLogin);
  const autoAccept = !target?.friend_approval_required;
  const status = await friendModel.createFriendRequest(githubLogin, targetLogin, autoAccept);

  res.status(201).json({ github_login: targetLogin, status });
}

export async function respondToFriend(req: Request, res: Response): Promise<void> {
  const { githubLogin } = req as AuthRequest;
  const requesterLogin = req.params["github_login"] as string;
  const { action } = req.body as { action: "accept" | "reject" };

  if (action !== "accept" && action !== "reject") {
    res.status(400).json({ error: "bad_request", message: "action must be accept or reject" });
    return;
  }

  const status = action === "accept" ? "accepted" : "rejected";
  const updated = await friendModel.updateFriendStatus(githubLogin, requesterLogin, status);

  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Pending request not found" });
    return;
  }

  res.json({ github_login: requesterLogin, status });
}
