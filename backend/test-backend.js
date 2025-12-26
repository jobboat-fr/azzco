// Simple backend test script
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Backend Integration...\n');

let errors = [];
let warnings = [];

// Test 1: Check required files exist
console.log('1️⃣ Checking required files...');
const requiredFiles = [
    'server.js',
    'package.json',
    'models/database.js',
    'routes/chatbot.js',
    'routes/analytics.js',
    'services/ollamaService.js',
    'services/personaDetector.js',
    'services/promptManager.js',
    'services/analyticsService.js'
];

requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${file}`);
    } else {
        errors.push(`Missing file: ${file}`);
        console.log(`   ❌ ${file} - MISSING`);
    }
});

// Test 2: Check prompt files
console.log('\n2️⃣ Checking prompt files...');
const promptsDir = path.join(__dirname, 'prompts');
if (fs.existsSync(promptsDir)) {
    const promptFiles = fs.readdirSync(promptsDir).filter(f => f.endsWith('.json'));
    console.log(`   Found ${promptFiles.length} prompt files:`);
    promptFiles.forEach(file => {
        try {
            const content = JSON.parse(fs.readFileSync(path.join(promptsDir, file), 'utf8'));
            const exampleCount = content.examples ? content.examples.length : 0;
            console.log(`   ✅ ${file} (${exampleCount} examples)`);
            if (exampleCount < 3) {
                warnings.push(`${file} has only ${exampleCount} examples`);
            }
        } catch (e) {
            errors.push(`Invalid JSON in ${file}: ${e.message}`);
            console.log(`   ❌ ${file} - INVALID JSON`);
        }
    });
} else {
    errors.push('Prompts directory not found');
}

// Test 3: Test module imports
console.log('\n3️⃣ Testing module imports...');
try {
    const personaDetector = require('./services/personaDetector');
    console.log('   ✅ personaDetector loaded');
    
    const promptManager = require('./services/promptManager');
    console.log('   ✅ promptManager loaded');
    console.log(`   ✅ Loaded ${Object.keys(promptManager.basePrompts).length} prompt categories`);
    
    const ollamaService = require('./services/ollamaService');
    console.log('   ✅ ollamaService loaded');
    
    const analyticsService = require('./services/analyticsService');
    console.log('   ✅ analyticsService loaded');
} catch (e) {
    errors.push(`Module import error: ${e.message}`);
    console.log(`   ❌ Module import failed: ${e.message}`);
}

// Test 4: Test persona detection
console.log('\n4️⃣ Testing persona detection...');
try {
    const personaDetector = require('./services/personaDetector');
    const testMessage = "Je cherche un emploi en développement";
    const detection = personaDetector.detectPersona(testMessage);
    console.log(`   ✅ Persona detection works: "${testMessage}" -> ${detection.persona} (confidence: ${detection.confidence})`);
    
    const keywords = personaDetector.extractContextKeywords(testMessage);
    console.log(`   ✅ Context keywords extracted: ${keywords.join(', ')}`);
} catch (e) {
    errors.push(`Persona detection error: ${e.message}`);
    console.log(`   ❌ Persona detection failed: ${e.message}`);
}

// Test 5: Test prompt manager
console.log('\n5️⃣ Testing prompt manager...');
try {
    const promptManager = require('./services/promptManager');
    const personaDetector = require('./services/personaDetector');
    
    const testMessage = "Qu'est-ce que JobBoat ?";
    const keywords = personaDetector.extractContextKeywords(testMessage);
    const persona = 'professional';
    
    const prompt = promptManager.getPrompt(keywords, persona, testMessage);
    if (prompt && prompt.length > 100) {
        console.log(`   ✅ Prompt generation works (${prompt.length} chars)`);
    } else {
        warnings.push('Generated prompt seems too short');
    }
} catch (e) {
    errors.push(`Prompt manager error: ${e.message}`);
    console.log(`   ❌ Prompt manager failed: ${e.message}`);
}

// Test 6: Check package.json
console.log('\n6️⃣ Checking package.json...');
try {
    const pkg = require('./package.json');
    console.log(`   ✅ Package name: ${pkg.name}`);
    console.log(`   ✅ Dependencies: ${Object.keys(pkg.dependencies || {}).length}`);
    console.log(`   ✅ Scripts: ${Object.keys(pkg.scripts || {}).length}`);
} catch (e) {
    errors.push(`package.json error: ${e.message}`);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(50));

if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All tests passed! Backend is ready.');
    process.exit(0);
} else {
    if (warnings.length > 0) {
        console.log(`\n⚠️  Warnings (${warnings.length}):`);
        warnings.forEach(w => console.log(`   - ${w}`));
    }
    
    if (errors.length > 0) {
        console.log(`\n❌ Errors (${errors.length}):`);
        errors.forEach(e => console.log(`   - ${e}`));
        process.exit(1);
    } else {
        console.log('\n✅ All critical tests passed (some warnings)');
        process.exit(0);
    }
}