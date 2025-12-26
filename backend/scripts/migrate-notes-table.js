/**
 * Migration script to create notes table in PostgreSQL
 * Compatible with Supabase and Vercel Postgres
 * 
 * Run this script after setting up your PostgreSQL database
 */

const { Pool } = require('pg');
require('dotenv').config();

const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ Error: POSTGRES_URL or DATABASE_URL not found in environment variables');
    console.error('Please set one of these variables in your .env file or environment');
    process.exit(1);
}

const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createNotesTable() {
    try {
        console.log('📊 Connecting to PostgreSQL database...');
        
        // Test connection
        await pool.query('SELECT NOW()');
        console.log('✅ Connected to database');

        // Create the notes table
        console.log('📝 Creating notes table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notes (
                id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
                title TEXT NOT NULL,
                content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                visitor_id TEXT,
                FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id) ON DELETE SET NULL
            )
        `);
        console.log('✅ Notes table created');

        // Insert sample data (only if table is empty)
        const existingNotes = await pool.query('SELECT COUNT(*) FROM notes');
        if (parseInt(existingNotes.rows[0].count) === 0) {
            console.log('📝 Inserting sample data...');
            await pool.query(`
                INSERT INTO notes (title, content)
                VALUES
                    ('Today I created a Supabase project.', 'This is a sample note about creating a Supabase project.'),
                    ('I added some data and queried it from Next.js.', 'This note describes adding and querying data from Next.js.'),
                    ('It was awesome!', 'A simple note expressing enthusiasm.')
            `);
            console.log('✅ Sample data inserted');
        } else {
            console.log('ℹ️  Notes table already contains data, skipping sample data insertion');
        }

        // Enable Row Level Security (RLS) - Supabase specific
        // This will work on Supabase, but may fail on other PostgreSQL instances
        try {
            console.log('🔒 Enabling Row Level Security...');
            await pool.query('ALTER TABLE notes ENABLE ROW LEVEL SECURITY');
            console.log('✅ Row Level Security enabled');
        } catch (error) {
            if (error.message.includes('does not exist') || error.message.includes('not supported')) {
                console.warn('⚠️  Row Level Security not supported on this PostgreSQL instance (this is normal for non-Supabase databases)');
            } else {
                throw error;
            }
        }

        // Create indexes for better performance
        console.log('📊 Creating indexes...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_notes_visitor_id ON notes(visitor_id);
            CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
        `);
        console.log('✅ Indexes created');

        console.log('✅ Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration error:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run migration
createNotesTable()
    .then(() => {
        console.log('🎉 Migration script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    });
