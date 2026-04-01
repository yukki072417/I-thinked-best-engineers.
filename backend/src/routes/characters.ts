import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  createCharacter,
  getCharacter,
  getMyCharacter,
  rescanCharacter,
} from "../controllers/characterController.js";

export const charactersRouter = Router();

charactersRouter.post("/",              authMiddleware, createCharacter);
charactersRouter.get("/me",             authMiddleware, getMyCharacter);
charactersRouter.get("/:github_login",  getCharacter);
charactersRouter.put("/me/rescan",      authMiddleware, rescanCharacter);
