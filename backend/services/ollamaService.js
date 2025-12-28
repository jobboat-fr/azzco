const axios = require('axios');
const promptManager = require('./promptManager');
const personaDetector = require('./personaDetector');

/**
 * Google Gemini AI Service
 * Uses Gemini 2.5 Flash and Flash-Lite with intelligent load balancing
 */
class OllamaService {
    constructor() {
        // Google AI Studio API Key
        this.apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
        
        // API Base URL for Google Gemini
        this.apiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta';
        
        // Models configuration
        this.models = {
            flash: {
                name: 'gemini-2.5-flash',
                rpm: 15, // Requests per minute
                rpd: 500, // Requests per day
                priority: 1 // Higher priority for complex requests
            },
            flashLite: {
                name: 'gemini-2.5-flash-lite',
                rpm: 30, // Requests per minute
                rpd: 1500, // Requests per day
                priority: 2 // Lower priority, use for most requests
            }
        };
        
        // Rate limiting tracking
        this.rateLimits = {
            flash: {
                requests: [],
                dailyCount: 0,
                lastReset: new Date().toDateString()
            },
            flashLite: {
                requests: [],
                dailyCount: 0,
                lastReset: new Date().toDateString()
            }
        };
        
        // Timeout
        this.timeout = parseInt(process.env.AI_TIMEOUT || '30000');
        
        // Reset daily counters if needed
        this.resetDailyCountersIfNeeded();
        
        console.log('🔧 Google Gemini AI Service Configuration:');
        console.log('   API Key:', this.apiKey ? '***' + this.apiKey.slice(-4) : 'NOT SET');
        console.log('   Models:', Object.keys(this.models).join(', '));
        console.log('   Flash RPM:', this.models.flash.rpm, '| RPD:', this.models.flash.rpd);
        console.log('   Flash-Lite RPM:', this.models.flashLite.rpm, '| RPD:', this.models.flashLite.rpd);
    }
    
    /**
     * Reset daily counters if it's a new day
     */
    resetDailyCountersIfNeeded() {
        const today = new Date().toDateString();
        if (this.rateLimits.flash.lastReset !== today) {
            this.rateLimits.flash.dailyCount = 0;
            this.rateLimits.flash.lastReset = today;
        }
        if (this.rateLimits.flashLite.lastReset !== today) {
            this.rateLimits.flashLite.dailyCount = 0;
            this.rateLimits.flashLite.lastReset = today;
        }
    }
    
