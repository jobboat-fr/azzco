const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { logVisitor, logPageView, logEvent } = require('../services/analyticsService');
const { getDatabase } = require('../models/database');
const geolocationService = require('../services/geolocationService');

/**
 * POST /api/analytics/visitor
 * Log a new visitor with geolocation
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

        // Enrich with geolocation data (non-blocking)
        let enrichedData = visitorData;
        try {
            enrichedData = await geolocationService.enrichVisitorData(visitorData, req);
        } catch (geoError) {
            console.warn('Geolocation enrichment failed:', geoError.message);
            // Continue with basic visitor data
        }

        // Log visitor (non-blocking)
        try {
            await logVisitor(enrichedData);
        } catch (logError) {
            console.warn('Visitor logging failed:', logError.message);
            // Continue anyway
        }

        res.json({ 
            success: true, 
            visitorId: enrichedData.visitorId,
            location: enrichedData.city && enrichedData.country ? 
                `${enrichedData.city}, ${enrichedData.country}` : null
        });
    } catch (error) {
        console.error('Analytics visitor error:', error);
        // Always return success to avoid breaking frontend
        res.json({ 
            success: true, 
            visitorId: req.body.visitorId || uuidv4(),
            warning: 'Some analytics features may be unavailable'
        });
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
            return res.json({ success: true, warning: 'Missing required fields' });
        }

        // Non-blocking logging
        logPageView({
            visitorId,
            pagePath,
            pageTitle,
            timeSpent: timeSpent || 0,
            scrollDepth: scrollDepth || 0
        }).catch(err => {
            console.warn('Page view logging failed:', err.message);
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Analytics pageview error:', error);
        // Always return valid JSON
        res.json({ success: true, warning: 'Logging failed but request processed' });
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
            return res.json({ success: true, warning: 'Missing required fields' });
        }

        // Non-blocking logging
        logEvent({
            visitorId,
            eventType,
            eventData: typeof eventData === 'object' ? JSON.stringify(eventData) : eventData
        }).catch(err => {
            console.warn('Event logging failed:', err.message);
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Analytics event error:', error);
        // Always return valid JSON
        res.json({ success: true, warning: 'Logging failed but request processed' });
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