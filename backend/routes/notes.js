const express = require('express');
const router = express.Router();
const notesService = require('../services/notesService');
const { v4: uuidv4 } = require('uuid');

/**
 * GET /api/notes
 * Get all notes (optionally filtered by visitor ID)
 */
router.get('/', async (req, res) => {
    try {
        const visitorId = req.query.visitorId || null;
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

        const note = await notesService.getNoteById(id);
        if (!note) {
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
router.post('/', async (req, res) => {
    try {
        const { title, content, visitorId } = req.body;

        if (!title || title.trim() === '') {
            return res.json({ success: false, error: 'Le titre est requis' });
        }

        const note = await notesService.createNote({
            title: title.trim(),
            content: content ? content.trim() : null,
            visitorId: visitorId || null
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
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.json({ success: false, error: 'ID invalide' });
        }

        const { title, content } = req.body;
        
        if (!title && !content) {
            return res.json({ success: false, error: 'Au moins un champ (title ou content) doit être fourni' });
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
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.json({ success: false, error: 'ID invalide' });
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
