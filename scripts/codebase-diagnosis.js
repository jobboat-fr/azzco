#!/usr/bin/env node

/**
 * Codebase Diagnosis Script
 * Analyzes the codebase for:
 * - Code duplications
 * - Inconsistencies
 * - Missing dependencies
 * - Configuration issues
 */

const fs = require('fs');
const path = require('path');

const issues = {
    duplications: [],
    inconsistencies: [],
    missingFiles: [],
    configurationIssues: [],
    warnings: []
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Check for duplicate files
function checkDuplications() {
    log('\n🔍 Checking for code duplications...', 'cyan');
    
    const filesToCheck = [
        { source: 'chatbot.js', target: 'public/chatbot.js', type: 'duplicate' },
        { source: 'script.js', target: 'public/script.js', type: 'duplicate' },
        { source: 'speed-insights.js', target: 'public/speed-insights.js', type: 'duplicate' },
        { source: 'api/index.js', target: 'backend/server.js', type: 'similar' }
    ];
    
    filesToCheck.forEach(({ source, target, type }) => {
        const sourcePath = path.join(__dirname, '..', source);
        const targetPath = path.join(__dirname, '..', target);
        
        if (fs.existsSync(sourcePath) && fs.existsSync(targetPath)) {
            const sourceContent = fs.readFileSync(sourcePath, 'utf8');
            const targetContent = fs.readFileSync(targetPath, 'utf8');
            
            if (sourceContent === targetContent) {
                issues.duplications.push({
                    type: 'exact_duplicate',
                    files: [source, target],
                    severity: 'high',
                    message: `Exact duplicate found: ${source} and ${target}`
                });
                log(`  ❌ Exact duplicate: ${source} ↔ ${target}`, 'red');
            } else if (type === 'similar' && sourceContent.length > 0 && targetContent.length > 0) {
                // Check similarity (simple line count comparison)
                const sourceLines = sourceContent.split('\n').length;
                const targetLines = targetContent.split('\n').length;
                const similarity = Math.min(sourceLines, targetLines) / Math.max(sourceLines, targetLines);
                
                if (similarity > 0.7) {
                    issues.duplications.push({
                        type: 'similar_code',
                        files: [source, target],
                        severity: 'medium',
                        similarity: Math.round(similarity * 100),
                        message: `Similar code found: ${source} and ${target} (${Math.round(similarity * 100)}% similar)`
                    });
                    log(`  ⚠️  Similar code: ${source} ↔ ${target} (${Math.round(similarity * 100)}% similar)`, 'yellow');
                }
            }
        }
    });
}

// Check for inconsistencies
function checkInconsistencies() {
    log('\n🔍 Checking for inconsistencies...', 'cyan');
    
    // Check API key variable names
    const apiKeyChecks = [
        { file: 'backend/services/ollamaService.js', patterns: ['GOOGLE_AI_API_KEY', 'GEMINI_API_KEY', 'AI_API_KEY'] },
        { file: 'api/index.js', patterns: ['GOOGLE_AI_API_KEY'] },
        { file: 'backend/server.js', patterns: ['OLLAMA_API_URL'] }
    ];
    
    apiKeyChecks.forEach(({ file, patterns }) => {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const foundPatterns = patterns.filter(p => content.includes(p));
            
            if (foundPatterns.length === 0) {
                issues.inconsistencies.push({
                    type: 'missing_api_key_reference',
                    file: file,
                    severity: 'high',
                    message: `No API key references found in ${file}`
                });
                log(`  ❌ Missing API key references in ${file}`, 'red');
            }
        }
    });
    
    // Check error handling consistency
    const errorHandlingFiles = [
        'api/index.js',
        'backend/server.js',
        'backend/routes/chatbot.js'
    ];
    
    errorHandlingFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check for inconsistent error responses
            if (content.includes('res.status(500)') && content.includes('res.json({')) {
                issues.inconsistencies.push({
                    type: 'inconsistent_error_handling',
                    file: file,
                    severity: 'medium',
                    message: `Mixed error handling in ${file} (both status(500) and json())`
                });
                log(`  ⚠️  Inconsistent error handling in ${file}`, 'yellow');
            }
        }
    });
}

// Check for missing files
function checkMissingFiles() {
    log('\n🔍 Checking for missing files...', 'cyan');
    
    const requiredFiles = [
        'api/index.js',
        'backend/routes/chatbot.js',
        'backend/routes/analytics.js',
        'backend/routes/notes.js',
        'backend/services/ollamaService.js',
        'backend/models/database.js',
        'vercel.json',
        'package.json'
    ];
    
    requiredFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (!fs.existsSync(filePath)) {
            issues.missingFiles.push({
                file: file,
                severity: 'high',
                message: `Missing required file: ${file}`
            });
            log(`  ❌ Missing file: ${file}`, 'red');
        } else {
            log(`  ✅ Found: ${file}`, 'green');
        }
    });
}

