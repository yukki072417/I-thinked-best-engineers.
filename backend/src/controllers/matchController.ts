import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import * as deckModel from "../models/deckModel.js";
import * as matchModel from "../models/matchModel.js";
import type { Difficulty, MatchTurn } from "../models/matchModel.js";
import crypto from "crypto";

const TURN_CONFIG: Record<Difficulty, { total: number; planning: number }> = {
  beginner:     { total: 7,  planning: 2 },
  intermediate: { total: 10, planning: 2 },
  advanced:     { total: 14, planning: 2 },
};

function rollCondition(): { state: string; effect: number } {
  const r = Math.random() * 100;
  if (r < 1)  return { state: "ill",   effect: -30 };
  if (r < 10) return { state: "sick",  effect: -10 };
  if (r < 30) return { state: "great", effect: 10 };
  return { state: "normal", effect: 0 };
}

function rollMotivation(): { state: string; effect: number } {
  const r = Math.random() * 100;
  if (r < 2)  return { state: "unmotivated", effect: -20 };
  if (r < 20) return { state: "best",        effect: 15 };
  return { state: "normal", effect: 0 };
}

function rollEvent(avgPlanning: number): { type: string; effect: number } | null {
  // 企画力スコアを 0-100 の期待値レンジに正規化して抽選確率へ変換
  const planningRate = (avgPlanning / (avgPlanning + 200)) * 100;
  const luckyChance = planningRate * 0.1;
  const accidentChance = (100 - planningRate) * 0.1;
  const r = Math.random() * 100;
  if (r < luckyChance)    return { type: "lucky",    effect: 5 };
  if (r < luckyChance + accidentChance) return { type: "accident", effect: -30 };
  return null;
}

function simulateDeck(
  members: { skill_impl: number; skill_planning: number; skill_speed: number }[],
  difficulty: Difficulty
): { turns: MatchTurn[]; developmentScore: number } {
  const config = TURN_CONFIG[difficulty];
  const avgPlanning = members.reduce((s, m) => s + m.skill_planning, 0) / members.length;
  const totalPlanning = members.reduce((s, m) => s + m.skill_planning, 0);
  const turns: MatchTurn[] = [];
  let totalProgress = 0;
  let implProgress = 0;

  for (let i = 1; i <= config.total; i++) {
    const phase = i <= config.planning ? "planning" : "implementation";
    const condition  = rollCondition();
    const motivation = rollMotivation();
    const event      = rollEvent(avgPlanning);

    let progress = 0;
    if (phase === "planning") {
      progress = members.reduce((s, m) => s + m.skill_planning, 0);
    } else {
      progress = members.reduce((s, m) => {
        const base = m.skill_impl * 0.6 + m.skill_speed * 0.4;
        return s + base * (1 + condition.effect / 100) * (1 + motivation.effect / 100);
      }, 0);
      if (event?.type === "accident") progress *= 0.7;
      if (event?.type === "lucky")    progress *= 1 + (event.effect / 100);
      implProgress += progress;
    }

    progress = Math.round(progress);
    totalProgress += progress;

    turns.push({
      turn: i,
      phase,
      progress,
      modifiers: { condition, motivation, event },
    });
  }

  const developmentScore = Math.round(implProgress * totalPlanning);
  return { turns, developmentScore };
}

export async function createMatch(req: Request, res: Response): Promise<void> {
  const { githubLogin } = req as AuthRequest;
  const { difficulty } = req.body as { difficulty: Difficulty };

  if (!["beginner", "intermediate", "advanced"].includes(difficulty)) {
    res.status(400).json({ error: "bad_request", message: "Invalid difficulty" });
    return;
  }

  const myDeck = await deckModel.findByOwner(githubLogin);
  if (!myDeck || myDeck.members.length === 0) {
    res.status(400).json({ error: "bad_request", message: "Deck is empty" });
    return;
  }

  const recentOpponents = await matchModel.findRecentOpponents(githubLogin);
  const opponent = await deckModel.findRegisteredNear(myDeck.deck_score, githubLogin, difficulty, recentOpponents);
  if (!opponent) {
    res.status(404).json({ error: "not_found", message: "No opponent found" });
    return;
  }

  const opponentDeck = await deckModel.findByOwner(opponent.owner_login);
  if (!opponentDeck) {
    res.status(404).json({ error: "not_found", message: "Opponent deck not found" });
    return;
  }

  const myResult    = simulateDeck(myDeck.members, difficulty);
  const oppResult   = simulateDeck(opponentDeck.members, difficulty);
  const result: matchModel.MatchResult =
      myResult.developmentScore > oppResult.developmentScore ? "win"
    : myResult.developmentScore < oppResult.developmentScore ? "lose"
    : "draw";

  const matchId  = crypto.randomUUID();
  const playedAt = new Date().toISOString().slice(0, 19).replace("T", " ");

  const matchData = {
    id:                         matchId,
    difficulty,
    result,
    my_deck_score:              myDeck.deck_score,
    opponent_login:             opponent.owner_login,
    opponent_deck_score:        opponentDeck.deck_score,
    my_development_score:       myResult.developmentScore,
    opponent_development_score: oppResult.developmentScore,
    turns:                      myResult.turns,
    played_at:                  playedAt,
  };

  await matchModel.saveMatch(githubLogin, matchData);
  res.json(matchData);
}

export async function getMatches(req: Request, res: Response): Promise<void> {
  const { githubLogin } = req as AuthRequest;
  const limit  = Math.min(Number(req.query.limit  ?? 20), 100);
  const offset = Number(req.query.offset ?? 0);
  const result = await matchModel.findMatches(githubLogin, limit, offset);
  res.json(result);
}
