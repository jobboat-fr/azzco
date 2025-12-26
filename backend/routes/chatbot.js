const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const ollamaService = require('../services/ollamaService');
const { getDatabase } = require('../models/database');
const { logVisitor, logChatInteraction } = require('../services/analyticsService');

/**
 * POST /api/chatbot/message
 * Send a message to the chatbot
 */
router.post('/message', async (req, res) => {
    try {
        const { message, visitorId, sessionId } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Le message est requis' });
        }

        const startTime = Date.now();
        const finalVisitorId = visitorId || uuidv4();
        const finalSessionId = sessionId || uuidv4();

        // Get interaction history (simplified - in production, fetch from DB)
        const interactionHistory = [];

        // Generate response
        const result = await ollamaService.generateResponse(
            message,
            interactionHistory,
            finalVisitorId
        );

        const responseTime = Date.now() - startTime;

        // Log interaction
        await logChatInteraction({
            visitorId: finalVisitorId,
            sessionId: finalSessionId,
            message: message,
            response: result.response,
            persona: result.persona,
            contextKeywords: result.contextKeywords.join(','),
            responseTime: responseTime
        });

        // Log visitor if new
        if (!visitorId) {
            await logVisitor({
                visitorId: finalVisitorId,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent'),
                referrer: req.get('referer')
            });
        }

        res.json({
            response: result.response,
            persona: result.persona,
            confidence: result.confidence,
            contextKeywords: result.contextKeywords,
            visitorId: finalVisitorId,
            sessionId: finalSessionId,
            responseTime: responseTime,
            model: result.model
        });
    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ error: 'Erreur lors de la génération de la réponse' });
    }
});

/**
 * GET /api/chatbot/health
 * Check chatbot service health
 */
router.get('/health', async (req, res) => {
    try {
        const health = await ollamaService.checkHealth();
        res.json({
            status: health.available ? 'ok' : 'unavailable',
            ollama: health,
            model: process.env.OLLAMA_MODEL || 'llama2'
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur de vérification de santé' });
    }
});

/**
 * GET /api/chatbot/history/:sessionId
 * Get chat history for a session
 */
router.get('/history/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const db = getDatabase();

        return new Promise((resolve, reject) => {
            db.all(
                `SELECT message, response, persona_detected, timestamp 
                 FROM chat_logs 
                 WHERE session_id = ? 
                 ORDER BY timestamp ASC`,
                [sessionId],
                (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                }
            );
        }).then(history => {
            res.json({ history });
        }).catch(error => {
            console.error('Error fetching history:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
        });
    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;