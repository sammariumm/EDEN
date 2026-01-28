import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcryptjs";

const db = new DatabaseSync(":memory:");

// Create users table
db.exec(`
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        isAdmin INTEGER DEFAULT 0
    )
`);

// Insert admin user
const adminUsername = 'admin';
const adminPassword = 'admin123'; // CHANGE THIS LATER
const hashedAdminPassword = bcrypt.hashSync(adminPassword, 10);

db.prepare(`
    INSERT INTO users (username, password, isAdmin)
    VALUES (?, ?, ?)
`).run(adminUsername, hashedAdminPassword, 1);

// Create requests table with subcategory support
db.exec(`
    CREATE TABLE requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT CHECK(type IN ('job_listing', 'store')) NOT NULL,
        status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        hourly_rate REAL,  -- Only for job_listing
        price REAL,        -- Only for store
        subcategory TEXT CHECK(subcategory IN ('tools', 'decoration', 'plants', 'flowers', 'miscellaneous')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
`);

// Insert a normal user
const userUsername = 'user1';
const userPassword = 'userpass';
const hashedUserPassword = bcrypt.hashSync(userPassword, 10);

const insertUser = db.prepare(`
    INSERT INTO users (username, password, isAdmin)
    VALUES (?, ?, ?)
`);

const info = insertUser.run(userUsername, hashedUserPassword, 0);
const userId = info.lastInsertRowid;

// Insert two pending requests for this user:

const insertRequest = db.prepare(`
    INSERT INTO requests (user_id, type, status, title, description, hourly_rate, price, subcategory)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// job_listing request with title, description, hourly_rate
insertRequest.run(
    userId,
    'job_listing',
    'pending',
    'Part-time Developer',
    'Looking for a React developer to work 20 hours a week.',
    20.5,  // hourly_rate
    null,  // price (not applicable)
    null   // subcategory (not applicable)
);

// store request with title, description, price, subcategory
insertRequest.run(
    userId,
    'store',
    'pending',
    'Handmade Mug',
    'Ceramic mug with custom design.',
    null,          // hourly_rate (not applicable)
    15.0,          // price
    'tools'        // example subcategory
);

export default db;
