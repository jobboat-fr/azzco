const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { logVisitor, logPageView, logEvent } = require('../services/analyticsService');
const { getDatabase } = require('../models/database');

/**
 * POST /api/analytics/visitor
 * Log a new visitor
 */
router.post('/visitor', async (req, res) => {
    try {
        const visitorData = {
            visitorId: req.body.visitorId || uuidv4(),
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            referrer: req.get('referer'),
            ...req.body
        };

        await logVisitor(visitorData);
        res.json({ success: true, visitorId: visitorData.visitorId });
    } catch (error) {
        console.error('Analytics visitor error:', error);
        res.status(500).json({ error: 'Erreur lors de l\'enregistrement du visiteur' });
    }
});

/**
 * POST /api/analytics/pageview
 * Log a page view
 */
router.post('/pageview', async (req, res) => {
    try {
        const { visitorId, pagePath, pageTitle, timeSpent, scrollDepth } = req.body;

        if (!visitorId || !pagePath) {
            return res.status(400).json({ error: 'visitorId et pagePath sont requis' });
        }

        await logPageView({
            visitorId,
            pagePath,
            pageTitle,
            timeSpent: timeSpent || 0,
            scrollDepth: scrollDepth || 0
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Analytics pageview error:', error);
        res.status(500).json({ error: 'Erreur lors de l\'enregistrement de la page vue' });
    }
});

/**
 * POST /api/analytics/event
 * Log a custom event
 */
router.post('/event', async (req, res) => {
    try {
        const { visitorId, eventType, eventData } = req.body;

        if (!visitorId || !eventType) {
            return res.status(400).json({ error: 'visitorId et eventType sont requis' });
        }

        await logEvent({
            visitorId,
            eventType,
            eventData: typeof eventData === 'object' ? JSON.stringify(eventData) : eventData
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Analytics event error:', error);
        res.status(500).json({ error: 'Erreur lors de l\'enregistrement de l\'événement' });
    }
});

/**
 * GET /api/analytics/stats
 * Get analytics statistics (admin only - add auth in production)
 */
router.get('/stats', async (req, res) => {
    try {
        const db = getDatabase();

        const stats = await new Promise((resolve, reject) => {
            db.get(
                `SELECT 
                    COUNT(DISTINCT visitor_id) as total_visitors,
                    COUNT(*) as total_visits,
                    COUNT(DISTINCT DATE(timestamp)) as unique_days
                 FROM visitors`,
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        const chatStats = await new Promise((resolve, reject) => {
            db.get(
                `SELECT 
                    COUNT(*) as total_messages,
                    COUNT(DISTINCT visitor_id) as unique_chat_users,
                    AVG(response_time) as avg_response_time
                 FROM chat_logs`,
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        res.json({
            visitors: stats,
            chat: chatStats
        });
    } catch (error) {
        console.error('Analytics stats error:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }
});

module.exports = router;