#!/usr/bin/env node

/**
 * SuperClaude Deployment Script
 * Processes CLAUDE.md and expands all @include references
 * Creates a fully-expanded configuration file
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Configuration
const SUPERCLAUDE_DIR = path.join(__dirname);
const SOURCE_CLAUDE_MD = path.join(SUPERCLAUDE_DIR, 'CLAUDE.md');
const OUTPUT_CLAUDE_MD = path.join(path.dirname(SUPERCLAUDE_DIR), 'CLAUDE_EXPANDED.md');
const BACKUP_CLAUDE_MD = path.join(path.dirname(SUPERCLAUDE_DIR), 'CLAUDE_ORIGINAL.md');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(title, colors.bright + colors.cyan);
  log('='.repeat(60), colors.cyan);
}

/**
 * Parse @include directive
 * Format: @include path/to/file.yml#Section_Name
 */
function parseInclude(line) {
  const match = line.match(/@include\s+([^#]+)#(.+)/);
  if (!match) return null;
  
  return {
    file: match[1].trim(),
    section: match[2].trim()
  };
}

/**
 * Load YAML file and extract specific section
 */
function loadYamlSection(filePath, sectionName) {
  try {
    const fullPath = path.join(SUPERCLAUDE_DIR, filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const data = yaml.load(content);
    
    // Navigate to the section
    const parts = sectionName.split('.');
    let current = data;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        log(`Warning: Section '${sectionName}' not found in ${filePath}`, colors.yellow);
        return null;
      }
    }
    
    return current;
  } catch (error) {
    log(`Error loading ${filePath}: ${error.message}`, colors.red);
    return null;
  }
}

/**
 * Format YAML section as markdown
 */
function formatYamlAsMarkdown(data, indent = '') {
  if (typeof data === 'string') {
    return indent + data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => {
      if (typeof item === 'string') {
        return `${indent}- ${item}`;
      }
      return formatYamlAsMarkdown(item, indent + '  ');
    }).join('\n');
  }
  
  if (typeof data === 'object' && data !== null) {
    const lines = [];
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        lines.push(`${indent}**${key}**: ${value}`);
      } else if (Array.isArray(value)) {
        lines.push(`${indent}**${key}**:`);
        lines.push(formatYamlAsMarkdown(value, indent + '  '));
      } else if (typeof value === 'object') {
        lines.push(`${indent}**${key}**:`);
        lines.push(formatYamlAsMarkdown(value, indent + '  '));
      }
    }
    return lines.join('\n');
  }
  
  return String(data);
}

/**
 * Process CLAUDE.md and expand all includes
 */
function processClaudeMd() {
  logSection('SuperClaude Deployment Script');
  
  // Check if source file exists
  if (!fs.existsSync(SOURCE_CLAUDE_MD)) {
    log(`Error: Source file not found: ${SOURCE_CLAUDE_MD}`, colors.red);
    process.exit(1);
  }
  
  log(`Reading source: ${SOURCE_CLAUDE_MD}`, colors.green);
  const content = fs.readFileSync(SOURCE_CLAUDE_MD, 'utf8');
  const lines = content.split('\n');
  const outputLines = [];
  
  let includeCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const include = parseInclude(line);
    
    if (include) {
      includeCount++;
      log(`\nProcessing include #${includeCount}: ${include.file}#${include.section}`, colors.yellow);
      
      const sectionData = loadYamlSection(include.file, include.section);
      
      if (sectionData) {
        // Add comment about the original include
        outputLines.push(`<!-- Expanded from: ${line} -->`);
        outputLines.push('');
        
        // Format and add the content
        const formatted = formatYamlAsMarkdown(sectionData);
        outputLines.push(formatted);
        outputLines.push('');
      } else {
        errorCount++;
        outputLines.push(`<!-- ERROR: Could not expand ${line} -->`);
        outputLines.push(line); // Keep original line
      }
    } else {
      outputLines.push(line);
    }
  }
  
  // Create backup of original CLAUDE.md if it exists
  const projectClaudeMd = path.join(path.dirname(path.dirname(SUPERCLAUDE_DIR)), 'CLAUDE.md');
  if (fs.existsSync(projectClaudeMd)) {
    log(`\nBacking up original CLAUDE.md to ${BACKUP_CLAUDE_MD}`, colors.yellow);
    fs.copyFileSync(projectClaudeMd, BACKUP_CLAUDE_MD);
  }
  
  // Write expanded file
  const expandedContent = outputLines.join('\n');
  fs.writeFileSync(OUTPUT_CLAUDE_MD, expandedContent);
  
  logSection('Deployment Summary');
  log(`✅ Processed ${includeCount} includes`, colors.green);
  if (errorCount > 0) {
    log(`⚠️  ${errorCount} errors encountered`, colors.yellow);
  }
  log(`📄 Output written to: ${OUTPUT_CLAUDE_MD}`, colors.green);
  
  // Show next steps
  logSection('Next Steps');
  log('1. Review the expanded configuration:', colors.cyan);
  log(`   cat "${OUTPUT_CLAUDE_MD}"`, colors.bright);
  log('\n2. Integrate with your project CLAUDE.md:', colors.cyan);
  log(`   cp "${OUTPUT_CLAUDE_MD}" "${projectClaudeMd}"`, colors.bright);
  log('\n3. Activate Flow State Development:', colors.cyan);
  log('   "Please review my CLAUDE_PERSONAL_PROFILE.md and enter flow state"', colors.bright);
  
  return { includeCount, errorCount };
}

/**
 * Install dependencies if needed
 */
function checkDependencies() {
  try {
    require('js-yaml');
  } catch (error) {
    log('Installing required dependency: js-yaml', colors.yellow);
    const { execSync } = require('child_process');
    execSync('npm install js-yaml', { stdio: 'inherit' });
  }
}

// Main execution
if (require.main === module) {
  checkDependencies();
  
  try {
    const result = processClaudeMd();
    process.exit(result.errorCount > 0 ? 1 : 0);
  } catch (error) {
    log(`\nFatal error: ${error.message}`, colors.red);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { processClaudeMd, parseInclude, loadYamlSection };