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

  if (type === "service_avail") {
    const { title, description, parent_job_id } = body;
    return (
      title &&
      description &&
      Number.isInteger(Number(parent_job_id))
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
      r.id,
      r.type,
      r.status,
      r.title,
      r.description,
      r.hourly_rate,
      r.price,
      r.subcategory,
      r.image,
      r.parent_job_id,
      pj.title AS parent_job_title
    FROM requests r
    LEFT JOIN requests pj ON r.parent_job_id = pj.id
    WHERE r.user_id = ?
      AND r.is_deleted = 0
    ORDER BY r.id DESC
  `).all(req.user.id);

  res.json(rows);
});

// ==========================
// USER: CREATE REQUEST
// ==========================
router.post(
  "/create",
  authenticateToken,
  upload.single("image"),
  (req, res) => {
    const {
      type,
      title,
      description,
      hourly_rate,
      price,
      subcategory,
      parent_job_id
    } = req.body;

    const parsedHourlyRate =
      hourly_rate !== undefined ? Number(hourly_rate) : null;
    const parsedPrice =
      price !== undefined ? Number(price) : null;

    const bodyForValidation = {
      type,
      title,
      description,
      hourly_rate: parsedHourlyRate,
      price: parsedPrice,
      subcategory,
      parent_job_id
    };

    if (!validateRequestInput(type, bodyForValidation)) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // SERVICE AVAIL GUARDS
    if (type === "service_avail") {
      const job = db.prepare(`
        SELECT id, user_id
        FROM requests
        WHERE id = ?
          AND type = 'job_listing'
          AND status = 'approved'
          AND is_deleted = 0
      `).get(parent_job_id);

      if (!job) {
        return res.status(400).json({ message: "Invalid job reference" });
      }

      if (job.user_id === req.user.id) {
        return res.status(403).json({
          message: "You cannot avail your own job"
        });
      }
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
        image,
        parent_job_id,
        is_deleted
      )
      VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      req.user.id,
      type,
      title,
      description,
      type === "job_listing" ? parsedHourlyRate : null,
      type === "store" ? parsedPrice : null,
      type === "store" ? subcategory : null,
      imagePath,
      type === "service_avail" ? Number(parent_job_id) : null
    );

    res.json({ message: "Request submitted successfully" });
  }
);

// ==========================
// ADMIN: VIEW PENDING REQUESTS
// ==========================
router.get("/pending", authenticateToken, requireAdmin, (req, res) => {
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
      r.image,
      r.parent_job_id
    FROM requests r
    JOIN users u ON r.user_id = u.id
    WHERE r.status = 'pending'
      AND r.is_deleted = 0
    ORDER BY r.id DESC
  `).all();

  res.json(rows);
});

// ==========================
// ADMIN: APPROVE / REJECT
// ==========================
router.post("/:id/approve", authenticateToken, requireAdmin, (req, res) => {
  db.prepare(`
    UPDATE requests
    SET status = 'approved'
    WHERE id = ? AND is_deleted = 0
  `).run(req.params.id);

  res.json({ message: "Request approved" });
});

router.post("/:id/reject", authenticateToken, requireAdmin, (req, res) => {
  db.prepare(`
    UPDATE requests
    SET status = 'rejected'
    WHERE id = ? AND is_deleted = 0
  `).run(req.params.id);

  res.json({ message: "Request rejected" });
});

// ==========================
// STORE: GET APPROVED ITEMS WITH SEARCH
// ==========================
router.get("/approved", (req, res) => {
  const { subcategory, search } = req.query;
  const validSubs = [
    "tools",
    "decoration",
    "plants",
    "flowers",
    "miscellaneous"
  ];

  let query = `
    SELECT *
    FROM requests
    WHERE status = 'approved'
      AND type = 'store'
      AND is_deleted = 0
  `;

  const params = [];

  if (subcategory) {
    if (!validSubs.includes(subcategory)) {
      return res.status(400).json({ message: "Invalid subcategory" });
    }
    query += " AND subcategory = ?";
    params.push(subcategory);
  }

  if (search && search.trim() !== "") {
    const trimmedSearch = `%${search.trim().toLowerCase()}%`;
    query += " AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ?)";
    params.push(trimmedSearch, trimmedSearch);
  }

  const items = db.prepare(query).all(...params);
  res.json(items);
});

// ==========================
// JOBS: GET APPROVED LISTINGS WITH SEARCH
// ==========================
router.get("/jobs/approved", (req, res) => {
  const { search } = req.query;

  let query = `
    SELECT
      r.id,
      r.title,
      r.description,
      r.hourly_rate,
      r.image,
      u.username
    FROM requests r
    JOIN users u ON r.user_id = u.id
    WHERE r.type = 'job_listing'
      AND r.status = 'approved'
      AND r.is_deleted = 0
  `;

  const params = [];

  if (search && search.trim() !== "") {
    const trimmedSearch = `%${search.trim().toLowerCase()}%`;
    query += " AND (LOWER(r.title) LIKE ? OR LOWER(r.description) LIKE ?)";
    params.push(trimmedSearch, trimmedSearch);
  }

  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

// ==========================
// ADMIN: VIEW ALL REQUESTS
// ==========================
router.get("/admin/all", authenticateToken, requireAdmin, (req, res) => {
  const rows = db.prepare(`
    SELECT
      r.id,
      r.user_id,
      u.username,
      r.type,
      r.title,
      r.description,
      r.hourly_rate,
      r.price,
      r.subcategory,
      r.status,
      r.image,
      r.parent_job_id
    FROM requests r
    JOIN users u ON r.user_id = u.id
    WHERE r.is_deleted = 0
    ORDER BY r.id DESC
  `).all();

  res.json(rows);
});

// ==========================
// USER: SOFT DELETE OWN REQUEST
// ==========================
router.delete("/:id", authenticateToken, (req, res) => {
  const result = db.prepare(`
    UPDATE requests
    SET is_deleted = 1
    WHERE id = ? AND user_id = ?
  `).run(req.params.id, req.user.id);

  if (result.changes === 0) {
    return res.status(403).json({ message: "Not authorized or already deleted" });
  }

  res.json({ message: "Request removed successfully" });
});

// ==========================
// ADMIN: SOFT DELETE ANY REQUEST
// ==========================
router.delete(
  "/admin/:id",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    db.prepare(`
      UPDATE requests
      SET is_deleted = 1
      WHERE id = ?
    `).run(req.params.id);

    res.json({ message: "Request removed by admin" });
  }
);

export default router;
