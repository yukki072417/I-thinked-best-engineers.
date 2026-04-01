import type { Request, Response, NextFunction } from "express";

export interface AuthRequest extends Request {
  githubToken: string;
  githubLogin: string;
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized", message: "Bearer token required" });
    return;
  }

  const token = header.slice(7);

  const response = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });

  if (!response.ok) {
    res.status(401).json({ error: "unauthorized", message: "Invalid GitHub token" });
    return;
  }

  const user = (await response.json()) as { login: string };
  (req as AuthRequest).githubToken = token;
  (req as AuthRequest).githubLogin = user.login;
  next();
}
