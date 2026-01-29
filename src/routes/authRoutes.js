/**
 * This file handles both user login and registration.
 * It verifies user credentials during login and
 * stores new user data during registration.
 * 
 * Routes/HTTP Requests in this File:
 * - POST /auth/login : handles user login
 * - POST /auth/register : handles user registration
 */

import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "cultivating_paradise";    // used for signing JWT tokens

/**
 * POST /auth/login request
 * 
 * This endpoint handles user login. 
 * It sends data to the database to verify user credentials.
 */
router.post("/login", (req, res) => {
    // console.log("Login attempt with:", req.body); => for debugging

    const { username, password } = req.body;

    // SQL query to find if the user exists
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    // console.log("User found in DB:", user); => for debugging

    // if the user does not exist, return error code 401: invalid credentials
    if (!user) {
        console.log("No user found");
        return res.status(401).json({ message: "Invalid credentials" });
    }

    // if the user exists, hash the given password and compare with the stored hash in the database
    const valid = bcrypt.compareSync(password, user.password);
    //console.log("Password valid:", valid); => for debugging

    // if the password is invalid, return error code 401: invalid credentials
    if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    /**
     * Creates a JWT token valid for 1 hr
     * using user_id, username, isAdmin as the payload
     */
    const token = jwt.sign(
        {
            id: user.id,
            username: user.username,
            isAdmin: user.isAdmin === 1
        },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    // sends the token back to the client
    res.json({ token });
});

/**
 * POST /auth/register request
 * 
 * This endpoint handles user registration.
 * It stores new user credentials in the database.
 */
router.post("/register", (req, res) => {
    const { username, password } = req.body;

    // checks if username and password are provided by the client
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
    }

    // SQL query to check if the username is already taken
    const existingUser = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

    // checks if the username is already taken
    if (existingUser) {
        return res.status(409).json({ message: "Username already taken" });
    }

    /**
     * if the username is available,
     * the hashed password is stored in the database
     * along with the username and isAdmin = 0 (normal user)
     */
    const hashedPassword = bcrypt.hashSync(password, 10);

    // SQL query to insert new user into the database
    const info = db.prepare(`
        INSERT INTO users (username, password, isAdmin)
        VALUES (?, ?, 0)
    `).run(username, hashedPassword);

    /**
     * Creates a JWT token valid for 1 hr
     * using user_id, username, isAdmin as the payload
     */
    const token = jwt.sign(
        { id: info.lastInsertRowid, username, isAdmin: false },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    // sends the token back to the client
    res.status(201).json({ token });
});

/**
 * This endpoint is for testing purposes only.
 */

/**
 * router.get('/testuser/:username', (req, res) => {
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(req.params.username);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    });
 */

export default router;