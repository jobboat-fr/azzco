const axios = require('axios');
const promptManager = require('./promptManager');
const personaDetector = require('./personaDetector');

// AI Provider Configuration - ONLY Ollama with Qwen 2
const AI_PROVIDER = 'ollama'; // Fixed to Ollama only

// AI Configuration - Qwen 2 with fallback
// Primary: OpenRouter (Qwen 2)
// Fallback: DeepSeek (Qwen 2)

const IS_VERCEL = !!process.env.VERCEL;
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || IS_VERCEL;

// OpenRouter (Primary)
const OPENROUTER_URL = process.env.OLLAMA_API_URL || process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = process.env.OLLAMA_MODEL || process.env.OPENROUTER_MODEL || 'qwen/qwen-2.5-7b-instruct';
const OPENROUTER_API_KEY = process.env.OLLAMA_API_KEY || process.env.OPENROUTER_API_KEY || '5814484fb98c4ed0ac478de9935428fc.2ehRIt8p5BDvJjdzgzUrNc4_';

// DeepSeek (Fallback)
const DEEPSEEK_URL = process.env.DEEPSEEK_URL || 'https://api.deepseek.com/v1';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'; // Supports Qwen-like models
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-51049ef2af114b72a98c17837c393017';

// Local Ollama (for development)
const LOCAL_OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const LOCAL_OLLAMA_MODEL = 'qwen2:latest';

const TIMEOUT = parseInt(process.env.OLLAMA_TIMEOUT) || 30000;

/**
 * Service for interacting with Ollama API (Qwen 2)
 */
class OllamaService {
    /**
     * Get API configuration - tries OpenRouter first, then DeepSeek
     */
    getApiConfig(useFallback = false) {
        if (IS_PRODUCTION) {
            if (useFallback) {
                // Fallback: DeepSeek
                console.log(`🔑 Using DeepSeek (fallback): ${DEEPSEEK_URL}`);
                console.log(`🤖 Model: ${DEEPSEEK_MODEL}`);
                return {
                    url: `${DEEPSEEK_URL}/chat/completions`,
                    model: DEEPSEEK_MODEL,
                    apiKey: DEEPSEEK_API_KEY,
                    provider: 'deepseek',
                    format: 'openai'
                };
            } else {
                // Primary: OpenRouter
                console.log(`🔑 Using OpenRouter: ${OPENROUTER_URL}`);
                console.log(`🤖 Model: ${OPENROUTER_MODEL}`);
                return {
                    url: `${OPENROUTER_URL}/chat/completions`,
                    model: OPENROUTER_MODEL,
                    apiKey: OPENROUTER_API_KEY,
                    provider: 'openrouter',
                    format: 'openai'
                };
            }
        } else {
            // Local development
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
            
            // Try OpenRouter first, then DeepSeek fallback
            let lastError = null;
            let apiConfig = null;
            let response = null;
            let generatedText = '';
            
            // Try OpenRouter (primary)
            try {
                apiConfig = this.getApiConfig(false); // OpenRouter
                const headers = this.getHeaders(apiConfig);
                
                const messages = [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ];
                
                console.log('📡 Trying OpenRouter...');
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
                
                generatedText = response.data.choices?.[0]?.message?.content || '';
                
                if (generatedText) {
                    console.log('✅ OpenRouter success');
                } else {
                    throw new Error('Empty response from OpenRouter');
                }
            } catch (openRouterError) {
                lastError = openRouterError;
                console.warn('⚠️ OpenRouter failed, trying DeepSeek fallback...');
                
                // Fallback: Try DeepSeek
                try {
                    apiConfig = this.getApiConfig(true); // DeepSeek
                    const headers = this.getHeaders(apiConfig);
                    
                    const messages = [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userMessage }
                    ];
                    
                    console.log('📡 Trying DeepSeek fallback...');
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
                    
                    generatedText = response.data.choices?.[0]?.message?.content || '';
                    
                    if (generatedText) {
                        console.log('✅ DeepSeek fallback success');
                    } else {
                        throw new Error('Empty response from DeepSeek');
                    }
                } catch (deepSeekError) {
                    // Both failed
                    console.error('❌ Both OpenRouter and DeepSeek failed');
                    throw new Error(`OpenRouter: ${openRouterError.message}. DeepSeek: ${deepSeekError.message}`);
                }
            }
            
            // If we get here but no generatedText, something is wrong
            if (!generatedText) {
                throw new Error('No response from any provider');
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
            console.error('❌ Ollama API Error:', error.message);
            if (error.response) {
                console.error('❌ Response status:', error.response.status);
                console.error('❌ Response data:', JSON.stringify(error.response.data).substring(0, 500));
            }
            
            // Both providers failed
            const errorMessage = error.message || 'Erreur inconnue';
            throw new Error(`Tous les services AI ont échoué: ${errorMessage}`);
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