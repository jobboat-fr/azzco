#!/usr/bin/env node

/**
 * Copy static files to public directory for Vercel
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

// Files to copy to public
const staticFiles = [
    'index.html',
    'mission.html',
    'jobboat.html',
    'invest.html',
    'outwings.html',
    'contact.html',
    'faq.html',
    'privacy.html',
    'gdpr.html',
    'terms.html',
    'styles.css',
    'script.js',
    'chatbot.js',
    'speed-insights.js',
    'favicon.svg'
];

// Directories to copy
const staticDirs = [
    'assets'
];

function ensurePublicDir() {
    if (!fs.existsSync(PUBLIC_DIR)) {
        fs.mkdirSync(PUBLIC_DIR, { recursive: true });
        console.log('✅ Created public directory');
    }
}

function copyFile(src, dest) {
    const srcPath = path.join(ROOT_DIR, src);
    const destPath = path.join(PUBLIC_DIR, dest || src);
    
    if (fs.existsSync(srcPath)) {
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ Copied ${src} → public/${dest || src}`);
        return true;
    } else {
        console.warn(`⚠️  File not found: ${src}`);
        return false;
    }
}

function copyDirectory(src, dest) {
    const srcPath = path.join(ROOT_DIR, src);
    const destPath = path.join(PUBLIC_DIR, dest || src);
    
    if (!fs.existsSync(srcPath)) {
        console.warn(`⚠️  Directory not found: ${src}`);
        return false;
    }
    
    function copyRecursive(srcDir, destDir) {
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        const entries = fs.readdirSync(srcDir, { withFileTypes: true });
        
        for (const entry of entries) {
            const srcPath = path.join(srcDir, entry.name);
            const destPath = path.join(destDir, entry.name);
            
            if (entry.isDirectory()) {
                copyRecursive(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }
    
    copyRecursive(srcPath, destPath);
    console.log(`✅ Copied directory ${src} → public/${dest || src}`);
    return true;
}

// Main execution
console.log('📁 Copying static files to public directory...\n');

ensurePublicDir();

let copied = 0;
staticFiles.forEach(file => {
    if (copyFile(file)) {
        copied++;
    }
});

staticDirs.forEach(dir => {
    if (copyDirectory(dir)) {
        copied++;
    }
});

console.log(`\n✅ Copied ${copied} items to public directory`);
console.log('✅ Build step complete - public directory ready for Vercel');
