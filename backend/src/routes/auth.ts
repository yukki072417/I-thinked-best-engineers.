import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  redirectToGithub,
  handleCallback,
  syncMyAccount,
} from "../controllers/authController.js";

export const authRouter = Router();

authRouter.get("/github",          redirectToGithub);
authRouter.get("/github/callback", handleCallback);
authRouter.get("/me",              authMiddleware, syncMyAccount);
