import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

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

export default router;
