import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import app from "./app.js";
import { getDb } from "./db.js";
import { requirePageAuth } from "./middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = Number(process.env.PORT) || 3000;

await getDb();

if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve(__dirname, "../dist");

  app.use(express.static(distPath, { index: false }));

  app.get("/dashboard", requirePageAuth, (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  return res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`AI Capsule server listening on http://localhost:${port}`);
});
