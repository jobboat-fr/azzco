const { getDatabase } = require('../models/database');

/**
 * Log a new visitor or update existing visitor
 */
async function logVisitor(visitorData) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
        // Check if visitor exists
        db.get(
            `SELECT * FROM visitors WHERE visitor_id = ?`,
            [visitorData.visitorId],
            (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (row) {
                    // Update existing visitor
                    db.run(
                        `UPDATE visitors 
                         SET last_visit = CURRENT_TIMESTAMP,
                             visit_count = visit_count + 1,
                             ip_address = ?,
                             user_agent = ?,
                             referrer = ?
                         WHERE visitor_id = ?`,
                        [
                            visitorData.ipAddress,
                            visitorData.userAgent,
                            visitorData.referrer,
                            visitorData.visitorId
                        ],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                } else {
                    // Insert new visitor
                    db.run(
                        `INSERT INTO visitors (
                            visitor_id, ip_address, user_agent, referrer,
                            country, city, device_type, browser, os, language
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            visitorData.visitorId,
                            visitorData.ipAddress,
                            visitorData.userAgent,
                            visitorData.referrer,
                            visitorData.country || null,
                            visitorData.city || null,
                            visitorData.deviceType || null,
                            visitorData.browser || null,
                            visitorData.os || null,
                            visitorData.language || null
                        ],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                }
            }
        );
    });
}

/**
 * Log a page view
 */
async function logPageView(pageViewData) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO page_views (visitor_id, page_path, page_title, time_spent, scroll_depth)
             VALUES (?, ?, ?, ?, ?)`,
            [
                pageViewData.visitorId,
                pageViewData.pagePath,
                pageViewData.pageTitle || null,
                pageViewData.timeSpent || 0,
                pageViewData.scrollDepth || 0
            ],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

/**
 * Log a chat interaction
 */
async function logChatInteraction(chatData) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO chat_logs (
                visitor_id, session_id, message, response, 
                persona_detected, context_keywords, response_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                chatData.visitorId,
                chatData.sessionId,
                chatData.message,
                chatData.response,
                chatData.persona || null,
                chatData.contextKeywords || null,
                chatData.responseTime || 0
            ],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

/**
 * Log a custom event
 */
async function logEvent(eventData) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO events (visitor_id, event_type, event_data)
             VALUES (?, ?, ?)`,
            [
                eventData.visitorId,
                eventData.eventType,
                eventData.eventData || null
            ],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

module.exports = {
    logVisitor,
    logPageView,
    logChatInteraction,
    logEvent
};