const axios = require('axios');
const promptManager = require('./promptManager');
const personaDetector = require('./personaDetector');

// AI Provider Configuration - ONLY Ollama with Qwen 2
const AI_PROVIDER = 'ollama'; // Fixed to Ollama only

// AI Configuration - OpenRouter and Ollama ONLY
// Production: OpenRouter (Qwen 2)
// Local: Ollama (Qwen 2)

const IS_VERCEL = !!process.env.VERCEL;
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || IS_VERCEL;

// OpenRouter (Production)
const OPENROUTER_URL = process.env.OLLAMA_API_URL || process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = process.env.OLLAMA_MODEL || process.env.OPENROUTER_MODEL || 'qwen/qwen-2.5-7b-instruct:free';
const OPENROUTER_API_KEY = process.env.OLLAMA_API_KEY || process.env.OPENROUTER_API_KEY || '7fa94d77037849b4a64baaa436a3c25c.Wu_-AuooKGwm-xlKD1VJMzE8';

// Local Ollama (Development)
const LOCAL_OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const LOCAL_OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2:latest';

const TIMEOUT = parseInt(process.env.OLLAMA_TIMEOUT) || 30000;

/**
 * Service for interacting with Ollama API (Qwen 2)
 */
class OllamaService {
    /**
     * Get API configuration - OpenRouter for production, Ollama for local
     */
    getApiConfig() {
        if (IS_PRODUCTION) {
            // Production: OpenRouter
            console.log(`🔑 Using OpenRouter: ${OPENROUTER_URL}`);
            console.log(`🤖 Model: ${OPENROUTER_MODEL}`);
            return {
                url: `${OPENROUTER_URL}/chat/completions`,
                model: OPENROUTER_MODEL,
                apiKey: OPENROUTER_API_KEY,
                provider: 'openrouter',
                format: 'openai'
            };
        } else {
            // Local development: Ollama
            console.log(`🔑 Using Local Ollama: ${LOCAL_OLLAMA_URL}`);
            console.log(`🤖 Model: ${LOCAL_OLLAMA_MODEL}`);
            return {
                url: `${LOCAL_OLLAMA_URL}/api/generate`,
                model: LOCAL_OLLAMA_MODEL,
                apiKey: '',
                provider: 'ollama',
                format: 'ollama'
            };
        }
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
        
        // OpenRouter requires additional headers
        if (apiConfig.provider === 'openrouter' || apiConfig.url.includes('openrouter.ai')) {
            headers['HTTP-Referer'] = process.env.OPENROUTER_REFERER || 'https://azzcolabs.business';
            headers['X-Title'] = process.env.OPENROUTER_TITLE || 'AZZ&CO LABS';
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
            
            // Get API configuration FIRST
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
            
            // Get headers (apiConfig already set above)
            const headers = this.getHeaders(apiConfig);
            
            let response = null;
            let generatedText = '';
            
            if (apiConfig.format === 'openai') {
                // OpenRouter format (OpenAI-compatible)
                const messages = [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ];
                
                console.log('📡 Calling OpenRouter...');
                console.log('📡 URL:', apiConfig.url);
                console.log('📡 Model:', apiConfig.model);
                console.log('📡 Headers:', JSON.stringify(headers).replace(/Bearer [^\"]+/, 'Bearer ***'));
                
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
                
                console.log('📡 OpenRouter response status:', response.status);
                console.log('📡 OpenRouter response data keys:', Object.keys(response.data || {}));
                
                generatedText = response.data.choices?.[0]?.message?.content || '';
                
                if (!generatedText && response.data) {
                    console.error('❌ No generated text. Full response:', JSON.stringify(response.data).substring(0, 500));
                }
            } else {
                // Native Ollama format (local)
                const fullPrompt = `${systemPrompt}\n\nMESSAGE UTILISATEUR: ${userMessage}`;
                
                console.log('📡 Calling Ollama...');
                response = await axios.post(
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
                
                generatedText = response.data.response || '';
            }
            
            if (!generatedText) {
                throw new Error('Empty response from API');
            }
            
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
            console.error('❌ API Error:', error.message);
            console.error('❌ Error code:', error.code);
            console.error('❌ Error stack:', error.stack?.substring(0, 300));
            
            if (error.response) {
                console.error('❌ Response status:', error.response.status);
                console.error('❌ Response headers:', JSON.stringify(error.response.headers));
                console.error('❌ Response data:', JSON.stringify(error.response.data));
            } else if (error.request) {
                console.error('❌ No response received. Request config:', JSON.stringify({
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: error.config?.headers ? Object.keys(error.config.headers) : 'none'
                }));
            }
            
            let errorMessage = 'Erreur inconnue';
            
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error.message || JSON.stringify(error.response.data.error);
            } else if (error.response?.data) {
                errorMessage = JSON.stringify(error.response.data).substring(0, 200);
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            const provider = apiConfig?.provider || (IS_PRODUCTION ? 'openrouter' : 'ollama');
            throw new Error(`Erreur ${provider}: ${errorMessage}`);
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