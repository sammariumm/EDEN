import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware.js";  // adjust path if needed

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const decodedDirname = decodeURIComponent(__dirname);
const winDirname = decodedDirname.startsWith('/') ? decodedDirname.slice(1) : decodedDirname;

const dbDir = path.resolve(winDirname, "../../db");

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.resolve(dbDir, "eden.db");
const db = new Database(dbPath);
const router = express.Router();

// New route to get applications for logged-in user's job requests
router.get("/user/applications", authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        applications.id,
        applications.request_id,
        applications.applicant_name,
        applications.applicant_email,
        applications.resume_path,
        applications.submitted_at,
        requests.title AS job_title
      FROM applications
      JOIN requests ON applications.request_id = requests.id
      WHERE requests.user_id = ?
      ORDER BY applications.submitted_at DESC;
    `;

    const applications = db.prepare(query).all(userId);

    res.json(applications);
  } catch (error) {
    console.error("Error fetching user applications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Make sure this folder exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Only accept PDFs
function fileFilter(req, file, cb) {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed!"), false);
  }
}

const upload = multer({ storage, fileFilter });

// Create applications table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    applicant_name TEXT NOT NULL,
    applicant_email TEXT NOT NULL,
    resume_path TEXT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(request_id) REFERENCES requests(id)
  )
`).run();

// POST /applications/submit
router.post("/applications/submit", upload.single("resume"), (req, res) => {
  try {
    const { request_id, applicant_name, applicant_email } = req.body;
    const resumeFile = req.file;

    if (!request_id || !applicant_name || !applicant_email || !resumeFile) {
      if (resumeFile) fs.unlinkSync(resumeFile.path);
      return res.status(400).send("Missing required fields or resume file.");
    }

    const insert = db.prepare(`
      INSERT INTO applications (request_id, applicant_name, applicant_email, resume_path)
      VALUES (?, ?, ?, ?)
    `);

    insert.run(request_id, applicant_name, applicant_email, resumeFile.path);

    res.status(200).send("Application submitted successfully.");
  } catch (err) {
    console.error("Submit application error:", err);
    res.status(500).send("Server error.");
  }
});

// show applications for user-uploaded job listing
router.get("/user/applications", (req, res) => {
  try {
    // You need to get the logged-in user's id from the session/auth token
    const userId = req.user.id;  // adjust based on your auth setup
    
    const query = `
      SELECT 
        applications.id,
        applications.request_id,
        applications.applicant_name,
        applications.applicant_email,
        applications.resume_path,
        applications.submitted_at,
        requests.title AS job_title
      FROM applications
      JOIN requests ON applications.request_id = requests.id
      WHERE requests.user_id = ?
      ORDER BY applications.submitted_at DESC;
    `;

    const applications = db.prepare(query).all(userId);

    res.json(applications);

  } catch (error) {
    console.error("Error fetching user applications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// for admin
router.get("/admin/applications", authenticateToken, requireAdmin, (req, res) => {
  try {
    const adminUserId = req.user.id;

    const query = `
      SELECT 
        applications.id,
        applications.request_id,
        applications.applicant_name,
        applications.applicant_email,
        applications.resume_path,
        applications.submitted_at,
        requests.title AS job_title
      FROM applications
      JOIN requests ON applications.request_id = requests.id
      WHERE requests.user_id = ?
      ORDER BY applications.submitted_at DESC;
    `;

    const applications = db.prepare(query).all(adminUserId);

    res.json(applications);
  } catch (error) {
    console.error("Error fetching admin applications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


export default router;
