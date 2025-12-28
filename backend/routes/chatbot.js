const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const ollamaService = require('../services/ollamaService');
const { getDatabase } = require('../models/database');
const { logVisitor, logChatInteraction } = require('../services/analyticsService');

const CHAT_HISTORY_LIMIT = parseInt(process.env.AI_CONTEXT_HISTORY_LIMIT || '6', 10);

/**
 * Fetch recent interaction history for a session
 */
async function getInteractionHistory(sessionId, limit = CHAT_HISTORY_LIMIT) {
    if (!sessionId) return [];

    try {
        const db = getDatabase();
        
        // If database is not available (e.g., on Vercel without PostgreSQL), return empty history
        if (!db) {
            console.warn('⚠️  Database not available - returning empty history');
            return [];
        }
        
        const maxLimit = Math.max(parseInt(limit, 10) || 1, 1);
        const query = `
            SELECT message, response, persona_detected, timestamp
            FROM chat_logs
            WHERE session_id = ?
            ORDER BY timestamp DESC
            LIMIT ${maxLimit}
        `;

        return await new Promise((resolve) => {
            db.all(query, [sessionId], (err, rows) => {
                if (err) {
                    console.warn('Unable to fetch chat history:', err.message);
                    resolve([]);
                    return;
                }

                if (!rows || rows.length === 0) {
                    resolve([]);
                    return;
                }

                // Reverse to chronological order and format for the AI service
                const formattedHistory = [];
                rows.slice().reverse().forEach(row => {
                    if (row.message) {
                        formattedHistory.push({
                            role: 'user',
                            content: row.message,
                            persona: row.persona_detected || 'professional'
                        });
                    }
                    if (row.response) {
                        formattedHistory.push({
                            role: 'assistant',
                            content: row.response,
                            persona: row.persona_detected || 'professional'
                        });
                    }
                });

                resolve(formattedHistory);
            });
        });
    } catch (error) {
        console.warn('Chat history unavailable:', error.message);
        return [];
    }
}

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

        // Fetch recent interaction history to maintain context
        const interactionHistory = await getInteractionHistory(finalSessionId);

               // Generate response with error handling
               let result;
               try {
                   result = await ollamaService.generateResponse(
                       message,
                       interactionHistory,
                       finalVisitorId
                   );
               } catch (ollamaError) {
                   console.error('AI service error:', ollamaError.message);
                   // Return error message - NO FALLBACK
                   return res.json({
                       response: `Je suis désolé, je rencontre actuellement des difficultés techniques avec le service d'IA. ${ollamaError.message}. Veuillez réessayer dans quelques instants ou nous contacter directement.`,
                       persona: 'professional',
                       confidence: 0,
                       contextKeywords: [],
                       model: 'error',
                       error: ollamaError.message,
                       visitorId: finalVisitorId,
                       sessionId: finalSessionId,
                       responseTime: Date.now() - startTime
                   });
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
        res.json({ 
            status: 'unavailable',
            error: 'Erreur de vérification de santé',
            ollama: { available: false },
            model: process.env.OLLAMA_MODEL || 'llama2'
        });
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
            res.json({ history: [], error: 'Erreur lors de la récupération de l\'historique' });
        });
    } catch (error) {
        console.error('History error:', error);
        res.json({ history: [], error: 'Erreur serveur' });
    }
});

module.exports = router;