import express from "express";
import db from "../db.js";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// USER: view own requests
router.get("/requests/my", authenticateToken, (req, res) => {
    const rows = db.prepare(`
        SELECT type, status, created_at
        FROM requests
        WHERE user_id = ?
    `).all(req.user.id);

    res.json(rows);
});

// USER: create request
router.post("/requests/create", authenticateToken, (req, res) => {
    const { type } = req.body;

    db.prepare(`
        INSERT INTO requests (user_id, type)
        VALUES (?, ?)
    `).run(req.user.id, type);

    res.json({ message: "Request submitted" });
});

// ADMIN: view pending requests
router.get(
    "/requests/pending",
    authenticateToken,
    requireAdmin,
    (req, res) => {
        const rows = db.prepare(`
            SELECT r.id, u.username, r.type
            FROM requests r
            JOIN users u ON r.user_id = u.id
            WHERE r.status = 'pending'
        `).all();
        res.json(rows);
    }
);

// ADMIN: approve request
router.post(
    "/requests/:id/approve",
    authenticateToken,
    requireAdmin,
    (req, res) => {
        db.prepare(`
            UPDATE requests SET status = 'approved'
            WHERE id = ?
        `).run(req.params.id);

        res.json({ message: "Request approved" });
    }
);

// ADMIN: reject request
router.post(
    "/requests/:id/reject",
    authenticateToken,
    requireAdmin,
    (req, res) => {
        db.prepare(`
            UPDATE requests SET status = 'rejected'
            WHERE id = ?
        `).run(req.params.id);

        res.json({ message: "Request rejected" });
    }
);

export default router;
