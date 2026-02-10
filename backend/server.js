const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const chatbotRoutes = require('./routes/chatbot');
const analyticsRoutes = require('./routes/analytics');
const notesRoutes = require('./routes/notes');
const { initDatabase } = require('./models/database');

const app = express();
const PORT = process.env.PORT || 3000;

function buildCorsOptions() {
    const allowedOrigins = (process.env.FRONTEND_URL || '')
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);

    return {
        origin: (origin, callback) => {
            // Allow non-browser requests (server-to-server, health checks, curl)
            if (!origin) return callback(null, true);

            // If no explicit origin configured, allow all in development
            if (allowedOrigins.length === 0 && process.env.NODE_ENV !== 'production') {
                return callback(null, true);
            }

            if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error('CORS origin not allowed'));
        },
        credentials: true
    };
}

// Middleware
// Vercel sits behind proxies and sets X-Forwarded-For.
// Required for express-rate-limit to correctly identify clients.
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors(buildCorsOptions()));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Rate limiting - Return JSON instead of text
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    handler: (req, res) => {
        res.json({ 
            success: false,
            error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
        });
    }
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notes', notesRoutes);

// Error handling - Always return valid JSON, never 500
app.use((err, req, res, next) => {
    console.error('Error:', err);
    if (!res.headersSent) {
        res.json({ 
            success: false,
            error: 'Une erreur interne est survenue',
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// For Vercel serverless functions, export the app directly
// Vercel automatically detects module.exports and uses it as the handler
// Initialize database lazily on first request (for Vercel)
if (process.env.VERCEL) {
    // On Vercel, initialize database on first request
    let dbInitialized = false;
    app.use(async (req, res, next) => {
        if (!dbInitialized) {
            try {
                await initDatabase();
                dbInitialized = true;
                console.log('✅ Database initialized (Vercel)');
            } catch (err) {
                console.error('❌ Database initialization failed:', err);
                // Continue anyway - database operations will fail gracefully
            }
        }
        next();
    });
}

// For local development, start the server
if (!process.env.VERCEL && require.main === module) {
    initDatabase().then(() => {
        console.log('✅ Database initialized');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📡 Google Gemini API: ${process.env.GOOGLE_AI_API_KEY ? 'Configured' : 'Not configured'}`);
        });
    }).catch(err => {
        console.error('❌ Database initialization failed:', err);
        process.exit(1);
    });
}

module.exports = app;