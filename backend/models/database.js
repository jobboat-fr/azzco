const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/visitors.db');
const DB_DIR = path.dirname(DB_PATH);

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

let db = null;

function initDatabase() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                reject(err);
                return;
            }
            
            console.log('📊 Connected to SQLite database');
            
            // Create tables
            db.serialize(() => {
                // Visitors table
                db.run(`
                    CREATE TABLE IF NOT EXISTS visitors (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        visitor_id TEXT UNIQUE NOT NULL,
                        ip_address TEXT,
                        user_agent TEXT,
                        referrer TEXT,
                        first_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        last_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        visit_count INTEGER DEFAULT 1,
                        session_duration INTEGER DEFAULT 0,
                        pages_visited TEXT,
                        country TEXT,
                        city TEXT,
                        device_type TEXT,
                        browser TEXT,
                        os TEXT,
                        language TEXT
                    )
                `, (err) => {
                    if (err) {
                        console.error('Error creating visitors table:', err);
                        reject(err);
                        return;
                    }
                    console.log('✅ Visitors table created');
                });
                
                // Chat logs table
                db.run(`
                    CREATE TABLE IF NOT EXISTS chat_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        visitor_id TEXT NOT NULL,
                        session_id TEXT NOT NULL,
                        message TEXT NOT NULL,
                        response TEXT NOT NULL,
                        persona_detected TEXT,
                        context_keywords TEXT,
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        response_time INTEGER,
                        FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id)
                    )
                `, (err) => {
                    if (err) {
                        console.error('Error creating chat_logs table:', err);
                        reject(err);
                        return;
                    }
                    console.log('✅ Chat logs table created');
                });
                
                // Page views table
                db.run(`
                    CREATE TABLE IF NOT EXISTS page_views (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        visitor_id TEXT NOT NULL,
                        page_path TEXT NOT NULL,
                        page_title TEXT,
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        time_spent INTEGER DEFAULT 0,
                        scroll_depth INTEGER DEFAULT 0,
                        FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id)
                    )
                `, (err) => {
                    if (err) {
                        console.error('Error creating page_views table:', err);
                        reject(err);
                        return;
                    }
                    console.log('✅ Page views table created');
                });
                
                // Events table
                db.run(`
                    CREATE TABLE IF NOT EXISTS events (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        visitor_id TEXT NOT NULL,
                        event_type TEXT NOT NULL,
                        event_data TEXT,
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id)
                    )
                `, (err) => {
                    if (err) {
                        console.error('Error creating events table:', err);
                        reject(err);
                        return;
                    }
                    console.log('✅ Events table created');
                    resolve();
                });
            });
        });
    });
}

function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
}

function closeDatabase() {
    return new Promise((resolve, reject) => {
        if (db) {
            db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('📊 Database connection closed');
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
}

module.exports = {
    initDatabase,
    getDatabase,
    closeDatabase
};