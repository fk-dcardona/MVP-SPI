// scripts/audit-doc-references.js
const fs = require('fs');
const path = require('path');

const DOC_PATTERNS = [
  /CLAUDE\.md/gi,
  /README\.production\.md/gi,
  /DEPLOYMENT_CHECKLIST\.md/gi,
  /LOCAL_TESTING_GUIDE\.md/gi,
  /COMPREHENSIVE_TESTING_CHECKLIST\.md/gi,
  /COMPREHENSIVE_TEST_REPORT\.md/gi,
  /PHASE_4_5_CHECKLIST\.md/gi,
  /PHASE-4-OPTIMIZATION-STRATEGY\.md/gi,
  /DEPLOYMENT_STATUS\.md/gi,
  /TEST_PROMPTS\.md/gi,
  /Cursor One Shot Prompt/gi,
  /DEVELOPMENT_PLAN\.md/gi
];

const EXCLUDE_DIRS = ['node_modules', '.next', '.git', 'test-data', 'archive', 'logs', '.swc', '.cursor/logs'];

function scanDir(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDE_DIRS.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath, results);
    } else {
      const content = fs.readFileSync(fullPath, 'utf8');
      DOC_PATTERNS.forEach((pattern) => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          results.push({
            file: fullPath,
            line: content.substr(0, match.index).split('\n').length,
            match: match[0]
          });
        }
      });
    }
  }
  return results;
}

function main() {
  const root = process.cwd();
  const results = scanDir(root);
  if (results.length === 0) {
    console.log('✅ No documentation/config references found outside /docs or correct locations.');
    return;
  }
  console.log('🔎 Documentation/Config Reference Audit Results:');
  results.forEach(r => {
    console.log(`- ${r.file}:${r.line}  [${r.match}]`);
  });
  console.log(`\nTotal references found: ${results.length}`);
}

main(); 