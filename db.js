const Database = require('better-sqlite3');
const db = new Database('./snowball.db');

db.prepare(`
    CREATE TABLE IF NOT EXISTS snowball (
        user_id TEXT PRIMARY KEY,
        thrown INTEGER DEFAULT 0,
        hit INTEGER DEFAULT 0,
        snowball INTEGER DEFAULT 0,
        coin INTEGER DEFAULT 0,
        response TEXT DEFAULT 'Hey, That hurts!'
    )`
).run();

db.prepare(
    `CREATE TABLE IF NOT EXISTS responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        quote TEXT NOT NULL,
        price INTEGER NOT NULL
    )`
).run();

db.prepare(
    `CREATE TABLE IF NOT EXISTS user_responses (
        user_id TEXT,
        response_id INTEGER,
        PRIMARY KEY (user_id, response_id)
    )`
).run();

module.exports = db;