import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcryptjs";

const db = new DatabaseSync(":memory:");

// ================= USERS TABLE =================
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    isAdmin INTEGER DEFAULT 0
  )
`);

// Admin user
const adminPassword = bcrypt.hashSync("admin123", 10);
db.prepare(`
  INSERT INTO users (username, password, isAdmin)
  VALUES (?, ?, ?)
`).run("admin", adminPassword, 1);

// Normal user
const userPassword = bcrypt.hashSync("userpass", 10);
const userInfo = db.prepare(`
  INSERT INTO users (username, password, isAdmin)
  VALUES (?, ?, ?)
`).run("user1", userPassword, 0);

const userId = userInfo.lastInsertRowid;

// ================= REQUESTS TABLE =================
db.exec(`
  CREATE TABLE requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('job_listing', 'store')) NOT NULL,
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    hourly_rate REAL,
    price REAL,
    subcategory TEXT CHECK(subcategory IN ('tools','decoration','plants','flowers','miscellaneous')),
    image_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);


// ================= SEED REQUESTS =================
const insertRequest = db.prepare(`
  INSERT INTO requests
  (user_id, type, status, title, description, hourly_rate, price, subcategory, image_path)
  VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)
`);

// Job listing (pending)
insertRequest.run(
  userId,
  "job_listing",
  "Part-time Web Developer",
  "Looking for a frontend developer to work 15–20 hours per week.",
  25.0,   // hourly_rate
  null,   // price
  null,   // subcategory
  null    // image_path
);

// Store request (pending)
insertRequest.run(
  userId,
  "store",
  "Handcrafted Plant Pot",
  "Eco-friendly ceramic pot suitable for indoor plants.",
  null,          // hourly_rate
  18.5,          // price
  "plants",      // subcategory
  null           // image_path
);

export default db;
