import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getFriends, addFriend, respondToFriend } from "../controllers/friendController.js";

export const friendsRouter = Router();

friendsRouter.get("/",                    authMiddleware, getFriends);
friendsRouter.post("/",                   authMiddleware, addFriend);
friendsRouter.put("/:github_login",       authMiddleware, respondToFriend);
