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

// Initialize database (async, but don't block server startup)
// On Vercel, this will run when the function is invoked
initDatabase().then(() => {
    console.log('✅ Database initialized');
}).catch(err => {
    console.error('❌ Database initialization failed:', err);
    // Don't exit on Vercel - let it continue and handle errors gracefully
});

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
module.exports = app;

// For local development, start the server
if (!process.env.VERCEL && require.main === module) {
    initDatabase().then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📡 Ollama API: ${process.env.OLLAMA_API_URL || 'http://localhost:11434'}`);
        });
    }).catch(err => {
        console.error('❌ Database initialization failed:', err);
        process.exit(1);
    });
}