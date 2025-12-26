const { getDatabase, isPostgres } = require('../models/database');

/**
 * Service for managing notes
 * Works with both PostgreSQL (production) and SQLite (local)
 */
class NotesService {
    /**
     * Get all notes
     * @param {string} visitorId - Optional visitor ID to filter notes
     * @returns {Promise<Array>} Array of notes
     */
    async getAllNotes(visitorId = null) {
        const db = getDatabase();
        
        if (isPostgres()) {
            // PostgreSQL query
            if (visitorId) {
                const result = await db.query(
                    'SELECT * FROM notes WHERE visitor_id = $1 ORDER BY created_at DESC',
                    [visitorId]
                );
                return result.rows;
            } else {
                const result = await db.query(
                    'SELECT * FROM notes ORDER BY created_at DESC'
                );
                return result.rows;
            }
        } else {
            // SQLite query
            return new Promise((resolve, reject) => {
                let query = 'SELECT * FROM notes';
                const params = [];
                
                if (visitorId) {
                    query += ' WHERE visitor_id = ?';
                    params.push(visitorId);
                }
                
                query += ' ORDER BY created_at DESC';
                
                db.all(query, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        }
    }

    /**
     * Get a note by ID
     * @param {number} id - Note ID
     * @returns {Promise<Object>} Note object
     */
    async getNoteById(id) {
        const db = getDatabase();
        
        if (isPostgres()) {
            const result = await db.query('SELECT * FROM notes WHERE id = $1', [id]);
            return result.rows[0] || null;
        } else {
            return new Promise((resolve, reject) => {
                db.get('SELECT * FROM notes WHERE id = ?', [id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row || null);
                });
            });
        }
    }

    /**
     * Create a new note
     * @param {Object} noteData - Note data { title, content?, visitorId? }
     * @returns {Promise<Object>} Created note
     */
    async createNote(noteData) {
        const db = getDatabase();
        const { title, content = null, visitorId = null } = noteData;
        
        if (isPostgres()) {
            const result = await db.query(
                `INSERT INTO notes (title, content, visitor_id, created_at, updated_at)
                 VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 RETURNING *`,
                [title, content, visitorId]
            );
            return result.rows[0];
        } else {
            return new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO notes (title, content, visitor_id, created_at, updated_at)
                     VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                    [title, content, visitorId],
                    function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            // Fetch the created note
                            db.get('SELECT * FROM notes WHERE id = ?', [this.lastID], (err, row) => {
                                if (err) reject(err);
                                else resolve(row);
                            });
                        }
                    }
                );
            });
        }
    }

    /**
     * Update a note
     * @param {number} id - Note ID
     * @param {Object} noteData - Updated note data { title?, content? }
     * @returns {Promise<Object>} Updated note
     */
    async updateNote(id, noteData) {
        const db = getDatabase();
        const { title, content } = noteData;
        
        if (isPostgres()) {
            const updates = [];
            const values = [];
            let paramCount = 1;
            
            if (title !== undefined) {
                updates.push(`title = $${paramCount++}`);
                values.push(title);
            }
            if (content !== undefined) {
                updates.push(`content = $${paramCount++}`);
                values.push(content);
            }
            
            if (updates.length === 0) {
                return this.getNoteById(id);
            }
            
            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(id);
            
            const result = await db.query(
                `UPDATE notes SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
                values
            );
            return result.rows[0] || null;
        } else {
            return new Promise((resolve, reject) => {
                const updates = [];
                const values = [];
                
                if (title !== undefined) {
                    updates.push('title = ?');
                    values.push(title);
                }
                if (content !== undefined) {
                    updates.push('content = ?');
                    values.push(content);
                }
                
                if (updates.length === 0) {
                    return this.getNoteById(id).then(resolve).catch(reject);
                }
                
                updates.push('updated_at = CURRENT_TIMESTAMP');
                values.push(id);
                
                db.run(
                    `UPDATE notes SET ${updates.join(', ')} WHERE id = ?`,
                    values,
                    function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            this.getNoteById(id).then(resolve).catch(reject);
                        }
                    }.bind(this)
                );
            });
        }
    }

    /**
     * Delete a note
     * @param {number} id - Note ID
     * @returns {Promise<boolean>} True if deleted
     */
    async deleteNote(id) {
        const db = getDatabase();
        
        if (isPostgres()) {
            const result = await db.query('DELETE FROM notes WHERE id = $1 RETURNING id', [id]);
            return result.rows.length > 0;
        } else {
            return new Promise((resolve, reject) => {
                db.run('DELETE FROM notes WHERE id = ?', [id], function(err) {
                    if (err) reject(err);
                    else resolve(this.changes > 0);
                });
            });
        }
    }
}

module.exports = new NotesService();
