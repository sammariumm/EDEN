import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Who am I?
router.get("/me", authenticateToken, (req, res) => {
    res.json(req.user);
});

export default router;
