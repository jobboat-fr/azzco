/**
 * Example: How to fetch notes from the API
 * This is for a static HTML site (not Next.js)
 */

// Example 1: Get all notes
async function getAllNotes() {
    try {
        const response = await fetch('/api/notes');
        const data = await response.json();
        
        if (data.success) {
            console.log('Notes:', data.notes);
            return data.notes;
        } else {
            console.error('Error:', data.error);
            return [];
        }
    } catch (error) {
        console.error('Failed to fetch notes:', error);
        return [];
    }
}

// Example 2: Get notes for a specific visitor
async function getNotesForVisitor(visitorId) {
    try {
        const response = await fetch(`/api/notes?visitorId=${visitorId}`);
        const data = await response.json();
        
        if (data.success) {
            return data.notes;
        }
        return [];
    } catch (error) {
        console.error('Failed to fetch notes:', error);
        return [];
    }
}

// Example 3: Get a specific note by ID
async function getNoteById(id) {
    try {
        const response = await fetch(`/api/notes/${id}`);
        const data = await response.json();
        
        if (data.success) {
            return data.note;
        }
        return null;
    } catch (error) {
        console.error('Failed to fetch note:', error);
        return null;
    }
}

// Example 4: Create a new note
async function createNote(title, content = null, visitorId = null) {
    try {
        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                content: content,
                visitorId: visitorId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('Note created:', data.note);
            return data.note;
        } else {
            console.error('Error:', data.error);
            return null;
        }
    } catch (error) {
        console.error('Failed to create note:', error);
        return null;
    }
}

// Example 5: Update a note
async function updateNote(id, title = null, content = null) {
    try {
        const body = {};
        if (title) body.title = title;
        if (content !== null) body.content = content;
        
        const response = await fetch(`/api/notes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (data.success) {
            return data.note;
        }
        return null;
    } catch (error) {
        console.error('Failed to update note:', error);
        return null;
    }
}

// Example 6: Delete a note
async function deleteNote(id) {
    try {
        const response = await fetch(`/api/notes/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Failed to delete note:', error);
        return false;
    }
}

// Example 7: Display notes in HTML
async function displayNotes() {
    const notes = await getAllNotes();
    const container = document.getElementById('notes-container');
    
    if (!container) return;
    
    if (notes.length === 0) {
        container.innerHTML = '<p>Aucune note trouvée.</p>';
        return;
    }
    
    container.innerHTML = notes.map(note => `
        <div class="note-card">
            <h3>${escapeHtml(note.title)}</h3>
            ${note.content ? `<p>${escapeHtml(note.content)}</p>` : ''}
            <small>Créé le: ${new Date(note.created_at).toLocaleDateString('fr-FR')}</small>
            <button onclick="deleteNote(${note.id})">Supprimer</button>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getAllNotes,
        getNotesForVisitor,
        getNoteById,
        createNote,
        updateNote,
        deleteNote,
        displayNotes
    };
}
