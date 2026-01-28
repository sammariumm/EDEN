import express from "express";
import db from "../db.js";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// ==========================
// INPUT VALIDATION
// ==========================
function validateRequestInput(type, body) {
  if (type === "job_listing") {
    const { title, description, hourly_rate } = body;
    return (
      title &&
      description &&
      typeof hourly_rate === "number" &&
      !isNaN(hourly_rate)
    );
  }

  if (type === "store") {
    const { title, description, price, subcategory } = body;
    const validSubcategories = [
      "tools",
      "decoration",
      "plants",
      "flowers",
      "miscellaneous"
    ];

    return (
      title &&
      description &&
      typeof price === "number" &&
      !isNaN(price) &&
      validSubcategories.includes(subcategory)
    );
  }

  return false;
}

// ==========================
// USER: VIEW OWN REQUESTS
// ==========================
router.get("/my", authenticateToken, (req, res) => {
  const rows = db.prepare(`
    SELECT
      id,
      type,
      status,
      title,
      description,
      hourly_rate,
      price,
      subcategory,
      image
    FROM requests
    WHERE user_id = ?
    ORDER BY id DESC
  `).all(req.user.id);

  res.json(rows);
});

// ==========================
// USER: CREATE REQUEST (WITH OPTIONAL IMAGE)
// ==========================
router.post(
  "/create",
  authenticateToken,
  upload.single("image"),
  (req, res) => {
    const { type, title, description, hourly_rate, price, subcategory } = req.body;

    const parsedHourlyRate = hourly_rate !== undefined ? Number(hourly_rate) : null;
    const parsedPrice = price !== undefined ? Number(price) : null;

    const bodyForValidation = {
      type,
      title,
      description,
      hourly_rate: parsedHourlyRate,
      price: parsedPrice,
      subcategory,
    };

    if (!validateRequestInput(type, bodyForValidation)) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    db.prepare(`
      INSERT INTO requests (
        user_id,
        type,
        status,
        title,
        description,
        hourly_rate,
        price,
        subcategory,
        image
      )
      VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      type,
      title,
      description,
      type === "job_listing" ? parsedHourlyRate : null,
      type === "store" ? parsedPrice : null,
      type === "store" ? subcategory : null,
      imagePath
    );

    res.json({ message: "Request submitted successfully" });
  }
);

// ==========================
// ADMIN: VIEW PENDING REQUESTS
// ==========================
router.get(
  "/pending",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    const rows = db.prepare(`
      SELECT
        r.id,
        u.username,
        r.type,
        r.title,
        r.description,
        r.hourly_rate,
        r.price,
        r.subcategory,
        r.image
      FROM requests r
      JOIN users u ON r.user_id = u.id
      WHERE r.status = 'pending'
      ORDER BY r.id DESC
    `).all();

    res.json(rows);
  }
);

// ==========================
// ADMIN: APPROVE REQUEST
// ==========================
router.post(
  "/:id/approve",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    db.prepare(`
      UPDATE requests
      SET status = 'approved'
      WHERE id = ?
    `).run(req.params.id);

    res.json({ message: "Request approved" });
  }
);

// ==========================
// ADMIN: REJECT REQUEST
// ==========================
router.post(
  "/:id/reject",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    db.prepare(`
      UPDATE requests
      SET status = 'rejected'
      WHERE id = ?
    `).run(req.params.id);

    res.json({ message: "Request rejected" });
  }
);

export default router;
