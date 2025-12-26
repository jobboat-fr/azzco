/**
 * PostgreSQL Database Adapter
 * Use this for production deployments (Vercel, etc.)
 * Falls back to SQLite for local development
 */

const { Pool } = require('pg');

let pool = null;
let isPostgres = false;

/**
 * Initialize PostgreSQL connection
 */
async function initPostgresDatabase() {
    const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    
    if (!databaseUrl) {
        console.warn('⚠️  No PostgreSQL URL found, falling back to SQLite');
        return false;
    }

    try {
        pool = new Pool({
            connectionString: databaseUrl,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        isPostgres = true;
        console.log('✅ Connected to PostgreSQL database');
        
        // Test connection
        await pool.query('SELECT NOW()');
        console.log('✅ PostgreSQL connection verified');
        
        // Create tables
        await createTables();
        
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize PostgreSQL:', error);
        pool = null;
        isPostgres = false;
        return false;
    }
}

/**
 * Create tables if they don't exist
 */
async function createTables() {
    if (!pool) return;

    const queries = [
        // Visitors table
        `CREATE TABLE IF NOT EXISTS visitors (
            id SERIAL PRIMARY KEY,
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
        )`,
        
        // Chat logs table
        `CREATE TABLE IF NOT EXISTS chat_logs (
            id SERIAL PRIMARY KEY,
            visitor_id TEXT NOT NULL,
            session_id TEXT NOT NULL,
            message TEXT NOT NULL,
            response TEXT NOT NULL,
            persona_detected TEXT,
            context_keywords TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            response_time INTEGER,
            FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id)
        )`,
        
        // Page views table
        `CREATE TABLE IF NOT EXISTS page_views (
            id SERIAL PRIMARY KEY,
            visitor_id TEXT NOT NULL,
            page_path TEXT NOT NULL,
            page_title TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            time_spent INTEGER DEFAULT 0,
            scroll_depth INTEGER DEFAULT 0,
            FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id)
        )`,
        
        // Events table
        `CREATE TABLE IF NOT EXISTS events (
            id SERIAL PRIMARY KEY,
            visitor_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            event_data TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id)
        )`,
        
        // Notes table
        `CREATE TABLE IF NOT EXISTS notes (
            id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            title TEXT NOT NULL,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            visitor_id TEXT,
            FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id) ON DELETE SET NULL
        )`
    ];

    for (const query of queries) {
        try {
            await pool.query(query);
            console.log('✅ Table created/verified');
        } catch (error) {
            console.error('❌ Error creating table:', error.message);
        }
    }

    // Create indexes
    const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_notes_visitor_id ON notes(visitor_id)',
        'CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at)',
        'CREATE INDEX IF NOT EXISTS idx_chat_logs_visitor_id ON chat_logs(visitor_id)',
        'CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON page_views(visitor_id)',
        'CREATE INDEX IF NOT EXISTS idx_events_visitor_id ON events(visitor_id)'
    ];

    for (const indexQuery of indexes) {
        try {
            await pool.query(indexQuery);
            console.log('✅ Index created/verified');
        } catch (error) {
            console.warn('⚠️  Warning creating index:', error.message);
        }
    }
}

/**
 * Get database connection
 * Returns PostgreSQL pool if available, otherwise null (fallback to SQLite)
 */
function getPostgresDatabase() {
    return pool;
}

/**
 * Check if using PostgreSQL
 */
function isUsingPostgres() {
    return isPostgres;
}

/**
 * Close database connection
 */
async function closePostgresDatabase() {
    if (pool) {
        await pool.end();
        console.log('📊 PostgreSQL connection closed');
    }
}

module.exports = {
    initPostgresDatabase,
    getPostgresDatabase,
    isUsingPostgres,
    closePostgresDatabase
};
