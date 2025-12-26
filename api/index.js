const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const path = require('path');

// Set the backend directory in the path
const backendPath = path.join(__dirname, '..', 'backend');
process.env.BACKEND_PATH = backendPath;

const chatbotRoutes = require(path.join(backendPath, 'routes', 'chatbot'));
const analyticsRoutes = require(path.join(backendPath, 'routes', 'analytics'));
const notesRoutes = require(path.join(backendPath, 'routes', 'notes'));
const { initDatabase } = require(path.join(backendPath, 'models', 'database'));

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Vercel sits behind proxies and sets X-Forwarded-For.
// Required for express-rate-limit to correctly identify clients.
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
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

// Routes - Express will handle errors through error middleware
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
    // On Vercel, initialize database on first request (non-blocking)
    let dbInitialized = false;
    let dbInitInProgress = false;
    app.use(async (req, res, next) => {
        // Don't block requests if DB init fails
        if (!dbInitialized && !dbInitInProgress) {
            dbInitInProgress = true;
            initDatabase()
                .then(() => {
                    dbInitialized = true;
                    console.log('✅ Database initialized (Vercel)');
                })
                .catch(err => {
                    console.error('❌ Database initialization failed:', err);
                    // Continue anyway - database operations will fail gracefully
                })
                .finally(() => {
                    dbInitInProgress = false;
                });
        }
        // Always continue to next middleware, don't wait for DB
        next();
    });
    
    // Better error handling for Vercel - Always return valid JSON
    app.use((err, req, res, next) => {
        console.error('Vercel Error:', err);
        if (!res.headersSent) {
            res.json({ 
                success: false,
                error: 'Une erreur interne est survenue',
                message: process.env.NODE_ENV === 'development' ? err.message : undefined,
                stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
            });
        }
    });
}

// For local development, start the server
if (!process.env.VERCEL && require.main === module) {
    initDatabase().then(() => {
        console.log('✅ Database initialized');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📡 Ollama API: ${process.env.OLLAMA_API_URL || 'http://localhost:11434'}`);
        });
    }).catch(err => {
        console.error('❌ Database initialization failed:', err);
        process.exit(1);
    });
}

module.exports = app;