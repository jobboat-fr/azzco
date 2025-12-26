const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { initPostgresDatabase, getPostgresDatabase, isUsingPostgres } = require('./postgresDatabase');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/visitors.db');
const DB_DIR = path.dirname(DB_PATH);

// Detect if we're on Vercel (read-only filesystem)
const IS_VERCEL = !!process.env.VERCEL;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Only create data directory for SQLite if NOT on Vercel
// On Vercel, we MUST use PostgreSQL (Supabase)
if (!IS_VERCEL && !IS_PRODUCTION) {
    // Only create directory for local development
    try {
        if (!fs.existsSync(DB_DIR)) {
            fs.mkdirSync(DB_DIR, { recursive: true });
        }
    } catch (err) {
        console.warn('⚠️  Could not create data directory (this is OK on Vercel):', err.message);
    }
}

let db = null;
let usePostgres = false;

async function initDatabase() {
    // On Vercel, ONLY use PostgreSQL (filesystem is read-only)
    if (IS_VERCEL) {
        console.log('🔵 Vercel detected - using PostgreSQL only');
        const postgresInitialized = await initPostgresDatabase();
        if (postgresInitialized) {
            usePostgres = true;
            return Promise.resolve();
        } else {
            console.warn('⚠️  PostgreSQL not available on Vercel - database features will be disabled');
            // Don't fail - continue without database
            return Promise.resolve();
        }
    }

    // Try PostgreSQL first (for production)
    const postgresInitialized = await initPostgresDatabase();
    if (postgresInitialized) {
        usePostgres = true;
        return Promise.resolve();
    }

    // Fallback to SQLite (for local development only)
    // On Vercel, we never reach here
    return new Promise((resolve, reject) => {
        // Ensure directory exists before creating database (local dev only)
        try {
            if (!fs.existsSync(DB_DIR)) {
                fs.mkdirSync(DB_DIR, { recursive: true });
            }
        } catch (err) {
            console.warn('⚠️  Could not create data directory:', err.message);
            // Continue anyway - database might still work
        }
        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                reject(err);
                return;
            }
            
            console.log('📊 Connected to SQLite database');
            usePostgres = false;
            
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
                        country_code TEXT,
                        region TEXT,
                        region_code TEXT,
                        city TEXT,
                        timezone TEXT,
                        latitude REAL,
                        longitude REAL,
                        isp TEXT,
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
                });
                
                // Notes table
                db.run(`
                    CREATE TABLE IF NOT EXISTS notes (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        title TEXT NOT NULL,
                        content TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        visitor_id TEXT,
                        FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id) ON DELETE SET NULL
                    )
                `, (err) => {
                    if (err) {
                        console.error('Error creating notes table:', err);
                        reject(err);
                        return;
                    }
                    console.log('✅ Notes table created');
                    
                    // Create indexes
                    db.run(`CREATE INDEX IF NOT EXISTS idx_notes_visitor_id ON notes(visitor_id)`, (err) => {
                        if (err) console.warn('Warning creating index:', err);
                    });
                    db.run(`CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at)`, (err) => {
                        if (err) console.warn('Warning creating index:', err);
                        resolve();
                    });
                });
            });
        });
    });
}

function getDatabase() {
    if (usePostgres) {
        const pgDb = getPostgresDatabase();
        if (!pgDb) {
            throw new Error('PostgreSQL database not initialized. Call initDatabase() first.');
        }
        return pgDb;
    }
    
    if (!db) {
        throw new Error('SQLite database not initialized. Call initDatabase() first.');
    }
    return db;
}

function isPostgres() {
    return usePostgres;
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
    closeDatabase,
    isPostgres
};