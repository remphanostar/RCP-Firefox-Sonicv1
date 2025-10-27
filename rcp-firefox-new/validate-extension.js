// RCP Extension Validation Script
// Check for common Firefox extension issues

const fs = require('fs');
const path = require('path');

console.log('🔍 RCP Firefox Extension Validation\n');

let issues = [];
let warnings = [];

// Check manifest.json
try {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

  // Check required fields
  const requiredFields = ['name', 'version', 'manifest_version'];
  for (const field of requiredFields) {
    if (!manifest[field]) {
      issues.push(`Missing required field: ${field}`);
    }
  }

  // Check manifest version
  if (manifest.manifest_version !== 3) {
    issues.push('Manifest version should be 3 for modern Firefox extensions');
  }

  // Check permissions
  if (!manifest.permissions || !Array.isArray(manifest.permissions)) {
    issues.push('Permissions should be an array');
  }

  // Check content scripts
  if (manifest.content_scripts) {
    for (const script of manifest.content_scripts) {
      if (script.js) {
        for (const jsFile of script.js) {
          if (!fs.existsSync(jsFile)) {
            issues.push(`Content script file not found: ${jsFile}`);
          }
        }
      }
      if (script.css) {
        for (const cssFile of script.css) {
          if (!fs.existsSync(cssFile)) {
            issues.push(`Content script CSS file not found: ${cssFile}`);
          }
        }
      }
    }
  }

  // Check background script
  if (manifest.background && manifest.background.scripts) {
    for (const script of manifest.background.scripts) {
      if (!fs.existsSync(script)) {
        issues.push(`Background script file not found: ${script}`);
      }
    }
  }

  // Check popup
  if (manifest.action && manifest.action.default_popup) {
    if (!fs.existsSync(manifest.action.default_popup)) {
      issues.push(`Popup file not found: ${manifest.action.default_popup}`);
    }
  }

  // Check icons
  if (manifest.icons) {
    for (const [size, iconPath] of Object.entries(manifest.icons)) {
      if (!fs.existsSync(iconPath)) {
        issues.push(`Icon file not found: ${iconPath} (${size}px)`);
      }
    }
  }

  console.log('✅ Manifest validation completed');

} catch (error) {
  issues.push(`Error parsing manifest.json: ${error.message}`);
}

// Check JavaScript files for common issues
const jsFiles = ['background.js', 'content.js', 'popup/popup.js'];

for (const jsFile of jsFiles) {
  if (!fs.existsSync(jsFile)) {
    issues.push(`JavaScript file not found: ${jsFile}`);
    continue;
  }

  try {
    const content = fs.readFileSync(jsFile, 'utf8');

    // Check for console.log statements (should be removed for production)
    const consoleLogs = (content.match(/console\.(log|error|warn)/g) || []).length;
    if (consoleLogs > 0) {
      warnings.push(`${jsFile}: Contains ${consoleLogs} console statements (consider removing for production)`);
    }

    // Check for proper error handling
    const tryCatchBlocks = (content.match(/try\s*{/g) || []).length;
    const catchBlocks = (content.match(/catch\s*\(/g) || []).length;
    if (tryCatchBlocks > catchBlocks) {
      warnings.push(`${jsFile}: Unmatched try-catch blocks (${tryCatchBlocks} try, ${catchBlocks} catch)`);
    }

    // Check for async/await without proper error handling
    const asyncFunctions = (content.match(/async\s+(function|\()/g) || []).length;
    const awaitStatements = (content.match(/await\s+/g) || []).length;
    if (asyncFunctions > 0 && awaitStatements > 0) {
      // This is fine, just noting the presence
      console.log(`ℹ️  ${jsFile}: Contains async/await code (${asyncFunctions} async functions, ${awaitStatements} await statements)`);
    }

  } catch (error) {
    issues.push(`Error reading ${jsFile}: ${error.message}`);
  }
}

// Check HTML files
const htmlFiles = ['popup/popup.html', 'test-page.html'];
for (const htmlFile of htmlFiles) {
  if (fs.existsSync(htmlFile)) {
    try {
      const content = fs.readFileSync(htmlFile, 'utf8');

      // Check for basic HTML structure
      if (!content.includes('<html') || !content.includes('</html>')) {
        issues.push(`${htmlFile}: Missing proper HTML structure`);
      }

      // Check for script tags
      const scriptTags = (content.match(/<script[^>]*>/g) || []).length;
      if (scriptTags > 0) {
        console.log(`ℹ️  ${htmlFile}: Contains ${scriptTags} script tags`);
      }

    } catch (error) {
      issues.push(`Error reading ${htmlFile}: ${error.message}`);
    }
  }
}

// Report results
console.log('\n📊 Validation Results:');
console.log('==================');

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ No issues found! Extension looks good to go.');
} else {
  if (issues.length > 0) {
    console.log(`❌ Found ${issues.length} issues:`);
    issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  Found ${warnings.length} warnings:`);
    warnings.forEach((warning, index) => {
      console.log(`  ${index + 1}. ${warning}`);
    });
  }
}

console.log('\n🎯 Next Steps:');
console.log('1. Load the extension in Firefox using about:debugging');
console.log('2. Test the functionality on the test-page.html');
console.log('3. Check the browser console for any runtime errors');
console.log('4. Test right-click context menu on various text fields');

if (issues.length > 0) {
  console.log('\n🔧 Please fix the issues above before testing.');
} else {
  console.log('\n🚀 Extension is ready for testing!');
}