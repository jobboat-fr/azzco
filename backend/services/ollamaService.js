const axios = require('axios');
const promptManager = require('./promptManager');
const personaDetector = require('./personaDetector');

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || '';
const TIMEOUT = parseInt(process.env.OLLAMA_TIMEOUT) || 30000;

/**
 * Service for interacting with Ollama API
 */
class OllamaService {
    /**
     * Get headers for Ollama API requests
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (OLLAMA_API_KEY) {
            headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`;
            headers['X-API-Key'] = OLLAMA_API_KEY;
        }
        
        return headers;
    }

    /**
     * Check if Ollama is available
     */
    async checkHealth() {
        try {
            const response = await axios.get(`${OLLAMA_API_URL}/api/tags`, {
                headers: this.getHeaders(),
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
            console.log('🤖 Generating response for:', userMessage.substring(0, 50));
            
            // Detect persona
            const personaDetection = personaDetector.detectPersona(userMessage, interactionHistory);
            const persona = personaDetection.persona;
            console.log('👤 Detected persona:', persona);
            
            // Extract context keywords
            const contextKeywords = personaDetector.extractContextKeywords(userMessage);
            console.log('🔑 Context keywords:', contextKeywords);
            
            // Get prompt
            const prompt = promptManager.getPrompt(contextKeywords, persona, userMessage);
            console.log('📝 Prompt length:', prompt.length);
            
            // Check if Ollama is configured
            if (!OLLAMA_API_URL || OLLAMA_API_URL === 'http://localhost:11434') {
                console.warn('⚠️  Ollama not configured, using fallback');
                return {
                    response: this.getFallbackResponse(userMessage),
                    persona: persona,
                    confidence: personaDetection.confidence,
                    contextKeywords: contextKeywords,
                    model: 'fallback',
                    error: 'Ollama not configured'
                };
            }
            
            // Call Ollama API
            console.log('📡 Calling Ollama API:', OLLAMA_API_URL);
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
                    headers: this.getHeaders(),
                    timeout: TIMEOUT
                }
            );

            const generatedText = response.data.response || '';
            console.log('✅ Ollama response received, length:', generatedText.length);
            
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
            console.error('❌ Ollama API Error:', error.message);
            if (error.response) {
                console.error('❌ Response status:', error.response.status);
                console.error('❌ Response data:', JSON.stringify(error.response.data).substring(0, 200));
            }
            
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
            return "JobBoat est une plateforme que nous construisons spécialement pour vous. Elle réunit le meilleur des expériences que vous connaissez pour créer quelque chose d'unique qui s'adapte à vos besoins. Nous préparons tout avec soin pour vous offrir la meilleure expérience possible. Seriez-vous intéressé d'en savoir plus ?";
        }
        
        if (messageLower.includes('outwings')) {
            return "OutWings est un projet que nous préparons avec attention pour vous. Nous travaillons à créer quelque chose de spécial pour transformer vos sorties de groupes. Nous vous tiendrons informé dès que ce sera prêt. Souhaitez-vous être tenu au courant ?";
        }
        
        if (messageLower.includes('contact') || messageLower.includes('email') || messageLower.includes('téléphone')) {
            return "Nous serions ravis d'échanger avec vous. Vous pouvez nous contacter par email à azerrached3@gmail.com, par téléphone au +33 6 02 56 02 29, ou via LinkedIn. Notre formulaire de contact est également à votre disposition sur cette page.";
        }
        
        if (messageLower.includes('mission') || messageLower.includes('philosophie')) {
            return "Notre mission est simple : vous servir. Nous mettons toute notre expertise à votre disposition pour vous aider à réussir. Votre succès est notre priorité, et nous travaillons chaque jour pour vous offrir les meilleurs outils et accompagnement possibles.";
        }
        
        return "Merci de m'avoir contacté ! Je suis là pour vous servir et répondre à toutes vos questions. Comment puis-je vous aider aujourd'hui ? N'hésitez pas à me poser vos questions ou à utiliser notre formulaire de contact si vous souhaitez échanger directement avec notre équipe.";
    }
}

module.exports = new OllamaService();