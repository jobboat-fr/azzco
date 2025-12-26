// Vercel Speed Insights Integration
(function() {
    // Load Speed Insights script
    var script = document.createElement('script');
    script.src = 'https://va.vercel-scripts.com/v1/script.debug.js';
    script.defer = true;
    script.onload = function() {
        console.log('Vercel Speed Insights loaded');
    };
    script.onerror = function() {
        console.warn('Vercel Speed Insights failed to load');
    };
    document.head.appendChild(script);
})();
