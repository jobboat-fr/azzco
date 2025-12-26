const personaKeywords = require('../prompts/persona-keywords.json');
const personaProfiles = require('../prompts/persona-profiles.json');

/**
 * Detect persona based on user message and interaction patterns
 */
class PersonaDetector {
    constructor() {
        this.personaScores = {};
        this.interactionHistory = [];
    }

    /**
     * Analyze message and detect persona
     */
    detectPersona(message, interactionHistory = []) {
        const messageLower = message.toLowerCase();
        const scores = {};
        
        // Initialize scores
        Object.keys(personaProfiles).forEach(persona => {
            scores[persona] = 0;
        });

        // Check keywords for each persona
        Object.keys(personaKeywords).forEach(persona => {
            const keywords = personaKeywords[persona];
            
            keywords.forEach(keyword => {
                if (messageLower.includes(keyword.toLowerCase())) {
                    scores[persona] += 1;
                }
            });
        });

        // Check interaction patterns
        interactionHistory.forEach(interaction => {
            const prevPersona = interaction.persona;
            if (prevPersona && scores[prevPersona] !== undefined) {
                scores[prevPersona] += 0.5; // Continuity bonus
            }
        });

        // Find dominant persona
        let maxScore = 0;
        let detectedPersona = 'professional';
        
        Object.keys(scores).forEach(persona => {
            if (scores[persona] > maxScore) {
                maxScore = scores[persona];
                detectedPersona = persona;
            }
        });

        // If no strong match, use professional as default
        if (maxScore === 0) {
            detectedPersona = 'professional';
        }

        return {
            persona: detectedPersona,
            confidence: maxScore,
            scores: scores
        };
    }

    /**
     * Get context keywords from message
     */
    extractContextKeywords(message) {
        const messageLower = message.toLowerCase();
        const keywords = [];

        // Extract relevant context keywords
        const contextPatterns = [
            { pattern: /jobboat|job boat|emploi|carrière|travail/g, keyword: 'jobboat' },
            { pattern: /outwings|out wings|sortie|groupe|social/g, keyword: 'outwings' },
            { pattern: /ia|ai|intelligence artificielle|artificial intelligence/g, keyword: 'ai' },
            { pattern: /investissement|investment|finance|capital/g, keyword: 'investment' },
            { pattern: /contact|email|téléphone|phone/g, keyword: 'contact' },
            { pattern: /mission|vision|philosophie|philosophy/g, keyword: 'mission' },
            { pattern: /technologie|technology|tech|innovation/g, keyword: 'technology' },
            { pattern: /équipe|team|collaboration/g, keyword: 'team' },
            { pattern: /partenariat|partnership|collaboration/g, keyword: 'partnership' },
            { pattern: /démo|demo|screenshot|capture/g, keyword: 'demo' }
        ];

        contextPatterns.forEach(({ pattern, keyword }) => {
            if (pattern.test(messageLower)) {
                keywords.push(keyword);
            }
        });

        return keywords;
    }

    /**
     * Get persona profile
     */
    getPersonaProfile(personaName) {
        return personaProfiles[personaName] || personaProfiles['professional'];
    }
}

module.exports = new PersonaDetector();