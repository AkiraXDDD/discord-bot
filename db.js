const Database = require('better-sqlite3');
const db = new Database('./snowball.db');

db.prepare(`
    CREATE TABLE IF NOT EXISTS snowball (
        user_id TEXT PRIMARY KEY,
        thrown INTEGER DEFAULT 0,
        hit INTEGER DEFAULT 0,
        snowball INTEGER DEFAULT 0,
        coin INTEGER DEFAULT 0
    )
`).run();

module.exports = db;