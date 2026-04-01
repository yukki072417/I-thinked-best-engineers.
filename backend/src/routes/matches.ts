import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { createMatch, getMatches } from "../controllers/matchController.js";

export const matchesRouter = Router();

matchesRouter.post("/", authMiddleware, createMatch);
matchesRouter.get("/",  authMiddleware, getMatches);
