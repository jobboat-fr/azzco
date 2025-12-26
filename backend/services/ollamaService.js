const axios = require('axios');
const promptManager = require('./promptManager');
const personaDetector = require('./personaDetector');

// AI Provider Configuration - ONLY Ollama with Qwen 2
const AI_PROVIDER = 'ollama'; // Fixed to Ollama only

// Ollama Configuration - Qwen 2
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || process.env.OLLAMA_BASE_URL || 'https://api.ollama.com';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2:latest'; // Qwen 2 model
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || '5814484fb98c4ed0ac478de9935428fc.2ehRIt8p5BDvJjdzgzUrNc4_';

const TIMEOUT = parseInt(process.env.OLLAMA_TIMEOUT) || 30000;

/**
 * Service for interacting with Ollama API (Qwen 2)
 */
class OllamaService {
    /**
     * Get API configuration for Ollama with Qwen 2
     */
    getApiConfig() {
        if (!OLLAMA_API_URL) {
            throw new Error('OLLAMA_API_URL not configured. Please set it in Vercel environment variables.');
        }
        
        if (!OLLAMA_MODEL) {
            throw new Error('OLLAMA_MODEL not configured. Please set it in Vercel environment variables.');
        }
        
        console.log(`🔑 Using Ollama API: ${OLLAMA_API_URL}`);
        console.log(`🤖 Using model: ${OLLAMA_MODEL}`);
        
        return {
            url: `${OLLAMA_API_URL}/api/generate`,
            model: OLLAMA_MODEL,
            apiKey: OLLAMA_API_KEY || '',
            provider: 'ollama',
            format: 'ollama'
        };
    }

    /**
     * Get headers for API requests
     */
    getHeaders(apiConfig) {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Add API key if provided (for cloud Ollama services)
        if (apiConfig.apiKey && apiConfig.apiKey.trim() !== '') {
            headers['Authorization'] = `Bearer ${apiConfig.apiKey}`;
        }
        
        return headers;
    }

    /**
     * Check if Ollama with Qwen 2 is available
     */
    async checkHealth() {
        try {
            const apiConfig = this.getApiConfig();
            const headers = this.getHeaders(apiConfig);
            
            // Test with a simple Ollama request
            const testResponse = await axios.post(
                apiConfig.url,
                {
                    model: apiConfig.model,
                    prompt: 'test',
                    stream: false
                },
                {
                    headers: headers,
                    timeout: 5000
                }
            );
            
            return { 
                available: true, 
                provider: 'ollama',
                model: apiConfig.model,
                url: OLLAMA_API_URL
            };
        } catch (error) {
            return { 
                available: false, 
                provider: 'ollama',
                model: OLLAMA_MODEL,
                error: error.message 
            };
        }
    }

    /**
     * Generate response using Ollama with Qwen 2
     */
    async generateResponse(userMessage, interactionHistory = [], visitorId = null) {
        let apiConfig = null;
        try {
            console.log('🤖 Generating response for:', userMessage.substring(0, 50));
            
            // Get API configuration
            apiConfig = this.getApiConfig();
            console.log('📡 Using provider:', apiConfig.provider);
            console.log('📡 Using model:', apiConfig.model);
            
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
            
            // Build full prompt for Ollama (system + user message)
            const systemPrompt = prompt.split('MESSAGE UTILISATEUR:')[0] || prompt;
            let fullPrompt = `${systemPrompt}\n\nMESSAGE UTILISATEUR: ${userMessage}`;
            
            // Add interaction history if available
            if (interactionHistory && interactionHistory.length > 0) {
                const historyText = interactionHistory.slice(-5).map(msg => {
                    const role = msg.role || 'user';
                    const content = msg.content || msg.message || '';
                    return `${role === 'assistant' ? 'ASSISTANT' : 'UTILISATEUR'}: ${content}`;
                }).join('\n');
                fullPrompt = `${fullPrompt}\n\nHISTORIQUE:\n${historyText}`;
            }
            
            // Call Ollama API
            if (!apiConfig) {
                throw new Error('Configuration API non disponible. Veuillez vérifier OLLAMA_API_URL dans Vercel.');
            }
            
            const headers = this.getHeaders(apiConfig);
            console.log('📡 Calling Ollama API with Qwen 2...');
            
            const response = await axios.post(
                apiConfig.url,
                {
                    model: apiConfig.model,
                    prompt: fullPrompt,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        top_p: 0.9,
                        top_k: 40
                    }
                },
                {
                    headers: headers,
                    timeout: TIMEOUT
                }
            );
            
            const generatedText = response.data.response || '';
            console.log('✅ Ollama (Qwen 2) response received, length:', generatedText.length);
            
            const cleanedResponse = this.cleanResponse(generatedText);
            
            return {
                response: cleanedResponse,
                persona: persona,
                confidence: personaDetection.confidence,
                contextKeywords: contextKeywords,
                model: apiConfig.model,
                provider: apiConfig.provider
            };
        } catch (error) {
            console.error('❌ Ollama API Error:', error.message);
            if (error.response) {
                console.error('❌ Response status:', error.response.status);
                console.error('❌ Response data:', JSON.stringify(error.response.data).substring(0, 500));
            }
            
            // NO FALLBACK - Return error message instead
            const errorMessage = error.response?.data?.error?.message || error.message || 'Erreur inconnue';
            const actualProvider = apiConfig?.provider || 'ollama';
            const actualModel = apiConfig?.model || OLLAMA_MODEL;
            
            throw new Error(`Erreur lors de l'appel à Ollama (${actualModel}): ${errorMessage}. Veuillez vérifier OLLAMA_API_URL et OLLAMA_API_KEY dans Vercel.`);
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

}

module.exports = new OllamaService();