// Check configuration issues
function checkConfiguration() {
    log('\n🔍 Checking configuration...', 'cyan');
    
    // Check vercel.json
    const vercelPath = path.join(__dirname, '..', 'vercel.json');
    if (fs.existsSync(vercelPath)) {
        try {
            const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
            
            if (!vercelConfig.functions || !vercelConfig.functions['api/index.js']) {
                issues.configurationIssues.push({
                    type: 'missing_vercel_function_config',
                    severity: 'medium',
                    message: 'Missing function configuration in vercel.json'
            });
                log(`  ⚠️  Missing function config in vercel.json`, 'yellow');
            }
        } catch (e) {
            issues.configurationIssues.push({
                type: 'invalid_vercel_json',
                severity: 'high',
                message: `Invalid vercel.json: ${e.message}`
            });
            log(`  ❌ Invalid vercel.json: ${e.message}`, 'red');
        }
    }
    
    // Check package.json dependencies
    const packagePath = path.join(__dirname, '..', 'package.json');
    const apiPackagePath = path.join(__dirname, '..', 'api/package.json');
    
    [packagePath, apiPackagePath].forEach(pkgPath => {
        if (fs.existsSync(pkgPath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                const requiredDeps = ['express', 'axios', 'cors'];
                
                requiredDeps.forEach(dep => {
                    if (!pkg.dependencies || !pkg.dependencies[dep]) {
                        issues.configurationIssues.push({
                            type: 'missing_dependency',
                            file: path.basename(pkgPath),
                            dependency: dep,
                            severity: 'high',
                            message: `Missing dependency ${dep} in ${path.basename(pkgPath)}`
                        });
                        log(`  ❌ Missing dependency: ${dep} in ${path.basename(pkgPath)}`, 'red');
                    }
                });
            } catch (e) {
                log(`  ⚠️  Could not parse ${path.basename(pkgPath)}`, 'yellow');
            }
        }
    });
}

// Check for unused files
function checkUnusedFiles() {
    log('\n🔍 Checking for potentially unused files...', 'cyan');
    
    const potentiallyUnused = [
        'backend/server.js', // If using api/index.js for Vercel
        'public/chatbot.js', // If using root chatbot.js
        'public/script.js', // If using root script.js
    ];
    
    potentiallyUnused.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
            issues.warnings.push({
                type: 'potentially_unused_file',
                file: file,
                severity: 'low',
                message: `File ${file} may be unused (check if it's referenced)`
            });
            log(`  ⚠️  Potentially unused: ${file}`, 'yellow');
        }
    });
}

// Generate report
function generateReport() {
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 DIAGNOSIS REPORT', 'magenta');
    log('='.repeat(60), 'cyan');
    
    const totalIssues = 
        issues.duplications.length +
        issues.inconsistencies.length +
        issues.missingFiles.length +
        issues.configurationIssues.length +
        issues.warnings.length;
    
    log(`\n📈 Summary:`, 'cyan');
    log(`  Total Issues Found: ${totalIssues}`, totalIssues > 0 ? 'red' : 'green');
    log(`  - Duplications: ${issues.duplications.length}`, issues.duplications.length > 0 ? 'red' : 'green');
    log(`  - Inconsistencies: ${issues.inconsistencies.length}`, issues.inconsistencies.length > 0 ? 'red' : 'green');
    log(`  - Missing Files: ${issues.missingFiles.length}`, issues.missingFiles.length > 0 ? 'red' : 'green');
    log(`  - Configuration Issues: ${issues.configurationIssues.length}`, issues.configurationIssues.length > 0 ? 'red' : 'green');
    log(`  - Warnings: ${issues.warnings.length}`, issues.warnings.length > 0 ? 'yellow' : 'green');
    
    // Save report to file
    const reportPath = path.join(__dirname, '..', 'DIAGNOSIS_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(issues, null, 2));
    log(`\n📄 Full report saved to: DIAGNOSIS_REPORT.json`, 'cyan');
    
    return issues;
}

// Main execution
function main() {
    log('🔬 Starting Codebase Diagnosis...', 'magenta');
    
    checkDuplications();
    checkInconsistencies();
    checkMissingFiles();
    checkConfiguration();
    checkUnusedFiles();
    
    const report = generateReport();
    
    // Exit with error code if critical issues found
    const criticalIssues = 
        issues.duplications.filter(i => i.severity === 'high').length +
        issues.inconsistencies.filter(i => i.severity === 'high').length +
        issues.missingFiles.length +
        issues.configurationIssues.filter(i => i.severity === 'high').length;
    
    if (criticalIssues > 0) {
        log(`\n❌ Found ${criticalIssues} critical issues!`, 'red');
        process.exit(1);
    } else {
        log(`\n✅ No critical issues found!`, 'green');
        process.exit(0);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main, issues };
