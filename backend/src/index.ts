import "./env.js";
import express from "express";
import cors from "cors";
import { ensureDatabaseSchema } from "./db.js";
import { authRouter }       from "./routes/auth.js";
import { charactersRouter } from "./routes/characters.js";
import { decksRouter }      from "./routes/decks.js";
import { friendsRouter }    from "./routes/friends.js";
import { matchesRouter }    from "./routes/matches.js";
import { settingsRouter }   from "./routes/settings.js";

const app = express();
const PORT            = process.env.PORT            ?? 4567;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

app.use("/auth",       authRouter);
app.use("/characters", charactersRouter);
app.use("/decks",      decksRouter);
app.use("/friends",    friendsRouter);
app.use("/matches",    matchesRouter);
app.use("/settings",   settingsRouter);

async function startServer(): Promise<void> {
  await ensureDatabaseSchema();

  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
