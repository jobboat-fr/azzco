// Vercel Speed Insights Integration for Static HTML
// This script loads Speed Insights when deployed on Vercel
(function() {
    // Only load on Vercel deployment
    if (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('vercel.com')) {
        var script = document.createElement('script');
        script.src = 'https://va.vercel-scripts.com/v1/script.debug.js';
        script.defer = true;
        script.setAttribute('data-skip-dnt', 'true');
        script.onload = function() {
            if (window.va) {
                console.log('Vercel Speed Insights loaded successfully');
            }
        };
        script.onerror = function() {
            console.warn('Vercel Speed Insights failed to load');
        };
        document.head.appendChild(script);
    }
})();
