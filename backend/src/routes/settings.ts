import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getSettings, updateSettings } from "../controllers/settingsController.js";

export const settingsRouter = Router();

settingsRouter.get("/", authMiddleware, getSettings);
settingsRouter.put("/", authMiddleware, updateSettings);
