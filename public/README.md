# Public Directory

This directory is created for Vercel compatibility.
Static files are actually served from the root directory (.) as specified in vercel.json.

The outputDirectory in vercel.json is set to "." which means:
- HTML files: index.html, mission.html, etc. (root)
- CSS files: styles.css (root)
- JS files: script.js, chatbot.js, etc. (root)
- API: /api/index.js (serverless function)
