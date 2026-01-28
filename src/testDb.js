import db from './db.js';

// Check all distinct combinations of type and status with counts:
const typeStatusCounts = db.prepare(`
  SELECT type, status, COUNT(*) as count
  FROM requests
  GROUP BY type, status
`).all();
console.log("Type and status counts:", typeStatusCounts);

// Check for trailing spaces in type or status:
const trailingSpaces = db.prepare(`
  SELECT id, '"' || type || '"' AS type, '"' || status || '"' AS status
  FROM requests
  WHERE type LIKE '% ' OR status LIKE '% '
  LIMIT 10
`).all();
console.log("Rows with trailing spaces:", trailingSpaces);
