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
      AND is_deleted = 0
    ORDER BY id DESC
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
        image,
        is_deleted
      )
      VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, 0)
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
      r.image
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
// USER: DELETE OWN REQUEST (SOFT DELETE)
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
// ADMIN: DELETE ANY REQUEST
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

// ==========================
// STORE: GET APPROVED ITEMS
// ==========================
router.get("/approved", (req, res) => {
  const { subcategory } = req.query;
  const validSubs = ['tools', 'decoration', 'plants', 'flowers', 'miscellaneous'];

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

  const items = db.prepare(query).all(...params);
  res.json(items);
});

// ==========================
// JOBS: GET APPROVED LISTINGS
// ==========================
router.get("/jobs/approved", (req, res) => {
  const rows = db.prepare(`
    SELECT r.id, r.title, r.description, r.hourly_rate, r.image, u.username
    FROM requests r
    JOIN users u ON r.user_id = u.id
    WHERE r.type = 'job_listing'
      AND r.status = 'approved'
      AND r.is_deleted = 0
  `).all();

  res.json(rows);
});

// Get all requests by the authenticated user
router.get("/my", authenticateToken, (req, res) => {
  const userId = req.user.id; // from authenticateToken middleware
  const sql = `
    SELECT id, type, title, description, hourly_rate, price, subcategory, status, image
    FROM requests
    WHERE user_id = ? AND is_deleted = 0
    ORDER BY id DESC
  `;

  try {
    const stmt = db.prepare(sql);
    const requests = stmt.all(userId);
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch your posts" });
  }
});

// Delete a request by id, only if owned by the user or admin
router.delete("/:id", authenticateToken, (req, res) => {
  const requestId = req.params.id;
  const userId = req.user.id;
  const isAdmin = req.user.isAdmin;

  // First check if the request belongs to the user or if admin
  try {
    const selectStmt = db.prepare("SELECT user_id FROM requests WHERE id = ? AND is_deleted = 0");
    const request = selectStmt.get(requestId);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.user_id !== userId && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized to delete this request" });
    }

    const deleteStmt = db.prepare("UPDATE requests SET is_deleted = 1 WHERE id = ?");
    deleteStmt.run(requestId);

    res.json({ message: "Request deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete request" });
  }
});

// --------------------------------------
// GET /requests/all  (Admin only)
// Return all job/store posts with username
router.get("/all", authenticateToken, requireAdmin, (req, res) => {
      const sql = `
        SELECT r.id, r.user_id, u.username, r.type, r.title, r.description, r.hourly_rate, r.price, r.subcategory, r.status, r.image
        FROM requests r
        JOIN users u ON r.user_id = u.id
        ORDER BY r.id DESC
      `;

      try {
      const stmt = db.prepare(sql);
      const rows = stmt.all(); // no callback, returns rows directly
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch requests" });
    }

    });

    // Route to get ALL requests for admin dashboard
    router.get("/admin/all", authenticateToken, requireAdmin, async (req, res) => {
      try {
          const stmt = db.prepare(`
            SELECT requests.*, users.username
            FROM requests
            JOIN users ON requests.user_id = users.id
            WHERE requests.is_deleted = 0;
          `);
          const requests = stmt.all();
          res.json(requests);
        } catch (error) {
          console.error("Error fetching all requests for admin:", error);
          res.status(500).json({ message: "Internal server error" });
        }
    });

// --------------------------------------
// DELETE /requests/admin/:id  (Admin only)
// Delete any request by ID
router.delete("/admin/:id", authenticateToken, requireAdmin, (req, res) => {
  const id = req.params.id;

  const sql = `DELETE FROM requests WHERE id = ?`;
  db.run(sql, [id], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to delete request" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.json({ message: "Request deleted successfully" });
  });
});

// --------------------------------------
// DELETE /requests/:id  (User only, own posts)
// Delete request by ID if owned by current user
router.delete("/:id", authenticateToken, (req, res) => {
  const id = req.params.id;
  const userId = req.user.id; // from your authenticateToken middleware

  const sql = `DELETE FROM requests WHERE id = ? AND user_id = ?`;
  db.run(sql, [id, userId], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to delete request" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Request not found or not authorized" });
    }
    res.json({ message: "Request deleted successfully" });
  });
});

export default router;
