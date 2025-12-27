// Chatbot Widget JavaScript
class ChatbotWidget {
    constructor() {
        // Auto-detect API URL based on environment
        this.apiUrl = window.location.origin + '/api';
        this.visitorId = this.getOrCreateVisitorId();
        this.sessionId = this.generateSessionId();
        this.isOpen = false;
        this.isTyping = false;
        this.hasShownWelcome = false;
        
        this.init();
    }

    init() {
        // Get elements
        this.toggle = document.getElementById('chatbotToggle');
        this.container = document.getElementById('chatbotContainer');
        this.closeBtn = document.getElementById('chatbotClose');
        this.messagesContainer = document.getElementById('chatbotMessages');
        this.input = document.getElementById('chatbotInput');
        this.sendBtn = document.getElementById('chatbotSend');
        this.typingIndicator = document.getElementById('chatbotTyping'); // Optional
        this.badge = document.getElementById('chatbotBadge'); // Optional

        // Check if elements exist
        if (!this.toggle) {
            console.error('❌ Chatbot toggle button not found!');
            return;
        }
        if (!this.container) {
            console.error('❌ Chatbot container not found!');
            return;
        }
        if (!this.closeBtn) {
            console.error('❌ Chatbot close button not found!');
            return;
        }
        if (!this.messagesContainer) {
            console.error('❌ Chatbot messages container not found!');
            return;
        }
        if (!this.input) {
            console.error('❌ Chatbot input not found!');
            return;
        }
        if (!this.sendBtn) {
            console.error('❌ Chatbot send button not found!');
            return;
        }

        console.log('✅ Chatbot elements found, initializing...');

        // Event listeners
        this.toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔘 Toggle clicked');
            this.toggleChatbot();
        });
        
        this.closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closeChatbot();
        });
        
        this.sendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.sendMessage();
        });
        
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Track page view
        this.trackPageView();

        // Auto-open on first visit (optional)
        if (!localStorage.getItem('chatbot_seen')) {
            setTimeout(() => {
                this.openChatbot();
                localStorage.setItem('chatbot_seen', 'true');
            }, 3000);
        }
    }

    getOrCreateVisitorId() {
        let visitorId = localStorage.getItem('visitor_id');
        if (!visitorId) {
            visitorId = this.generateVisitorId();
            localStorage.setItem('visitor_id', visitorId);
        }
        return visitorId;
    }

    generateVisitorId() {
        return 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    toggleChatbot() {
        if (this.isOpen) {
            this.closeChatbot();
        } else {
            this.openChatbot();
        }
    }

    openChatbot() {
        this.isOpen = true;
        this.container.classList.add('active');
        this.input.focus();
        this.hideBadge();
        
        // Show welcome message if this is the first time opening
        if (!this.hasShownWelcome) {
            this.addMessage("Bonjour ! Je m'appelle Nicky's Pizza. Comment puis-je vous aider aujourd'hui ?", 'bot');
            this.hasShownWelcome = true;
        }
        
        // Adjust height after opening
        setTimeout(() => this.adjustContainerHeight(), 100);
    }

    closeChatbot() {
        this.isOpen = false;
        this.container.classList.remove('active');
    }

    async sendMessage() {
        const message = this.input.value.trim();
        if (!message || this.isTyping) return;

        // Add user message to UI
        this.addMessage(message, 'user');
        this.input.value = '';
        this.setTyping(true);

        try {
            // Send to backend
            const response = await fetch(`${this.apiUrl}/chatbot/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    visitorId: this.visitorId,
                    sessionId: this.sessionId
                })
            });

            // Check content type before parsing
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // If not JSON, read as text to see what we got
                const text = await response.text();
                console.error('Non-JSON response:', text.substring(0, 200));
                throw new Error('Le serveur a retourné une réponse invalide');
            }

            if (response.ok) {
                // Add bot response to UI
                this.addMessage(data.response, 'bot');
                
                // Track chat event
                this.trackEvent('chat_message_sent', {
                    message: message,
                    persona: data.persona,
                    responseTime: data.responseTime
                });
            } else {
                throw new Error(data.error || 'Erreur lors de l\'envoi du message');
            }
        } catch (error) {
            console.error('Chatbot error:', error);
            this.addMessage(
                'Désolé, je rencontre un problème technique. Veuillez réessayer plus tard ou nous contacter directement.',
                'bot'
            );
        } finally {
            this.setTyping(false);
        }
    }

    addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${type}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = `<p>${this.escapeHtml(text)}</p>`;
        
        messageDiv.appendChild(contentDiv);
        this.messagesContainer.appendChild(messageDiv);
        
        // Expand container height based on content
        this.adjustContainerHeight();
        
        // Scroll to bottom
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    adjustContainerHeight() {
        if (!this.container || !this.messagesContainer) return;
        
        // Calculate total content height
        const headerHeight = this.container.querySelector('.chatbot-header')?.offsetHeight || 0;
        const inputHeight = this.container.querySelector('.chatbot-input-container')?.offsetHeight || 0;
        const messagesHeight = this.messagesContainer.scrollHeight;
        
        // Calculate desired height (content + padding)
        const desiredHeight = headerHeight + messagesHeight + inputHeight;
        const maxHeight = window.innerHeight - 120; // Leave space for toggle button
        const minHeight = 200;
        
        // Set container height (clamped between min and max)
        const finalHeight = Math.max(minHeight, Math.min(desiredHeight, maxHeight));
        this.container.style.height = `${finalHeight}px`;
    }

    setTyping(isTyping) {
        this.isTyping = isTyping;
        this.sendBtn.disabled = isTyping;
        this.input.disabled = isTyping;
        
        if (this.typingIndicator) {
            if (isTyping) {
                this.typingIndicator.style.display = 'flex';
            } else {
                this.typingIndicator.style.display = 'none';
            }
        }
    }

    showBadge(count = 1) {
        if (this.badge) {
            this.badge.textContent = count;
            this.badge.style.display = 'flex';
        }
    }

    hideBadge() {
        if (this.badge) {
            this.badge.style.display = 'none';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async trackPageView() {
        try {
            await fetch(`${this.apiUrl}/analytics/pageview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    visitorId: this.visitorId,
                    pagePath: window.location.pathname,
                    pageTitle: document.title,
                    timeSpent: 0,
                    scrollDepth: 0
                })
            });
        } catch (error) {
            console.error('Analytics error:', error);
        }
    }

    async trackEvent(eventType, eventData) {
        try {
            await fetch(`${this.apiUrl}/analytics/event`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    visitorId: this.visitorId,
                    eventType: eventType,
                    eventData: eventData
                })
            });
        } catch (error) {
            console.error('Analytics error:', error);
        }
    }
}

// Initialize chatbot when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 Initializing chatbot...');
        try {
            window.chatbot = new ChatbotWidget();
            console.log('✅ Chatbot initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing chatbot:', error);
        }
    });
} else {
    // DOM already loaded
    console.log('🚀 Initializing chatbot (DOM already loaded)...');
    try {
        window.chatbot = new ChatbotWidget();
        console.log('✅ Chatbot initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing chatbot:', error);
    }
}

// Track page visibility for time spent
let pageStartTime = Date.now();
let isPageVisible = true;

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, calculate time spent
        const timeSpent = Date.now() - pageStartTime;
        if (window.chatbot && timeSpent > 1000) {
            window.chatbot.trackEvent('page_time_spent', { timeSpent });
        }
    } else {
        // Page is visible again
        pageStartTime = Date.now();
    }
});

// Track scroll depth
let maxScrollDepth = 0;
window.addEventListener('scroll', () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollDepth = Math.round((scrollTop / scrollHeight) * 100);
    
    if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        if (window.chatbot && scrollDepth % 25 === 0) {
            window.chatbot.trackEvent('scroll_depth', { depth: scrollDepth });
        }
    }
});