/**
 * This file identifies the user.
 * Essentially, it answers the question:
 * "Who is the user making this request?"
 * 
 * Routes/HTTP Requests in this File:
 * - GET /users/me : returns user info if the provided JWT token is valid
 */

import express from "express";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "cultivating_paradise";

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  // Read authorization header
  const authHeader = req.headers['authorization'];

  // Splits "Bearer TOKENVALUE" and gets only the token part
  const token = authHeader && authHeader.split(' ')[1];

  /**
   * if the token is missing, return error code 401: missing token
   * this prevents further processing of the request if the user
   * is not authenticated / logged in
   */
  if (!token) return res.status(401).json({ message: "Missing token" });

  // verifies the token using the secret key
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}

/**
 * GET /users/me
 * 
 * if the given token is valid, this endpoint
 * returns user information.
 */
router.get('/me', authenticateToken, (req, res) => {
  // SQL query to get user info by id
  const user = db.prepare("SELECT id, username, isAdmin FROM users WHERE id = ?").get(req.user.id);

  // if user not found, return error code 404: user not found
  if (!user) return res.status(404).json({ message: "User not found" });

  // normalizes isAdmin from boolean to true/false for the frontend
  user.isAdmin = user.isAdmin === 1;

  // return user data
  res.json(user);
});

export default router;
