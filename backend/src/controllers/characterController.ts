import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import * as userModel from "../models/userModel.js";
import * as characterModel from "../models/characterModel.js";
import { getCharacterData } from "../services/githubService.js";

function formatCharacter(c: characterModel.Character, u: { name: string | null; avatar_url: string }) {
  return {
    id:           c.id,
    github_login: c.github_login,
    name:         u.name,
    avatar_url:   u.avatar_url,
    skills: {
      implementation: c.skill_impl,
      planning:       c.skill_planning,
      speed:          c.skill_speed,
      review:         c.skill_review,
      stamina:        c.skill_stamina,
      adaptability:   c.skill_adaptability,
    },
    tech: {
      primary: c.tech_primary,
      all:     c.tech_all,
    },
    tendency:   c.tendency,
    deck_score: c.deck_score,
    created_at: c.created_at,
    updated_at: c.updated_at,
  };
}

async function buildAndSave(token: string) {
  const { user, stats } = await getCharacterData(token);

  await userModel.upsertUser({
    github_login: user.login,
    name:         user.name,
    avatar_url:   user.avatar_url,
  });

  const character = await characterModel.upsertCharacter({
    github_login:  user.login,
    skill_impl:    stats.skills.implementation,
    skill_planning: stats.skills.planning,
    skill_speed:   stats.skills.speed,
    skill_review:  stats.skills.review,
    skill_stamina: stats.skills.stamina,
    skill_adaptability: stats.skills.adaptability,
    tech_primary:  stats.tech.primary,
    tech_all:      stats.tech.all,
    tendency:      stats.tendency,
    deck_score:    stats.deckScore,
  });

  return { character, user };
}

export async function createCharacter(req: Request, res: Response): Promise<void> {
  const { githubToken } = req as AuthRequest;
  const { character, user } = await buildAndSave(githubToken);
  res.status(201).json(formatCharacter(character, { name: user.name, avatar_url: user.avatar_url }));
}

export async function getCharacter(req: Request, res: Response): Promise<void> {
  const github_login = req.params["github_login"] as string;
  const character = await characterModel.findByLogin(github_login);
  if (!character) {
    res.status(404).json({ error: "not_found", message: "Character not found" });
    return;
  }
  const user = await userModel.findByLogin(github_login);
  res.json(formatCharacter(character, { name: user?.name ?? null, avatar_url: user?.avatar_url ?? "" }));
}

export async function getMyCharacter(req: Request, res: Response): Promise<void> {
  const { githubLogin } = req as AuthRequest;
  const character = await characterModel.findByLogin(githubLogin);
  if (!character) {
    res.status(404).json({ error: "not_found", message: "Character not found" });
    return;
  }

  const user = await userModel.findByLogin(githubLogin);
  res.json(formatCharacter(character, { name: user?.name ?? null, avatar_url: user?.avatar_url ?? "" }));
}

export async function rescanCharacter(req: Request, res: Response): Promise<void> {
  const { githubToken } = req as AuthRequest;
  const { character, user } = await buildAndSave(githubToken);
  res.json(formatCharacter(character, { name: user.name, avatar_url: user.avatar_url }));
}
