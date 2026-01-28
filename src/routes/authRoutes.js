import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "cultivating_paradise";

router.post("/login", (req, res) => {
    // console.log("Login attempt with:", req.body);

    const { username, password } = req.body;

    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    // console.log("User found in DB:", user);

    if (!user) {
        console.log("No user found");
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = bcrypt.compareSync(password, user.password);
    //console.log("Password valid:", valid);

    if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
        {
            id: user.id,
            username: user.username,
            isAdmin: user.isAdmin === 1
        },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    res.json({ token });
});


router.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
    }

    const existingUser = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

    if (existingUser) {
        return res.status(409).json({ message: "Username already taken" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const info = db.prepare(`
        INSERT INTO users (username, password, isAdmin)
        VALUES (?, ?, 0)
    `).run(username, hashedPassword);

    const token = jwt.sign(
        { id: info.lastInsertRowid, username, isAdmin: false },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    res.status(201).json({ token });
});

router.get('/testuser/:username', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(req.params.username);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});


export default router;
