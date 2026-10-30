import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import capsuleRoutes from "./routes/capsules.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", "data:", "https://avatars.githubusercontent.com"],
      },
    },
  }),
);

app.use(express.json({ limit: "200kb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.user.sub,
      login: req.user.login,
      name: req.user.name,
      avatar_url: req.user.avatar_url,
    },
  });
});

app.use(authRoutes);
app.use("/api/capsules", capsuleRoutes);

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API route not found" });
  }
  return next();
});

export default app;
