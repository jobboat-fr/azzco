const fs = require('fs');
const path = require('path');
const personaDetector = require('./personaDetector');

/**
 * Manages prompt selection and generation based on context
 */
class PromptManager {
    constructor() {
        this.basePrompts = {};
        this.loadPrompts();
    }

    /**
     * Load all prompt files
     */
    loadPrompts() {
        try {
            const promptsDir = path.join(__dirname, '../prompts');
            
            // Check if directory exists
            if (!fs.existsSync(promptsDir)) {
                console.error('❌ Prompts directory not found:', promptsDir);
                return;
            }
            
            const promptFiles = fs.readdirSync(promptsDir).filter(file => file.endsWith('.json'));
            
            if (promptFiles.length === 0) {
                console.warn('⚠️  No prompt files found in:', promptsDir);
                return;
            }
            
            promptFiles.forEach(file => {
                if (file !== 'persona-keywords.json' && file !== 'persona-profiles.json') {
                    try {
                        const category = file.replace('.json', '');
                        const filePath = path.join(promptsDir, file);
                        this.basePrompts[category] = require(filePath);
                        console.log(`✅ Loaded prompt: ${category}`);
                    } catch (err) {
                        console.error(`❌ Failed to load prompt ${file}:`, err.message);
                    }
                }
            });
            
            console.log(`✅ Loaded ${Object.keys(this.basePrompts).length} prompt categories`);
        } catch (error) {
            console.error('❌ Error loading prompts:', error);
        }
    }

    /**
     * Get prompt based on context and persona
     */
    getPrompt(contextKeywords, persona, userMessage) {
        // Get base system prompt
        const systemPrompt = this.getSystemPrompt(persona);
        
        // Get context-specific prompts
        const contextPrompts = this.getContextPrompts(contextKeywords);
        
        // Combine prompts
        const fullPrompt = this.combinePrompts(systemPrompt, contextPrompts, userMessage);
        
        return fullPrompt;
    }

    /**
     * Get system prompt for persona
     */
    getSystemPrompt(persona) {
        const personaProfile = personaDetector.getPersonaProfile(persona);
        return personaProfile.systemPrompt;
    }

    /**
     * Get context-specific prompts
     */
    getContextPrompts(contextKeywords) {
        const prompts = [];
        
        contextKeywords.forEach(keyword => {
            if (this.basePrompts[keyword]) {
                prompts.push(this.basePrompts[keyword]);
            }
        });

        // If no specific context, use general prompts
        if (prompts.length === 0) {
            prompts.push(this.basePrompts.general || {});
        }

        return prompts;
    }

    /**
     * Combine prompts into final prompt
     */
    combinePrompts(systemPrompt, contextPrompts, userMessage) {
        let combinedPrompt = systemPrompt + '\n\n';
        
        // Add context-specific instructions
        contextPrompts.forEach(contextPrompt => {
            if (contextPrompt.instructions) {
                combinedPrompt += 'CONTEXTE SPÉCIFIQUE:\n';
                combinedPrompt += contextPrompt.instructions + '\n\n';
            }
            
            if (contextPrompt.examples) {
                combinedPrompt += 'EXEMPLES DE RÉPONSES:\n';
                contextPrompt.examples.forEach(example => {
                    combinedPrompt += `Q: ${example.question}\n`;
                    combinedPrompt += `R: ${example.answer}\n\n`;
                });
            }
        });

        combinedPrompt += `MESSAGE UTILISATEUR: ${userMessage}\n\n`;
        combinedPrompt += 'RÉPONSE (en français, style professionnel et amical):';

        return combinedPrompt;
    }

    /**
     * Get fallback prompt
     */
    getFallbackPrompt() {
        return `Tu es un assistant professionnel et amical représentant AZZ&CO LABS, une entreprise d'innovation technologique et d'intelligence artificielle basée à Paris, France.

Ta mission est d'aider les visiteurs à comprendre notre entreprise, nos produits (JobBoat et OutWings), et notre philosophie.

Règles importantes:
- Réponds toujours en français
- Sois professionnel mais amical
- Reste concis et clair
- Si tu ne connais pas la réponse, redirige vers notre formulaire de contact
- Ne fais jamais de promesses que tu ne peux pas tenir

Réponds au message suivant de manière professionnelle et utile:`;
    }
}

module.exports = new PromptManager();