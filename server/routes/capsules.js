import express from "express";
import { getDb } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

function normaliseCapsuleBody(body = {}) {
  return {
    project_name: String(body.project_name || "").trim(),
    prompt_title: String(body.prompt_title || "").trim(),
    prompt_version: String(body.prompt_version || "").trim(),
    prompt_text: String(body.prompt_text || "").trim(),
    response_summary: String(body.response_summary || "").trim(),
    category: String(body.category || "").trim(),
    usefulness: String(body.usefulness || "").trim(),
    reviewed: body.reviewed ? 1 : 0,
    improved: body.improved ? 1 : 0,
    screenshot_url: String(body.screenshot_url || "").trim(),
    notes: String(body.notes || "").trim(),
  };
}

function validateCapsule(capsule) {
  const missing = [];
  if (!capsule.project_name) missing.push("project_name");
  if (!capsule.prompt_title) missing.push("prompt_title");
  if (!capsule.prompt_text) missing.push("prompt_text");
  return missing;
}

router.get("/", async (req, res, next) => {
  try {
    const db = await getDb();
    const capsules = await db.all(
      `SELECT *
       FROM capsules
       WHERE user_id = ?
       ORDER BY datetime(created_at) DESC, id DESC`,
      String(req.user.sub),
    );

    res.json({ capsules });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const capsule = normaliseCapsuleBody(req.body);
    const missing = validateCapsule(capsule);
    if (missing.length) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
    }

    const db = await getDb();
    const result = await db.run(
      `INSERT INTO capsules (
        user_id, project_name, prompt_title, prompt_version, prompt_text,
        response_summary, category, usefulness, reviewed, improved,
        screenshot_url, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      String(req.user.sub),
      capsule.project_name,
      capsule.prompt_title,
      capsule.prompt_version,
      capsule.prompt_text,
      capsule.response_summary,
      capsule.category,
      capsule.usefulness,
      capsule.reviewed,
      capsule.improved,
      capsule.screenshot_url,
      capsule.notes,
    );

    const created = await db.get(
      "SELECT * FROM capsules WHERE id = ? AND user_id = ?",
      result.lastID,
      String(req.user.sub),
    );

    res.status(201).json({ capsule: created });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid capsule id" });
    }

    const capsule = normaliseCapsuleBody(req.body);
    const missing = validateCapsule(capsule);
    if (missing.length) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
    }

    const db = await getDb();
    const result = await db.run(
      `UPDATE capsules
       SET project_name = ?,
           prompt_title = ?,
           prompt_version = ?,
           prompt_text = ?,
           response_summary = ?,
           category = ?,
           usefulness = ?,
           reviewed = ?,
           improved = ?,
           screenshot_url = ?,
           notes = ?
       WHERE id = ? AND user_id = ?`,
      capsule.project_name,
      capsule.prompt_title,
      capsule.prompt_version,
      capsule.prompt_text,
      capsule.response_summary,
      capsule.category,
      capsule.usefulness,
      capsule.reviewed,
      capsule.improved,
      capsule.screenshot_url,
      capsule.notes,
      id,
      String(req.user.sub),
    );

    if (!result.changes) {
      return res.status(404).json({ error: "Capsule not found" });
    }

    const updated = await db.get(
      "SELECT * FROM capsules WHERE id = ? AND user_id = ?",
      id,
      String(req.user.sub),
    );

    res.json({ capsule: updated });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid capsule id" });
    }

    const db = await getDb();
    const result = await db.run(
      "DELETE FROM capsules WHERE id = ? AND user_id = ?",
      id,
      String(req.user.sub),
    );

    if (!result.changes) {
      return res.status(404).json({ error: "Capsule not found" });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
