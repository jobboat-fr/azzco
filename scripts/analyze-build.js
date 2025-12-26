#!/usr/bin/env node

/**
 * Build Logs Analyzer for Vercel Deployment
 * Simulates what Vercel should see during build
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
    const fullPath = path.join(ROOT_DIR, filePath);
    const exists = fs.existsSync(fullPath);
    if (exists) {
        const stats = fs.statSync(fullPath);
        log(`✅ ${description}`, 'green');
        log(`   Path: ${filePath}`, 'cyan');
        log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`, 'cyan');
        return true;
    } else {
        log(`❌ ${description}`, 'red');
        log(`   Path: ${filePath} - NOT FOUND`, 'red');
        return false;
    }
}

function checkDirectory(dirPath, description) {
    const fullPath = path.join(ROOT_DIR, dirPath);
    const exists = fs.existsSync(fullPath);
    if (exists) {
        const files = fs.readdirSync(fullPath);
        log(`✅ ${description}`, 'green');
        log(`   Path: ${dirPath}`, 'cyan');
        log(`   Files: ${files.length}`, 'cyan');
        return true;
    } else {
        log(`❌ ${description}`, 'red');
        return false;
    }
}

function analyzePackageJson(filePath) {
    const fullPath = path.join(ROOT_DIR, filePath);
    if (fs.existsSync(fullPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            log(`\n📦 Package.json Analysis (${filePath}):`, 'blue');
            log(`   Name: ${pkg.name}`, 'cyan');
            log(`   Version: ${pkg.version}`, 'cyan');
            if (pkg.scripts) {
                log(`   Scripts:`, 'cyan');
                Object.keys(pkg.scripts).forEach(script => {
                    log(`     - ${script}: ${pkg.scripts[script]}`, 'cyan');
                });
            }
            if (pkg.dependencies) {
                log(`   Dependencies: ${Object.keys(pkg.dependencies).length}`, 'cyan');
            }
            return true;
        } catch (err) {
            log(`❌ Error parsing ${filePath}: ${err.message}`, 'red');
            return false;
        }
    }
    return false;
}

function checkVercelConfig() {
    log('\n🔧 Vercel Configuration Analysis:', 'blue');
    const vercelPath = path.join(ROOT_DIR, 'vercel.json');
    if (fs.existsSync(vercelPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
            log(`✅ vercel.json found`, 'green');
            log(`   Version: ${config.version || 'not specified'}`, 'cyan');
            
            if (config.builds) {
                log(`   Builds: ${config.builds.length}`, 'cyan');
                config.builds.forEach((build, i) => {
                    log(`     ${i + 1}. ${build.src} → ${build.use}`, 'cyan');
                });
            }
            
            if (config.rewrites) {
                log(`   Rewrites: ${config.rewrites.length}`, 'cyan');
                config.rewrites.forEach((rewrite, i) => {
                    log(`     ${i + 1}. ${rewrite.source} → ${rewrite.destination}`, 'cyan');
                });
            }
            
            if (config.buildCommand) {
                log(`   Build Command: ${config.buildCommand}`, 'cyan');
            }
            
            return true;
        } catch (err) {
            log(`❌ Error parsing vercel.json: ${err.message}`, 'red');
            return false;
        }
    } else {
        log(`❌ vercel.json NOT FOUND`, 'red');
        return false;
    }
}

function checkAPIStructure() {
    log('\n🌐 API Structure Analysis:', 'blue');
    const apiPath = path.join(ROOT_DIR, 'api');
    if (fs.existsSync(apiPath)) {
        const files = fs.readdirSync(apiPath);
        log(`✅ /api directory exists`, 'green');
        log(`   Files: ${files.join(', ')}`, 'cyan');
        
        // Check index.js
        const indexPath = path.join(apiPath, 'index.js');
        if (fs.existsSync(indexPath)) {
            const content = fs.readFileSync(indexPath, 'utf8');
            log(`✅ api/index.js exists`, 'green');
            log(`   Size: ${(fs.statSync(indexPath).size / 1024).toFixed(2)} KB`, 'cyan');
            
            // Check for critical imports
            const hasExpress = content.includes('require(\'express\')');
            const hasBackendRoutes = content.includes('../backend');
            const hasModuleExport = content.includes('module.exports');
            
            log(`   Has Express: ${hasExpress ? '✅' : '❌'}`, hasExpress ? 'green' : 'red');
            log(`   Has Backend Routes: ${hasBackendRoutes ? '✅' : '❌'}`, hasBackendRoutes ? 'green' : 'red');
            log(`   Has Module Export: ${hasModuleExport ? '✅' : '❌'}`, hasModuleExport ? 'green' : 'red');
        } else {
            log(`❌ api/index.js NOT FOUND`, 'red');
        }
        
        // Check package.json
        const pkgPath = path.join(apiPath, 'package.json');
        if (fs.existsSync(pkgPath)) {
            analyzePackageJson('api/package.json');
        }
    } else {
        log(`❌ /api directory NOT FOUND`, 'red');
    }
}

function checkStaticFiles() {
    log('\n📄 Static Files Analysis:', 'blue');
    const staticFiles = [
        'index.html',
        'mission.html',
        'jobboat.html',
        'invest.html',
        'outwings.html',
        'contact.html',
        'styles.css',
        'script.js',
        'chatbot.js',
        'speed-insights.js'
    ];
    
    let found = 0;
    staticFiles.forEach(file => {
        if (checkFile(file, `Static file: ${file}`)) {
            found++;
        }
    });
    
    log(`\n   Summary: ${found}/${staticFiles.length} static files found`, found === staticFiles.length ? 'green' : 'yellow');
}

function checkBackendStructure() {
    log('\n🔙 Backend Structure Analysis:', 'blue');
    const backendPath = path.join(ROOT_DIR, 'backend');
    if (fs.existsSync(backendPath)) {
        log(`✅ /backend directory exists`, 'green');
        
        // Check critical backend files
        const criticalFiles = [
            'server.js',
            'package.json',
            'routes/chatbot.js',
            'routes/analytics.js',
            'routes/notes.js',
            'models/database.js',
            'models/postgresDatabase.js',
            'services/ollamaService.js',
            'services/analyticsService.js'
        ];
        
        let found = 0;
        criticalFiles.forEach(file => {
            const fullPath = path.join(backendPath, file);
            if (fs.existsSync(fullPath)) {
                log(`✅ backend/${file}`, 'green');
                found++;
            } else {
                log(`❌ backend/${file} - NOT FOUND`, 'red');
            }
        });
        
        log(`\n   Summary: ${found}/${criticalFiles.length} critical files found`, found === criticalFiles.length ? 'green' : 'yellow');
        
        // Analyze backend package.json
        analyzePackageJson('backend/package.json');
    } else {
        log(`❌ /backend directory NOT FOUND`, 'red');
    }
}

function simulateVercelBuild() {
    log('\n🚀 Simulating Vercel Build Process:', 'blue');
    log('   Step 1: Detecting project structure...', 'cyan');
    
    const hasVercelJson = fs.existsSync(path.join(ROOT_DIR, 'vercel.json'));
    const hasApiDir = fs.existsSync(path.join(ROOT_DIR, 'api'));
    const hasBackendDir = fs.existsSync(path.join(ROOT_DIR, 'backend'));
    const hasPackageJson = fs.existsSync(path.join(ROOT_DIR, 'package.json'));
    
    log(`   ✅ vercel.json: ${hasVercelJson ? 'Found' : 'Missing'}`, hasVercelJson ? 'green' : 'red');
    log(`   ✅ /api directory: ${hasApiDir ? 'Found' : 'Missing'}`, hasApiDir ? 'green' : 'red');
    log(`   ✅ /backend directory: ${hasBackendDir ? 'Found' : 'Missing'}`, hasBackendDir ? 'green' : 'red');
    log(`   ✅ package.json: ${hasPackageJson ? 'Found' : 'Missing'}`, hasPackageJson ? 'green' : 'red');
    
    log('\n   Step 2: Running build command...', 'cyan');
    const vercelPath = path.join(ROOT_DIR, 'vercel.json');
    if (fs.existsSync(vercelPath)) {
        const config = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
        if (config.buildCommand) {
            log(`   Command: ${config.buildCommand}`, 'cyan');
            log(`   ⚠️  This would run: ${config.buildCommand}`, 'yellow');
        } else {
            log(`   ⚠️  No buildCommand specified`, 'yellow');
        }
    }
    
    log('\n   Step 3: Detecting serverless functions...', 'cyan');
    if (hasApiDir) {
        const apiFiles = fs.readdirSync(path.join(ROOT_DIR, 'api'));
        const jsFiles = apiFiles.filter(f => f.endsWith('.js'));
        log(`   ✅ Found ${jsFiles.length} serverless function(s):`, 'green');
        jsFiles.forEach(file => {
            log(`      - /api/${file}`, 'cyan');
        });
    }
    
    log('\n   Step 4: Detecting static files...', 'cyan');
    const htmlFiles = fs.readdirSync(ROOT_DIR).filter(f => f.endsWith('.html'));
    log(`   ✅ Found ${htmlFiles.length} HTML file(s)`, 'green');
    
    log('\n   Step 5: Build result...', 'cyan');
    if (hasVercelJson && hasApiDir && hasBackendDir) {
        log(`   ✅ Build should succeed`, 'green');
        log(`   ✅ Serverless functions: Ready`, 'green');
        log(`   ✅ Static files: Ready`, 'green');
    } else {
        log(`   ❌ Build would fail - missing critical files`, 'red');
    }
}

// Main execution
log('\n' + '='.repeat(60), 'blue');
log('🔍 VERCEL BUILD LOGS ANALYZER', 'blue');
log('='.repeat(60), 'blue');

log(`\n📁 Root Directory: ${ROOT_DIR}`, 'cyan');

// Run all checks
checkVercelConfig();
checkAPIStructure();
checkBackendStructure();
checkStaticFiles();
simulateVercelBuild();

log('\n' + '='.repeat(60), 'blue');
log('✅ Analysis Complete', 'green');
log('='.repeat(60), 'blue');
log('\n💡 Next Steps:', 'yellow');
log('   1. Verify Root Directory in Vercel = "azzco-website"', 'cyan');
log('   2. Check Build Logs in Vercel Dashboard', 'cyan');
log('   3. Compare with this analysis', 'cyan');
log('');
