import express from "express";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "cultivating_paradise";

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: "Missing token" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}

// GET /users/me - return current user info if token valid
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare("SELECT id, username, isAdmin FROM users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.isAdmin = user.isAdmin === 1;
  res.json(user);
});

export default router;
