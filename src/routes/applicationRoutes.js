import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware.js";
import { sendEmail } from "../utils/mailer.js";  // <-- Add this at the top

const router = express.Router();

/* ==========================
   DATABASE SETUP
========================== */

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const decodedDirname = decodeURIComponent(__dirname);
const winDirname = decodedDirname.startsWith("/") ? decodedDirname.slice(1) : decodedDirname;

const dbDir = path.resolve(winDirname, "../../db");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.resolve(dbDir, "eden.db");
const db = new Database(dbPath);

/* ==========================
   TABLE INIT
========================== */

db.prepare(`
  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    applicant_name TEXT NOT NULL,
    applicant_email TEXT NOT NULL,
    resume_path TEXT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending', 
    FOREIGN KEY (request_id) REFERENCES requests(id)
  )
`).run();

/* ==========================
   MULTER CONFIG
========================== */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

function fileFilter(req, file, cb) {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
}

const upload = multer({ storage, fileFilter });

/* ==========================
   ROUTES
========================== */

/**
 * POST /applications/submit
 * Public endpoint for submitting job applications
 */
router.post("/applications/submit", upload.single("resume"), (req, res) => {
  try {
    const { request_id, applicant_name, applicant_email } = req.body;
    const resumeFile = req.file;

    if (!request_id || !applicant_name || !applicant_email || !resumeFile) {
      if (resumeFile) fs.unlinkSync(resumeFile.path);
      return res.status(400).json({ message: "Missing required fields" });
    }

    db.prepare(`
      INSERT INTO applications (request_id, applicant_name, applicant_email, resume_path)
      VALUES (?, ?, ?, ?)
    `).run(request_id, applicant_name, applicant_email, resumeFile.path);

    res.json({ message: "Application submitted successfully" });
  } catch (error) {
    console.error("Submit application error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /applications/user
 * Get applications for jobs owned by the logged-in user
 */
router.get("/applications/user", authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    const applications = db.prepare(`
      SELECT
        applications.id,
        applications.applicant_name,
        applications.applicant_email,
        applications.resume_path,
        applications.submitted_at,
        applications.status,
        requests.title AS job_title
      FROM applications
      JOIN requests ON applications.request_id = requests.id
      WHERE requests.user_id = ?
      ORDER BY applications.submitted_at DESC
    `).all(userId);

    res.json(applications);
  } catch (error) {
    console.error("Fetch user applications error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /applications/admin
 * Admin-only: view all applications
 */
router.get("/applications/admin", authenticateToken, requireAdmin, (req, res) => {
  try {
    const applications = db.prepare(`
      SELECT
      applications.id,
      applications.applicant_name,
      applications.applicant_email,
      applications.resume_path,
      applications.submitted_at,
      applications.status,
      requests.title AS job_title
      FROM applications
      JOIN requests ON applications.request_id = requests.id
      ORDER BY applications.submitted_at DESC
    `).all();

    res.json(applications);
  } catch (error) {
    console.error("Fetch admin applications error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /applications/:id
 * Admin OR job owner can delete an application
 */
router.delete("/applications/:id", authenticateToken, (req, res) => {
  try {
    const applicationId = req.params.id;
    const userId = req.user.id;
    const role = req.user.role;

    const application = db.prepare(`
      SELECT
        applications.resume_path,
        requests.user_id AS job_owner_id
      FROM applications
      JOIN requests ON applications.request_id = requests.id
      WHERE applications.id = ?
    `).get(applicationId);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (role !== "admin" && application.job_owner_id !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this application" });
    }

    db.prepare(`DELETE FROM applications WHERE id = ?`).run(applicationId);

    if (application.resume_path && fs.existsSync(application.resume_path)) {
      fs.unlinkSync(application.resume_path);
    }

    res.json({ message: "Application deleted successfully" });
  } catch (error) {
    console.error("Delete application error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /applications/:id/accept
 * Accept an application (job owner or admin only)
 */
router.patch("/applications/:id/accept", authenticateToken, async (req, res) => {
  try {
    const applicationId = req.params.id;
    const userId = req.user.id;
    const role = req.user.role;

    // Fetch application and check ownership
    const application = db.prepare(`
      SELECT
        applications.applicant_email,
        applications.status,
        requests.user_id AS job_owner_id
      FROM applications
      JOIN requests ON applications.request_id = requests.id
      WHERE applications.id = ?
    `).get(applicationId);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (role !== "admin" && application.job_owner_id !== userId) {
      return res.status(403).json({ message: "Not authorized to accept this application" });
    }

    if (application.status === "accepted") {
      return res.status(400).json({ message: "Application already accepted" });
    }

    // Update status to 'accepted'
    db.prepare(`UPDATE applications SET status = 'accepted' WHERE id = ?`).run(applicationId);

    // Optional: Send acceptance email to applicant
    try {
      await sendEmail(
        application.applicant_email,
        "Application Accepted",
        `Congratulations! Your application has been accepted. We'll be in touch soon.`
      );
    } catch (emailErr) {
      console.error("Email send failed:", emailErr);
      // Don't fail the request if email fails
    }

    res.json({ message: "Application accepted successfully" });
  } catch (error) {
    console.error("Accept application error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /applications/:id/reject
 * Reject an application (job owner or admin only)
 */
router.patch("/applications/:id/reject", authenticateToken, async (req, res) => {
  try {
    const applicationId = req.params.id;
    const userId = req.user.id;
    const role = req.user.role;

    // Fetch application and check ownership
    const application = db.prepare(`
      SELECT
        applications.applicant_email,
        applications.status,
        requests.user_id AS job_owner_id
      FROM applications
      JOIN requests ON applications.request_id = requests.id
      WHERE applications.id = ?
    `).get(applicationId);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (role !== "admin" && application.job_owner_id !== userId) {
      return res.status(403).json({ message: "Not authorized to reject this application" });
    }

    if (application.status === "rejected") {
      return res.status(400).json({ message: "Application already rejected" });
    }

    if (application.status === "accepted") {
      return res.status(400).json({ message: "Accepted applications cannot be rejected" });
    }

    // Update status to 'rejected'
    db.prepare(`
      UPDATE applications
      SET status = 'rejected'
      WHERE id = ?
    `).run(applicationId);

    // Send rejection email
    try {
      await sendEmail(
        application.applicant_email,
        "Application Update",
        "Thank you for your interest. After careful consideration, we regret to inform you that your application was not selected."
      );
    } catch (emailErr) {
      console.error("Rejection email failed:", emailErr);
      // Email failure should NOT rollback rejection
    }

    res.json({ message: "Application rejected successfully" });
  } catch (error) {
    console.error("Reject application error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
