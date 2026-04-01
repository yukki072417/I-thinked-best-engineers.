import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getMyDeck, updateMyDeck, registerDeck } from "../controllers/deckController.js";

export const decksRouter = Router();

decksRouter.get("/me",          authMiddleware, getMyDeck);
decksRouter.put("/me",          authMiddleware, updateMyDeck);
decksRouter.post("/me/register",authMiddleware, registerDeck);
