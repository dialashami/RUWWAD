/**
 * Script to replace all hardcoded localhost:3000 API URLs with API_CONFIG
 * Run this with: node update-api-urls.js
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// Files to update and their patterns
const filesToUpdate = [
  {
    file: 'pages/TeacherHome/lib/auth.js',
    replacements: [
      {
        pattern: /fetch\('http:\/\/localhost:3000\/api\/login'/g,
        replacement: `fetch('http://localhost:3000/api/login'`  // This file needs special handling
      }
    ]
  },
  {
    file: 'pages/TeacherHome/components/AITutorPage.jsx',
    replacements: [
      {
        pattern: /const API_BASE_URL = 'http:\/\/localhost:3000\/api';/g,
        replacement: `import { API_CONFIG } from '../../../config/api.config';\nconst API_BASE_URL = API_CONFIG.BASE_URL + '/api';`
      }
    ]
  },
  {
    file: 'pages/StudentHome/components/AITutorPage.jsx',
    replacements: [
      {
        pattern: /const API_BASE_URL = 'http:\/\/localhost:3000\/api';/g,
        replacement: `import { API_CONFIG } from '../../../config/api.config';\nconst API_BASE_URL = API_CONFIG.BASE_URL + '/api';`
      }
    ]
  }
];

function updateFile(filePath, replacements) {
  const fullPath = path.join(srcDir, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let updated = false;
  
  replacements.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      updated = true;
    }
  });
  
  if (updated) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  }
}

console.log('Starting API URL updates...\n');

filesToUpdate.forEach(({ file, replacements }) => {
  updateFile(file, replacements);
});

console.log('\n✅ Update complete!');
