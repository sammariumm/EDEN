import express from "express";
import db from "../db.js";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Helper to validate input based on type
function validateRequestInput(type, body) {
  if (type === "job_listing") {
    const { title, description, hourly_rate } = body;
    if (!title || !description || typeof hourly_rate !== "number") {
      return false;
    }
  } else if (type === "store") {
    const { title, description, price, subcategory } = body;
    const validSubcategories = ['tools', 'decoration', 'plants', 'flowers', 'miscellaneous'];
    if (
      !title ||
      !description ||
      typeof price !== "number" ||
      !subcategory ||
      !validSubcategories.includes(subcategory)
    ) {
      return false;
    }
  } else {
    return false;
  }
  return true;
}

// USER: view own requests
router.get("/requests/my", authenticateToken, (req, res) => {
  const rows = db.prepare(`
    SELECT id, type, status, created_at, title, description, hourly_rate, price, subcategory
    FROM requests
    WHERE user_id = ?
  `).all(req.user.id);

  res.json(rows);
});

// USER: create request
router.post("/requests/create", authenticateToken, (req, res) => {
  const { type, title, description, hourly_rate, price, subcategory } = req.body;

  if (!validateRequestInput(type, req.body)) {
    return res.status(400).json({ message: "Invalid input for request type" });
  }

  const stmt = db.prepare(`
    INSERT INTO requests (user_id, type, status, title, description, hourly_rate, price, subcategory)
    VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)
  `);

  stmt.run(
    req.user.id,
    type,
    title,
    description,
    type === "job_listing" ? hourly_rate : null,
    type === "store" ? price : null,
    type === "store" ? subcategory : null
  );

  res.json({ message: "Request submitted" });
});

// ADMIN: view pending requests
router.get("/requests/pending", authenticateToken, requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT r.id, u.username, r.type, r.title, r.description, r.hourly_rate, r.price, r.subcategory
    FROM requests r
    JOIN users u ON r.user_id = u.id
    WHERE r.status = 'pending'
  `).all();

  res.json(rows);
});

// ADMIN: approve request
router.post("/requests/:id/approve", authenticateToken, requireAdmin, (req, res) => {
  db.prepare(`
    UPDATE requests SET status = 'approved'
    WHERE id = ?
  `).run(req.params.id);

  res.json({ message: "Request approved" });
});

// ADMIN: reject request
router.post("/requests/:id/reject", authenticateToken, requireAdmin, (req, res) => {
  db.prepare(`
    UPDATE requests SET status = 'rejected'
    WHERE id = ?
  `).run(req.params.id);

  res.json({ message: "Request rejected" });
});

export default router;
