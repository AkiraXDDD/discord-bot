const Database = require('better-sqlite3');
const db = new Database('./snowball.db');

db.prepare(`
    CREATE TABLE IF NOT EXISTS snowball_stats (
        user_id TEXT PRIMARY KEY,
        thrown INTEGER DEFAULT 0,
        hit INTERGER DEFAULT 0
    )
`).run();

module.exports = db;