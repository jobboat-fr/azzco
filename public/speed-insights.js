// Vercel Speed Insights Integration for Static HTML
// This implements the official Vercel Speed Insights script for HTML sites
// Documentation: https://vercel.com/docs/speed-insights

(function() {
    // Initialize the Speed Insights queue
    window.si = window.si || function () { 
        (window.siq = window.siq || []).push(arguments); 
    };
    
    // Load the Speed Insights script from Vercel
    var script = document.createElement('script');
    script.src = '/_vercel/speed-insights/script.js';
    script.defer = true;
    
    script.onload = function() {
        console.log('Vercel Speed Insights loaded successfully');
    };
    
    script.onerror = function() {
        console.warn('Vercel Speed Insights failed to load. Make sure Speed Insights is enabled in your Vercel project settings.');
    };
    
    document.head.appendChild(script);
})();
