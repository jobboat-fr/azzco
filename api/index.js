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
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
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

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Une erreur interne est survenue',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
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
            console.log(`📡 Ollama API: ${process.env.OLLAMA_API_URL || 'http://localhost:11434'}`);
        });
    }).catch(err => {
        console.error('❌ Database initialization failed:', err);
        process.exit(1);
    });
}

module.exports = app;