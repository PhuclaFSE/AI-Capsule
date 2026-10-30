import fs from "node:fs";
import path from "node:path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

let dbPromise;

function resolveDbFile() {
  const configured = process.env.DB_FILE || "./data/ai-capsule.db";
  if (configured === ":memory:") return configured;

  const absolutePath = path.resolve(process.cwd(), configured);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  return absolutePath;
}

export async function getDb() {
  if (!dbPromise) {
    dbPromise = open({
      filename: resolveDbFile(),
      driver: sqlite3.Database,
    }).then(async (db) => {
      await db.exec("PRAGMA foreign_keys = ON;");
      await db.exec("PRAGMA journal_mode = WAL;");
      await db.exec(`
        CREATE TABLE IF NOT EXISTS capsules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          project_name TEXT NOT NULL,
          prompt_title TEXT NOT NULL,
          prompt_version TEXT,
          prompt_text TEXT NOT NULL,
          response_summary TEXT,
          category TEXT,
          usefulness TEXT,
          reviewed INTEGER DEFAULT 0,
          improved INTEGER DEFAULT 0,
          screenshot_url TEXT,
          notes TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await db.exec(
        "CREATE INDEX IF NOT EXISTS idx_capsules_user_id ON capsules(user_id);",
      );
      return db;
    });
  }

  return dbPromise;
}