    /**
     * Check if model is available (not rate limited)
     */
    isModelAvailable(modelKey) {
        this.resetDailyCountersIfNeeded();
        const model = this.models[modelKey];
        const limits = this.rateLimits[modelKey];
        
        if (!model || !limits) return false;
        
        // Check daily limit
        if (limits.dailyCount >= model.rpd) {
            return false;
        }
        
        // Check per-minute limit
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        limits.requests = limits.requests.filter(timestamp => timestamp > oneMinuteAgo);
        
        if (limits.requests.length >= model.rpm) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Select the best available model
     * Strategy: Use Flash-Lite for most requests (higher capacity), Flash for complex ones
     */
    selectModel(isComplex = false) {
        this.resetDailyCountersIfNeeded();
        
        // For complex requests, prefer Flash if available
        if (isComplex && this.isModelAvailable('flash')) {
            return 'flash';
        }
        
        // Prefer Flash-Lite (higher capacity) for most requests
        if (this.isModelAvailable('flashLite')) {
            return 'flashLite';
        }
        
        // Fallback to Flash if Flash-Lite is unavailable
        if (this.isModelAvailable('flash')) {
            return 'flash';
        }
        
        // Both models are rate limited
        throw new Error('All Gemini models are currently rate limited. Please try again later.');
    }
    
    /**
     * Record a request for rate limiting
     */
    recordRequest(modelKey) {
        this.resetDailyCountersIfNeeded();
        const limits = this.rateLimits[modelKey];
        if (limits) {
            limits.requests.push(Date.now());
            limits.dailyCount++;
        }
    }
    
    /**
     * Get headers for API request
     */
    getHeaders() {
        return {
            'Content-Type': 'application/json'
        };
    }
    
    /**
     * Check if service is available
     */
    async checkHealth() {
        if (!this.apiKey) {
            return {
                available: false,
                error: 'GOOGLE_AI_API_KEY or GEMINI_API_KEY not set in environment variables'
            };
        }
        
        try {
            // Test with Flash-Lite (higher capacity)
            const testModel = this.models.flashLite.name;
            const response = await axios.post(
                `${this.apiBaseUrl}/models/${testModel}:generateContent?key=${this.apiKey}`,
                {
                    contents: [{
                        parts: [{ text: 'test' }]
                    }],
                    generationConfig: {
                        maxOutputTokens: 5
                    }
                },
                {
                    headers: this.getHeaders(),
                    timeout: 5000
                }
            );
            
            return {
                available: true,
                provider: 'google-gemini',
                model: testModel
            };
        } catch (error) {
            return {
                available: false,
                error: error.message,
                status: error.response?.status
            };
        }
    }
    
    /**
     * Generate AI response using Google Gemini
     */
    async generateResponse(userMessage, interactionHistory = [], visitorId = null) {
        // Validate configuration
        if (!this.apiKey) {
            throw new Error('GOOGLE_AI_API_KEY or GEMINI_API_KEY not set in environment variables');
        }
        
        // Validate input
        if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
            throw new Error('Invalid user message');
        }
        
        try {
            console.log('🤖 Generating response with Google Gemini...');
            console.log(`📝 Message length: ${userMessage.length}, History items: ${interactionHistory?.length || 0}`);
            
            // Detect persona and get prompt
            const personaDetection = personaDetector.detectPersona(userMessage, interactionHistory || []);
            const contextKeywords = personaDetector.extractContextKeywords(userMessage);
            const prompt = promptManager.getPrompt(contextKeywords, personaDetection.persona, userMessage);
            const systemPrompt = prompt.split('MESSAGE UTILISATEUR:')[0] || prompt;
            
            // Determine if this is a complex request (long message or complex context)
            const isComplex = userMessage.length > 200 || contextKeywords.length > 5 || personaDetection.confidence < 0.5;
            
            // Select the best available model
            const modelKey = this.selectModel(isComplex);
            const model = this.models[modelKey];
            
            console.log(`📡 Using model: ${model.name} (${modelKey})`);
            console.log(`📊 Daily usage - Flash: ${this.rateLimits.flash.dailyCount}/${this.models.flash.rpd}, Flash-Lite: ${this.rateLimits.flashLite.dailyCount}/${this.models.flashLite.rpd}`);
            
            // Build contents array for Gemini API
            const contents = [];
            
            // Add system instruction as first user message (Gemini doesn't have system role)
            if (systemPrompt) {
                contents.push({
                    role: 'user',
                    parts: [{ text: `Instructions système: ${systemPrompt}` }]
                });
                contents.push({
                    role: 'model',
                    parts: [{ text: 'Compris. Je vais suivre ces instructions.' }]
                });
            }
            
            // Add interaction history (limit to last 5 to avoid token limits)
            if (interactionHistory && Array.isArray(interactionHistory) && interactionHistory.length > 0) {
                const historySlice = interactionHistory.slice(-5);
                historySlice.forEach(msg => {
                    if (!msg) return; // Skip null/undefined entries
                    const role = msg.role || 'user';
                    const content = msg.content || msg.message || '';
                    if (content && content.trim()) {
                        contents.push({
                            role: role === 'assistant' ? 'model' : 'user',
                            parts: [{ text: content.trim() }]
                        });
                    }
                });
            }
            
            // Add current user message
            contents.push({
                role: 'user',
                parts: [{ text: userMessage.trim() }]
            });
            
            // Safety check: ensure we have at least one message
            if (contents.length === 0) {
                throw new Error('No valid content to send to Gemini API');
            }
            
            // Make API request
            const apiResponse = await axios.post(
                `${this.apiBaseUrl}/models/${model.name}:generateContent?key=${this.apiKey}`,
                {
                    contents: contents,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500,
                        topP: 0.9,
                        topK: 40
                    }
                },
                {
                    headers: this.getHeaders(),
                    timeout: this.timeout
                }
            );
            
            // Record the request for rate limiting
            this.recordRequest(modelKey);
            
            // Extract response text
            const generatedText = apiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            if (!generatedText) {
                throw new Error('Empty response from Gemini API');
            }
            
            console.log('✅ Gemini response received, length:', generatedText.length);
            
            return {
                response: this.cleanResponse(generatedText),
                persona: personaDetection.persona,
                confidence: personaDetection.confidence,
                contextKeywords: contextKeywords,
                model: model.name,
                provider: 'google-gemini',
                modelKey: modelKey
            };
        } catch (error) {
            console.error('❌ Gemini API Error:', error.message);
            if (error.response) {
                console.error('❌ Status:', error.response.status);
                console.error('❌ Data:', JSON.stringify(error.response.data));
            }
            
            // Handle rate limiting errors
            if (error.response?.status === 429) {
                throw new Error('Rate limit reached. Please try again in a moment.');
            }
            
            const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error';
            throw new Error(`Gemini API Error: ${errorMessage}`);
        }
    }
    
    /**
     * Clean and format response text
     */
    cleanResponse(text) {
        let cleaned = text
            .replace(/RÉPONSE.*?:/gi, '')
            .replace(/MESSAGE UTILISATEUR.*?:/gi, '')
            .replace(/CONTEXTE.*?:/gi, '')
            .replace(/Instructions système.*?:/gi, '')
            .trim();
        
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
        
        if (!cleaned.match(/[.!?]$/)) {
            cleaned += '.';
        }
        
        return cleaned;
    }
}

module.exports = new OllamaService();
