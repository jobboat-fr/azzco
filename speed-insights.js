// Vercel Speed Insights - Official Implementation for HTML
// This script initializes Speed Insights using the official Vercel method
// Documentation: https://vercel.com/docs/speed-insights

(function() {
    // Initialize the Speed Insights queue
    window.si = window.si || function () { 
        (window.siq = window.siq || []).push(arguments); 
    };
    
    // Load the official Vercel Speed Insights script
    var script = document.createElement('script');
    script.defer = true;
    script.src = '/_vercel/speed-insights/script.js';
    
    script.onload = function() {
        console.log('Vercel Speed Insights loaded successfully');
    };
    
    script.onerror = function() {
        console.warn('Vercel Speed Insights failed to load. Make sure Speed Insights is enabled in your Vercel project settings.');
    };
    
    document.head.appendChild(script);
})();
