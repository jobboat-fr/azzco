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
            return res.json({ 
                response: 'Je suis désolé, votre message semble vide. Pouvez-vous réessayer ?',
                persona: 'professional',
                confidence: 0,
                contextKeywords: [],
                visitorId: visitorId || uuidv4(),
                sessionId: sessionId || uuidv4(),
                responseTime: 0,
                model: 'fallback'
            });
        }

        const startTime = Date.now();
        const finalVisitorId = visitorId || uuidv4();
        const finalSessionId = sessionId || uuidv4();

        // Get interaction history (simplified - in production, fetch from DB)
        const interactionHistory = [];

        // Generate response with error handling
        let result;
        try {
            result = await ollamaService.generateResponse(
                message,
                interactionHistory,
                finalVisitorId
            );
        } catch (ollamaError) {
            console.error('Ollama service error:', ollamaError.message);
            // Return fallback response
            result = {
                response: 'Je suis désolé, je rencontre actuellement des difficultés techniques. Pouvez-vous réessayer dans quelques instants ?',
                persona: 'professional',
                confidence: 0,
                contextKeywords: [],
                model: 'fallback'
            };
        }

        const responseTime = Date.now() - startTime;

        // Log interaction (non-blocking, fire and forget)
        logChatInteraction({
            visitorId: finalVisitorId,
            sessionId: finalSessionId,
            message: message,
            response: result.response,
            persona: result.persona,
            contextKeywords: result.contextKeywords.join(','),
            responseTime: responseTime
        }).catch(err => {
            console.warn('Chat interaction logging failed:', err.message);
        });

        // Log visitor if new (non-blocking, fire and forget)
        if (!visitorId) {
            logVisitor({
                visitorId: finalVisitorId,
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent'),
                referrer: req.get('referer')
            }).catch(err => {
                console.warn('Visitor logging failed:', err.message);
            });
        }

        // Always return valid JSON
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
        // Always return valid JSON, never 500
        res.json({ 
            response: 'Je suis désolé, une erreur est survenue. Pouvez-vous réessayer ?',
            persona: 'professional',
            confidence: 0,
            contextKeywords: [],
            visitorId: req.body.visitorId || uuidv4(),
            sessionId: req.body.sessionId || uuidv4(),
            responseTime: 0,
            model: 'fallback',
            error: 'Service temporarily unavailable'
        });
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