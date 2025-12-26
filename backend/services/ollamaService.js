const axios = require('axios');
const promptManager = require('./promptManager');
const personaDetector = require('./personaDetector');

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2';
const TIMEOUT = parseInt(process.env.OLLAMA_TIMEOUT) || 30000;

/**
 * Service for interacting with Ollama API
 */
class OllamaService {
    /**
     * Check if Ollama is available
     */
    async checkHealth() {
        try {
            const response = await axios.get(`${OLLAMA_API_URL}/api/tags`, {
                timeout: 5000
            });
            return { available: true, models: response.data.models || [] };
        } catch (error) {
            return { available: false, error: error.message };
        }
    }

    /**
     * Generate response using Ollama
     */
    async generateResponse(userMessage, interactionHistory = [], visitorId = null) {
        try {
            // Detect persona
            const personaDetection = personaDetector.detectPersona(userMessage, interactionHistory);
            const persona = personaDetection.persona;
            
            // Extract context keywords
            const contextKeywords = personaDetector.extractContextKeywords(userMessage);
            
            // Get prompt
            const prompt = promptManager.getPrompt(contextKeywords, persona, userMessage);
            
            // Call Ollama API
            const response = await axios.post(
                `${OLLAMA_API_URL}/api/generate`,
                {
                    model: OLLAMA_MODEL,
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        top_p: 0.9,
                        top_k: 40
                    }
                },
                {
                    timeout: TIMEOUT
                }
            );

            const generatedText = response.data.response || '';
            
            // Clean and format response
            const cleanedResponse = this.cleanResponse(generatedText);

            return {
                response: cleanedResponse,
                persona: persona,
                confidence: personaDetection.confidence,
                contextKeywords: contextKeywords,
                model: OLLAMA_MODEL
            };
        } catch (error) {
            console.error('Ollama API Error:', error.message);
            
            // Fallback response
            return {
                response: this.getFallbackResponse(userMessage),
                persona: 'professional',
                confidence: 0,
                contextKeywords: [],
                model: 'fallback',
                error: error.message
            };
        }
    }

    /**
     * Clean and format response
     */
    cleanResponse(text) {
        // Remove any prompt artifacts
        let cleaned = text
            .replace(/RÉPONSE.*?:/gi, '')
            .replace(/MESSAGE UTILISATEUR.*?:/gi, '')
            .replace(/CONTEXTE.*?:/gi, '')
            .trim();

        // Remove excessive newlines
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

        // Ensure proper sentence endings
        if (!cleaned.match(/[.!?]$/)) {
            cleaned += '.';
        }

        return cleaned;
    }

    /**
     * Get fallback response when Ollama is unavailable
     */
    getFallbackResponse(userMessage) {
        const messageLower = userMessage.toLowerCase();
        
        // Simple keyword-based responses
        if (messageLower.includes('jobboat')) {
            return "JobBoat est notre plateforme révolutionnaire qui combine l'algorithme de TikTok, le réseautage de LinkedIn, et le swipe de Tinder pour transformer la recherche d'emploi. L'application est actuellement en phase de préparation légale. Pour plus d'informations, n'hésitez pas à nous contacter via notre formulaire de contact.";
        }
        
        if (messageLower.includes('outwings')) {
            return "OutWings est notre prochain projet confidentiel - une application de nouvelle génération pour les sorties de groupes. Le projet est encore en développement et n'est pas encore accessible au public. Restez connectés pour les mises à jour !";
        }
        
        if (messageLower.includes('contact') || messageLower.includes('email') || messageLower.includes('téléphone')) {
            return "Vous pouvez nous contacter via email à azerrached3@gmail.com, par téléphone au +33 6 02 56 02 29, ou via LinkedIn. Vous pouvez également utiliser le formulaire de contact sur notre site web.";
        }
        
        if (messageLower.includes('mission') || messageLower.includes('philosophie')) {
            return "Notre mission est d'utiliser l'intelligence artificielle pour aider les gens à travailler et gagner leur vie, pas pour les remplacer. Nous croyons en une approche centrée sur l'humain où la technologie amplifie les capacités plutôt que de les remplacer.";
        }
        
        return "Merci pour votre message ! Je suis là pour vous aider à en savoir plus sur AZZ&CO LABS, nos produits JobBoat et OutWings, ou répondre à toute autre question. N'hésitez pas à me poser vos questions ou utilisez notre formulaire de contact pour une assistance plus détaillée.";
    }
}

module.exports = new OllamaService();