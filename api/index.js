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
// CRITICAL: This middleware MUST catch ALL errors
app.use((err, req, res, next) => {
    console.error('Error middleware caught:', err?.message || 'Unknown error');
    console.error('Error stack:', err?.stack);
    
    // If headers already sent, we can't send a response
    if (res.headersSent) {
        return next(err);
    }
    
    // Always return valid JSON
    try {
        res.json({ 
            success: false,
            error: 'Une erreur interne est survenue',
            message: process.env.NODE_ENV === 'development' ? err?.message : undefined
        });
    } catch (jsonError) {
        // If even JSON response fails, try to send plain text
        try {
            res.status(200).send(JSON.stringify({ 
                success: false,
                error: 'Une erreur interne est survenue'
            }));
        } catch (finalError) {
            // Last resort - do nothing, connection might be closed
            console.error('CRITICAL: Could not send error response:', finalError);
        }
    }
});

// For Vercel serverless functions, export the app directly
// Vercel automatically detects module.exports and uses it as the handler
// Initialize database lazily on first request (for Vercel)
if (process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL) {
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
                    console.error('❌ Database initialization failed:', err.message);
                    // Continue anyway - database operations will fail gracefully
                    dbInitialized = true; // Mark as initialized to prevent retry loops
                })
                .finally(() => {
                    dbInitInProgress = false;
                });
        }
        // Always continue to next middleware, don't wait for DB
        next();
    });
    
    // Better error handling for Vercel - Always return valid JSON
    // CRITICAL: This MUST catch all errors on Vercel
    app.use((err, req, res, next) => {
        console.error('Vercel Error caught:', err?.message || 'Unknown error');
        console.error('Vercel Error stack:', err?.stack);
        
        if (res.headersSent) {
            return next(err);
        }
        
        try {
            res.json({ 
                success: false,
                error: 'Une erreur interne est survenue',
                message: process.env.NODE_ENV === 'development' ? err?.message : undefined
            });
        } catch (jsonError) {
            console.error('CRITICAL: Could not send Vercel error response:', jsonError);
            // Try one more time with plain JSON string
            try {
                res.status(200).send(JSON.stringify({ 
                    success: false,
                    error: 'Une erreur interne est survenue'
                }));
            } catch (finalError) {
                console.error('CRITICAL: Complete failure to send error response');
            }
        }
    });
    
    // Catch-all error handler for unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
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