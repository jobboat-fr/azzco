const axios = require('axios');
const promptManager = require('./promptManager');
const personaDetector = require('./personaDetector');

// AI Provider Configuration - Support for multiple free providers
const AI_PROVIDER = process.env.AI_PROVIDER || 'groq'; // groq, openrouter, deepseek, huggingface

// Groq (Free, Fast, Recommended)
const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.OLLAMA_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';

// OpenRouter (Free tier available)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free';

// DeepSeek (Free tier available)
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

// HuggingFace (Free tier available)
const HF_API_KEY = process.env.HF_API_KEY || process.env.HUGGINGFACE_API_KEY || '';
const HF_API_URL = 'https://api-inference.huggingface.co/models';
const HF_MODEL = process.env.HF_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';

const TIMEOUT = parseInt(process.env.OLLAMA_TIMEOUT) || 30000;

/**
 * Service for interacting with Ollama API
 */
class OllamaService {
    /**
     * Get API configuration based on provider
     */
    getApiConfig() {
        switch (AI_PROVIDER.toLowerCase()) {
            case 'groq':
                if (!GROQ_API_KEY) {
                    throw new Error('GROQ_API_KEY not configured. Please set it in Vercel environment variables.');
                }
                return {
                    url: `${GROQ_API_URL}/chat/completions`,
                    model: GROQ_MODEL,
                    apiKey: GROQ_API_KEY,
                    provider: 'groq'
                };
            
            case 'openrouter':
                if (!OPENROUTER_API_KEY) {
                    throw new Error('OPENROUTER_API_KEY not configured. Please set it in Vercel environment variables.');
                }
                return {
                    url: `${OPENROUTER_API_URL}/chat/completions`,
                    model: OPENROUTER_MODEL,
                    apiKey: OPENROUTER_API_KEY,
                    provider: 'openrouter',
                    headers: {
                        'HTTP-Referer': process.env.FRONTEND_URL || 'https://azzcolabs.business',
                        'X-Title': 'AZZ&CO LABS Chatbot'
                    }
                };
            
            case 'deepseek':
                if (!DEEPSEEK_API_KEY) {
                    throw new Error('DEEPSEEK_API_KEY not configured. Please set it in Vercel environment variables.');
                }
                return {
                    url: `${DEEPSEEK_API_URL}/chat/completions`,
                    model: DEEPSEEK_MODEL,
                    apiKey: DEEPSEEK_API_KEY,
                    provider: 'deepseek'
                };
            
            case 'huggingface':
            case 'hf':
                if (!HF_API_KEY) {
                    throw new Error('HF_API_KEY or HUGGINGFACE_API_KEY not configured. Please set it in Vercel environment variables.');
                }
                return {
                    url: `${HF_API_URL}/${HF_MODEL}`,
                    model: HF_MODEL,
                    apiKey: HF_API_KEY,
                    provider: 'huggingface'
                };
            
            default:
                throw new Error(`Unknown AI provider: ${AI_PROVIDER}. Supported providers: groq, openrouter, deepseek, huggingface`);
        }
    }

    /**
     * Get headers for API requests
     */
    getHeaders(apiConfig) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiConfig.apiKey}`
        };
        
        // Add provider-specific headers
        if (apiConfig.headers) {
            Object.assign(headers, apiConfig.headers);
        }
        
        return headers;
    }

    /**
     * Check if AI provider is available
     */
    async checkHealth() {
        try {
            const apiConfig = this.getApiConfig();
            const headers = this.getHeaders(apiConfig);
            
            // Test with a simple request
            const testResponse = await axios.post(
                apiConfig.url,
                {
                    model: apiConfig.model,
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 5
                },
                {
                    headers: headers,
                    timeout: 5000
                }
            );
            
            return { 
                available: true, 
                provider: apiConfig.provider,
                model: apiConfig.model 
            };
        } catch (error) {
            return { 
                available: false, 
                provider: AI_PROVIDER,
                error: error.message 
            };
        }
    }

    /**
     * Generate response using AI provider (Groq, OpenRouter, DeepSeek, etc.)
     */
    async generateResponse(userMessage, interactionHistory = [], visitorId = null) {
        try {
            console.log('🤖 Generating response for:', userMessage.substring(0, 50));
            
            // Get API configuration
            const apiConfig = this.getApiConfig();
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
            
            // Prepare system and user messages
            const systemPrompt = prompt.split('MESSAGE UTILISATEUR:')[0] || prompt;
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ];
            
            // Add interaction history if available
            if (interactionHistory && interactionHistory.length > 0) {
                interactionHistory.slice(-5).forEach(msg => {
                    messages.push({
                        role: msg.role || 'user',
                        content: msg.content || msg.message
                    });
                });
            }
            
            // Call AI API
            const headers = this.getHeaders(apiConfig);
            let response;
            
            if (apiConfig.provider === 'huggingface') {
                // HuggingFace uses a different format
                response = await axios.post(
                    apiConfig.url,
                    {
                        inputs: userMessage,
                        parameters: {
                            max_new_tokens: 500,
                            temperature: 0.7,
                            return_full_text: false
                        }
                    },
                    {
                        headers: headers,
                        timeout: TIMEOUT
                    }
                );
                
                const generatedText = Array.isArray(response.data) 
                    ? response.data[0]?.generated_text || ''
                    : response.data.generated_text || '';
                
                console.log('✅ HuggingFace response received, length:', generatedText.length);
                const cleanedResponse = this.cleanResponse(generatedText);
                
                return {
                    response: cleanedResponse,
                    persona: persona,
                    confidence: personaDetection.confidence,
                    contextKeywords: contextKeywords,
                    model: apiConfig.model,
                    provider: apiConfig.provider
                };
            } else {
                // OpenAI-compatible format (Groq, OpenRouter, DeepSeek)
                response = await axios.post(
                    apiConfig.url,
                    {
                        model: apiConfig.model,
                        messages: messages,
                        temperature: 0.7,
                        max_tokens: 500
                    },
                    {
                        headers: headers,
                        timeout: TIMEOUT
                    }
                );
                
                const generatedText = response.data.choices?.[0]?.message?.content || '';
                console.log('✅ API response received, length:', generatedText.length);
                
                const cleanedResponse = this.cleanResponse(generatedText);
                
                return {
                    response: cleanedResponse,
                    persona: persona,
                    confidence: personaDetection.confidence,
                    contextKeywords: contextKeywords,
                    model: apiConfig.model,
                    provider: apiConfig.provider
                };
            }
        } catch (error) {
            console.error('❌ AI API Error:', error.message);
            if (error.response) {
                console.error('❌ Response status:', error.response.status);
                console.error('❌ Response data:', JSON.stringify(error.response.data).substring(0, 500));
            }
            
            // NO FALLBACK - Return error message instead
            const errorMessage = error.response?.data?.error?.message || error.message || 'Erreur inconnue';
            throw new Error(`Erreur lors de l'appel à l'API ${AI_PROVIDER}: ${errorMessage}. Veuillez vérifier votre configuration API dans Vercel.`);
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