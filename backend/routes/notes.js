const express = require('express');
const router = express.Router();
const notesService = require('../services/notesService');

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
const notesApiEnabled = process.env.NOTES_API_ENABLED === 'true' || !isProduction;

function getVisitorId(req) {
    return String(req.query.visitorId || req.body?.visitorId || '').trim();
}

function isValidVisitorId(visitorId) {
    // UUID v4 or prefixed local visitor id pattern used by frontend
    return /^[a-f0-9-]{8,}$/i.test(visitorId) || /^visitor_[a-z0-9_]+$/i.test(visitorId);
}

function requireNotesApiEnabled(req, res, next) {
    if (!notesApiEnabled) {
        return res.status(403).json({
            success: false,
            error: 'Notes API désactivée en production'
        });
    }
    return next();
}

function requireNotesWriteToken(req, res, next) {
    const notesToken = process.env.NOTES_API_TOKEN;
    if (!isProduction) return next();
    if (!notesToken) {
        return res.status(503).json({
            success: false,
            error: 'Notes API indisponible: token non configuré'
        });
    }

    const providedToken = req.get('x-notes-token') || '';
    if (providedToken !== notesToken) {
        return res.status(401).json({
            success: false,
            error: 'Non autorisé'
        });
    }

    return next();
}

router.use(requireNotesApiEnabled);

/**
 * GET /api/notes
 * Get all notes (optionally filtered by visitor ID)
 */
router.get('/', async (req, res) => {
    try {
        const visitorId = getVisitorId(req);
        if (!visitorId || !isValidVisitorId(visitorId)) {
            return res.status(400).json({
                success: false,
                notes: [],
                error: 'visitorId valide requis'
            });
        }
        const notes = await notesService.getAllNotes(visitorId);
        res.json({ success: true, notes: notes || [] });
    } catch (error) {
        console.error('Get notes error:', error);
        // Always return valid JSON
        res.json({ success: false, notes: [], error: 'Erreur lors de la récupération des notes' });
    }
});

/**
 * GET /api/notes/:id
 * Get a specific note by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID invalide' });
        }

        const visitorId = getVisitorId(req);
        if (!visitorId || !isValidVisitorId(visitorId)) {
            return res.status(400).json({ error: 'visitorId valide requis' });
        }

        const note = await notesService.getNoteById(id);
        if (!note) {
            return res.status(404).json({ error: 'Note non trouvée' });
        }
        if (!note.visitor_id || note.visitor_id !== visitorId) {
            return res.status(404).json({ error: 'Note non trouvée' });
        }

        res.json({ success: true, note });
    } catch (error) {
        console.error('Get note error:', error);
        // Always return valid JSON
        res.json({ success: false, note: null, error: 'Erreur lors de la récupération de la note' });
    }
});

/**
 * POST /api/notes
 * Create a new note
 */
router.post('/', requireNotesWriteToken, async (req, res) => {
    try {
        const { title, content, visitorId } = req.body;

        if (!title || title.trim() === '') {
            return res.json({ success: false, error: 'Le titre est requis' });
        }
        if (!visitorId || !isValidVisitorId(String(visitorId).trim())) {
            return res.status(400).json({ success: false, error: 'visitorId valide requis' });
        }

        const note = await notesService.createNote({
            title: title.trim(),
            content: content ? content.trim() : null,
            visitorId: String(visitorId).trim()
        });

        res.json({ success: true, note });
    } catch (error) {
        console.error('Create note error:', error);
        // Always return valid JSON
        res.json({ success: false, note: null, error: 'Erreur lors de la création de la note' });
    }
});

/**
 * PUT /api/notes/:id
 * Update a note
 */
router.put('/:id', requireNotesWriteToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.json({ success: false, error: 'ID invalide' });
        }

        const { title, content, visitorId } = req.body;
        if (!visitorId || !isValidVisitorId(String(visitorId).trim())) {
            return res.status(400).json({ success: false, error: 'visitorId valide requis' });
        }
        
        if (!title && !content) {
            return res.json({ success: false, error: 'Au moins un champ (title ou content) doit être fourni' });
        }

        const existing = await notesService.getNoteById(id);
        if (!existing || existing.visitor_id !== String(visitorId).trim()) {
            return res.status(404).json({ success: false, note: null, error: 'Note non trouvée' });
        }

        const note = await notesService.updateNote(id, {
            title: title ? title.trim() : undefined,
            content: content !== undefined ? content.trim() : undefined
        });

        if (!note) {
            return res.json({ success: false, note: null, error: 'Note non trouvée' });
        }

        res.json({ success: true, note });
    } catch (error) {
        console.error('Update note error:', error);
        // Always return valid JSON
        res.json({ success: false, note: null, error: 'Erreur lors de la mise à jour de la note' });
    }
});

/**
 * DELETE /api/notes/:id
 * Delete a note
 */
router.delete('/:id', requireNotesWriteToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.json({ success: false, error: 'ID invalide' });
        }

        const visitorId = getVisitorId(req);
        if (!visitorId || !isValidVisitorId(visitorId)) {
            return res.status(400).json({ success: false, error: 'visitorId valide requis' });
        }

        const existing = await notesService.getNoteById(id);
        if (!existing || existing.visitor_id !== visitorId) {
            return res.status(404).json({ success: false, error: 'Note non trouvée' });
        }

        const deleted = await notesService.deleteNote(id);
        if (!deleted) {
            return res.json({ success: false, error: 'Note non trouvée' });
        }

        res.json({ success: true, message: 'Note supprimée avec succès' });
    } catch (error) {
        console.error('Delete note error:', error);
        // Always return valid JSON
        res.json({ success: false, error: 'Erreur lors de la suppression de la note' });
    }
});

module.exports = router;
