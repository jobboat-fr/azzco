// Vercel Web Analytics Integration for Static HTML
// This script loads Web Analytics tracking script
(function() {
    // Create the analytics queue
    window.va = window.va || function () { 
        (window.vaq = window.vaq || []).push(arguments); 
    };
    
    // Load the Vercel Insights script
    var script = document.createElement('script');
    script.src = '/_vercel/insights/script.js';
    script.defer = true;
    
    script.onload = function() {
        console.log('Vercel Web Analytics loaded successfully');
    };
    
    script.onerror = function() {
        console.warn('Vercel Web Analytics failed to load');
    };
    
    document.head.appendChild(script);
})();
