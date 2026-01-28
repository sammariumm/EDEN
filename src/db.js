import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname since using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Open persistent database file (adjust the path and filename if needed)
const dbPath = path.join(__dirname, '../db/eden.db');
const db = new Database(dbPath);
console.log("DB Path:", dbPath);
// Check if tables exist (optional: you can remove if you're confident)
// This example just tries a simple query to see if 'users' exists
try {
  db.prepare('SELECT 1 FROM users LIMIT 1').get();
} catch (e) {
  console.error("Database not initialized or missing tables:", e.message);
  process.exit(1);
}

// Export the database connection for use in other modules
export default db;
