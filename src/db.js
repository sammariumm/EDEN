import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcryptjs";

const db = new DatabaseSync(":memory:");

db.exec(`
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            isAdmin INTEGER DEFAULT 0
        )
    `)

// Insert admin user
const adminUsername = 'admin'
const adminPassword = 'admin123' // CHANGE THIS LATER
const hashedAdminPassword = bcrypt.hashSync(adminPassword, 10)

db.prepare(`
    INSERT INTO users (username, password, isAdmin)
    VALUES (?, ?, ?)
`).run(adminUsername, hashedAdminPassword, 1)

// REQUEST TABLE =========================================

db.exec(`
        CREATE TABLE requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT CHECK(type IN ('job_listing', 'store')) NOT NULL,
            status TEXT CHECK(status IN ('pending','approved','rejected')) DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `)

// REQUEST TABLE CONTENTS ==============================

// Insert a normal user who will request posting in both job listings and store
const userUsername = 'user1'
const userPassword = 'userpass'
const hashedUserPassword = bcrypt.hashSync(userPassword, 10)

const insertUser = db.prepare(`
    INSERT INTO users (username, password, isAdmin)
    VALUES (?, ?, ?)
`)

const info = insertUser.run(userUsername, hashedUserPassword, 0)
const userId = info.lastInsertRowid


// Insert two pending requests for this user: one for job_listing, one for store
const insertRequest = db.prepare(`
    INSERT INTO requests (user_id, type, status)
    VALUES (?, ?, ?)
`)

insertRequest.run(userId, 'job_listing', 'pending')
insertRequest.run(userId, 'store', 'pending')

export default db;