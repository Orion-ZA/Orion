#!/usr/bin/env node

/**
 * Semantic HTML Checker for Orion Project
 *
 * This script analyzes React components and HTML files to identify
 * non-semantic HTML usage and suggests improvements.
 *
 * Usage: node semantic-html-checker.js [options]
 * Options:
 *   --path <path>     Specific file or directory to check (default: src/)
 *   --file <file>     Check specific file and its test file
 *   --html-only       Only check HTML files
 *   --jsx-only        Only check JSX/React files
 *   --verbose         Show detailed analysis
 *   --fix-suggestions Show specific fix suggestions
 */

const fs = require('fs');
const path = require('path');

// Semantic HTML elements and their purposes
const SEMANTIC_ELEMENTS = {
  // Document structure
  header: 'Page or section header',
  nav: 'Navigation links',
  main: 'Main content area',
  aside: 'Sidebar content',
  footer: 'Page or section footer',

  // Content sections
  section: 'Thematic grouping of content',
  article: 'Self-contained content',
  h1: 'Main heading',
  h2: 'Section heading',
  h3: 'Subsection heading',
  h4: 'Sub-subsection heading',
  h5: 'Minor heading',
  h6: 'Smallest heading',

  // Text content
  p: 'Paragraph',
  blockquote: 'Quoted content',
  cite: 'Citation',
  time: 'Date/time',
  mark: 'Highlighted text',
  small: 'Small print',
  strong: 'Important text',
  em: 'Emphasized text',

  // Lists
  ul: 'Unordered list',
  ol: 'Ordered list',
  li: 'List item',
  dl: 'Description list',
  dt: 'Description term',
  dd: 'Description definition',

  // Interactive elements
  button: 'Interactive button',
  a: 'Link',
  form: 'Form container',
  input: 'Form input',
  textarea: 'Multi-line text input',
  select: 'Dropdown selection',
  option: 'Dropdown option',
  label: 'Form label',
  fieldset: 'Form field grouping',
  legend: 'Fieldset caption',

  // Media
  img: 'Image',
  figure: 'Figure container',
  figcaption: 'Figure caption',
  video: 'Video content',
  audio: 'Audio content',
  source: 'Media source',

  // Tables
  table: 'Data table',
  thead: 'Table header',
  tbody: 'Table body',
  tfoot: 'Table footer',
  tr: 'Table row',
  th: 'Table header cell',
  td: 'Table data cell',
  caption: 'Table caption',

  // Other semantic elements
  address: 'Contact information',
  details: 'Disclosure widget',
  summary: 'Details summary',
  dialog: 'Dialog box',
  menu: 'Menu list',
  menuitem: 'Menu item',
};

// Non-semantic elements that should be avoided when semantic alternatives exist
const NON_SEMANTIC_ELEMENTS = {
  div: 'Generic container - consider semantic alternatives',
  span: 'Generic inline container - consider semantic alternatives',
};

// Common patterns that indicate non-semantic usage
const NON_SEMANTIC_PATTERNS = [
  {
    pattern: /<div[^>]*class="[^"]*(?:header|nav|menu)[^"]*"[^>]*>/gi,
    message: 'Consider using <header> or <nav> instead of <div> for navigation/header content',
    suggestion: 'Replace <div class="header"> with <header> or <div class="nav"> with <nav>',
  },
  {
    pattern: /<div[^>]*class="[^"]*(?:main|content)[^"]*"[^>]*>/gi,
    message: 'Consider using <main> instead of <div> for main content',
    suggestion: 'Replace <div class="main"> with <main>',
  },
  {
    pattern: /<div[^>]*class="[^"]*(?:footer|bottom)[^"]*"[^>]*>/gi,
    message: 'Consider using <footer> instead of <div> for footer content',
    suggestion: 'Replace <div class="footer"> with <footer>',
  },
  {
    pattern: /<div[^>]*class="[^"]*(?:section|article)[^"]*"[^>]*>/gi,
    message: 'Consider using <section> or <article> instead of <div> for content sections',
    suggestion:
      'Replace <div class="section"> with <section> or <div class="article"> with <article>',
  },
  {
    pattern: /<div[^>]*class="[^"]*(?:button|btn)[^"]*"[^>]*>/gi,
    message: 'Consider using <button> instead of <div> for interactive elements',
    suggestion: 'Replace <div class="button"> with <button>',
  },
  {
    pattern: /<span[^>]*class="[^"]*(?:heading|title)[^"]*"[^>]*>/gi,
    message: 'Consider using heading elements (h1-h6) instead of <span> for headings',
    suggestion: 'Replace <span class="heading"> with appropriate <h1>-<h6> element',
  },
  {
    pattern: /<div[^>]*onClick[^>]*>/gi,
    message: 'Interactive <div> elements should use <button> for accessibility',
    suggestion: 'Replace <div onClick> with <button> and add appropriate ARIA attributes',
  },
  {
    pattern: /<span[^>]*onClick[^>]*>/gi,
    message: 'Interactive <span> elements should use <button> for accessibility',
    suggestion: 'Replace <span onClick> with <button> and add appropriate ARIA attributes',
  },
];

class SemanticHTMLChecker {
  constructor(options = {}) {
    this.options = {
      path: options.path || 'src/',
      file: options.file || null,
      htmlOnly: options.htmlOnly || false,
      jsxOnly: options.jsxOnly || false,
      verbose: options.verbose || false,
      fixSuggestions: options.fixSuggestions || false,
      ...options,
    };

    this.results = {
      filesChecked: 0,
      issuesFound: 0,
      semanticElementsUsed: new Set(),
      nonSemanticElementsUsed: new Set(),
      issues: [],
      fileStats: new Map(), // Track div/span usage per file
    };
  }

  // Check if file should be analyzed
  shouldCheckFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    if (this.options.htmlOnly && ext !== '.html') return false;
    if (this.options.jsxOnly && !['.js', '.jsx'].includes(ext)) return false;

    return ['.html', '.js', '.jsx'].includes(ext);
  }

  // Extract JSX/HTML content from React files
  extractJSXContent(content) {
    // Remove comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    content = content.replace(/\/\/.*$/gm, '');

    // Extract JSX return statements
    const jsxMatches = content.match(/return\s*\([\s\S]*?\)/g);
    if (jsxMatches) {
      return jsxMatches.join('\n');
    }

    // Extract JSX fragments
    const fragmentMatches = content.match(/<>[\s\S]*?<\/>/g);
    if (fragmentMatches) {
      return fragmentMatches.join('\n');
    }

    return content;
  }

  // Analyze file content for semantic HTML issues
  analyzeFile(filePath, content) {
    const issues = [];
    const lines = content.split('\n');

    // Initialize file stats
    const fileStats = {
      divCount: 0,
      spanCount: 0,
      totalElements: 0,
      semanticElements: new Set(),
      nonSemanticElements: new Set(),
    };

    // Extract JSX content if it's a React file
    if (path.extname(filePath).match(/\.(js|jsx)$/)) {
      content = this.extractJSXContent(content);
    }

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Count all HTML elements in the line
      const allElements = line.match(/<\/?[a-zA-Z][a-zA-Z0-9]*[^>]*>/g) || [];
      fileStats.totalElements += allElements.length;

      // Check for semantic elements usage
      Object.keys(SEMANTIC_ELEMENTS).forEach(element => {
        const regex = new RegExp(`<${element}[^>]*>`, 'gi');
        const matches = line.match(regex);
        if (matches) {
          this.results.semanticElementsUsed.add(element);
          fileStats.semanticElements.add(element);
        }
      });

      // Check for non-semantic elements usage
      Object.keys(NON_SEMANTIC_ELEMENTS).forEach(element => {
        const regex = new RegExp(`<${element}[^>]*>`, 'gi');
        const matches = line.match(regex);
        if (matches) {
          this.results.nonSemanticElementsUsed.add(element);
          fileStats.nonSemanticElements.add(element);

          // Count divs and spans specifically
          if (element === 'div') {
            fileStats.divCount += matches.length;
          } else if (element === 'span') {
            fileStats.spanCount += matches.length;
          }
        }
      });

      // Check for non-semantic patterns
      NON_SEMANTIC_PATTERNS.forEach(({ pattern, message, suggestion }) => {
        if (pattern.test(line)) {
          issues.push({
            file: filePath,
            line: lineNumber,
            content: line.trim(),
            message,
            suggestion: this.options.fixSuggestions ? suggestion : undefined,
            severity: 'warning',
          });
        }
      });

      // Check for missing alt attributes on images
      const imgRegex = /<img[^>]*(?!alt=)[^>]*>/gi;
      if (imgRegex.test(line)) {
        issues.push({
          file: filePath,
          line: lineNumber,
          content: line.trim(),
          message: 'Image missing alt attribute for accessibility',
          suggestion: this.options.fixSuggestions
            ? 'Add alt="descriptive text" to <img> tag'
            : undefined,
          severity: 'error',
        });
      }

      // Check for missing form labels
      const inputRegex = /<input[^>]*(?!aria-label)[^>]*(?!id=)[^>]*>/gi;
      if (inputRegex.test(line) && !line.includes('type="hidden"')) {
        issues.push({
          file: filePath,
          line: lineNumber,
          content: line.trim(),
          message: 'Input missing label or aria-label for accessibility',
          suggestion: this.options.fixSuggestions
            ? 'Add aria-label="descriptive text" or wrap with <label>'
            : undefined,
          severity: 'warning',
        });
      }

      // Check for heading hierarchy issues
      const headingRegex = /<h([1-6])[^>]*>/gi;
      const headingMatch = line.match(headingRegex);
      if (headingMatch) {
        const level = parseInt(headingMatch[0].match(/<h([1-6])/)[1]);
        // This is a simplified check - in a real implementation, you'd track heading hierarchy
        if (level > 1 && !this.hasPreviousHeading(level - 1, lines.slice(0, index))) {
          issues.push({
            file: filePath,
            line: lineNumber,
            content: line.trim(),
            message: `Heading h${level} may skip heading levels`,
            suggestion: this.options.fixSuggestions
              ? 'Ensure proper heading hierarchy (h1 -> h2 -> h3, etc.)'
              : undefined,
            severity: 'warning',
          });
        }
      }
    });

    // Store file stats
    this.results.fileStats.set(filePath, fileStats);

    return issues;
  }

  // Helper method to check for previous heading levels
  hasPreviousHeading(targetLevel, previousLines) {
    const headingRegex = new RegExp(`<h([1-${targetLevel}])[^>]*>`, 'gi');
    return previousLines.some(line => headingRegex.test(line));
  }

  // Recursively scan directory for files
  scanDirectory(dirPath) {
    const files = [];

    try {
      const items = fs.readdirSync(dirPath);

      items.forEach(item => {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip node_modules and other common directories
          if (!['node_modules', '.git', 'build', 'coverage'].includes(item)) {
            files.push(...this.scanDirectory(fullPath));
          }
        } else if (this.shouldCheckFile(fullPath)) {
          files.push(fullPath);
        }
      });
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error.message);
    }

    return files;
  }

  // Find test file for a given component file
  findTestFile(componentPath) {
    const ext = path.extname(componentPath);
    const baseName = path.basename(componentPath, ext);
    const dirName = path.dirname(componentPath);

    // Common test file patterns
    const testPatterns = [
      `${baseName}.test${ext}`,
      `${baseName}.spec${ext}`,
      `${baseName}.test.js`,
      `${baseName}.spec.js`,
    ];

    // Look in the same directory first
    for (const pattern of testPatterns) {
      const testPath = path.join(dirName, pattern);
      if (fs.existsSync(testPath)) {
        return testPath;
      }
    }

    // Look in __tests__ directory
    const testsDir = path.join(dirName, '__tests__');
    if (fs.existsSync(testsDir)) {
      for (const pattern of testPatterns) {
        const testPath = path.join(testsDir, pattern);
        if (fs.existsSync(testPath)) {
          return testPath;
        }
      }
    }

    // Look in parent __tests__ directory
    const parentTestsDir = path.join(path.dirname(dirName), '__tests__');
    if (fs.existsSync(parentTestsDir)) {
      for (const pattern of testPatterns) {
        const testPath = path.join(parentTestsDir, pattern);
        if (fs.existsSync(testPath)) {
          return testPath;
        }
      }
    }

    return null;
  }

  // Main analysis method
  async analyze() {
    console.log('🔍 Starting Semantic HTML Analysis...\n');

    let filesToCheck = [];

    // Handle single file analysis
    if (this.options.file) {
      const componentFile = this.options.file;

      // Check if the file exists
      if (!fs.existsSync(componentFile)) {
        console.error(`❌ File not found: ${componentFile}`);
        process.exit(1);
      }

      filesToCheck.push(componentFile);

      // Find and add test file
      const testFile = this.findTestFile(componentFile);
      if (testFile) {
        filesToCheck.push(testFile);
        console.log(`📄 Found test file: ${testFile}`);
      } else {
        console.log(`⚠️  No test file found for: ${componentFile}`);
      }

      console.log(`\n🎯 Analyzing: ${componentFile}${testFile ? ` and its test file` : ''}\n`);
    } else {
      // Handle directory or path analysis
      if (fs.statSync(this.options.path).isDirectory()) {
        filesToCheck = this.scanDirectory(this.options.path);
      } else {
        filesToCheck = [this.options.path];
      }
    }

    console.log(`📁 Found ${filesToCheck.length} files to analyze\n`);

    filesToCheck.forEach(filePath => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const issues = this.analyzeFile(filePath, content);

        this.results.filesChecked++;
        this.results.issuesFound += issues.length;
        this.results.issues.push(...issues);

        if (this.options.verbose && issues.length > 0) {
          console.log(`📄 ${filePath}: ${issues.length} issues found`);
        }
      } catch (error) {
        console.error(`❌ Error reading file ${filePath}:`, error.message);
      }
    });

    this.generateReport();
  }

  // Generate and display the analysis report
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SEMANTIC HTML ANALYSIS REPORT');
    console.log('='.repeat(60));

    console.log(`\n📈 SUMMARY:`);
    console.log(`   Files analyzed: ${this.results.filesChecked}`);
    console.log(`   Issues found: ${this.results.issuesFound}`);
    console.log(`   Semantic elements used: ${this.results.semanticElementsUsed.size}`);
    console.log(`   Non-semantic elements used: ${this.results.nonSemanticElementsUsed.size}`);

    if (this.results.semanticElementsUsed.size > 0) {
      console.log(`\n✅ SEMANTIC ELEMENTS FOUND:`);
      Array.from(this.results.semanticElementsUsed)
        .sort()
        .forEach(element => {
          console.log(`   <${element}> - ${SEMANTIC_ELEMENTS[element]}`);
        });
    }

    if (this.results.nonSemanticElementsUsed.size > 0) {
      console.log(`\n⚠️  NON-SEMANTIC ELEMENTS FOUND:`);
      Array.from(this.results.nonSemanticElementsUsed)
        .sort()
        .forEach(element => {
          console.log(`   <${element}> - ${NON_SEMANTIC_ELEMENTS[element]}`);
        });
    }

    // Show div/span usage per file
    if (this.results.fileStats.size > 0) {
      console.log(`\n📊 DIV/SPAN USAGE BY FILE:`);

      // Sort files by total div+span count (descending)
      const sortedFiles = Array.from(this.results.fileStats.entries()).sort(
        ([, a], [, b]) => b.divCount + b.spanCount - (a.divCount + a.spanCount)
      );

      sortedFiles.forEach(([filePath, stats]) => {
        const totalNonSemantic = stats.divCount + stats.spanCount;
        const semanticCount = stats.semanticElements.size;
        const nonSemanticCount = stats.nonSemanticElements.size;

        if (totalNonSemantic > 0) {
          console.log(`\n📄 ${filePath}:`);
          console.log(`   <div>: ${stats.divCount} instances`);
          console.log(`   <span>: ${stats.spanCount} instances`);
          console.log(`   Total non-semantic elements: ${totalNonSemantic}`);
          console.log(`   Semantic elements used: ${semanticCount}`);
          console.log(`   Non-semantic elements used: ${nonSemanticCount}`);

          // Calculate semantic ratio
          const totalElements = stats.totalElements;
          if (totalElements > 0) {
            const semanticRatio = (
              ((totalElements - totalNonSemantic) / totalElements) *
              100
            ).toFixed(1);
            console.log(`   Semantic ratio: ${semanticRatio}%`);
          }
        }
      });
    }

    if (this.results.issues.length > 0) {
      console.log(`\n🚨 ISSUES BY FILE:`);

      const issuesByFile = this.results.issues.reduce((acc, issue) => {
        if (!acc[issue.file]) acc[issue.file] = [];
        acc[issue.file].push(issue);
        return acc;
      }, {});

      Object.entries(issuesByFile).forEach(([file, issues]) => {
        console.log(`\n📄 ${file}:`);
        issues.forEach(issue => {
          const severity = issue.severity === 'error' ? '❌' : '⚠️';
          console.log(`   ${severity} Line ${issue.line}: ${issue.message}`);
          if (this.options.fixSuggestions && issue.suggestion) {
            console.log(`      💡 Suggestion: ${issue.suggestion}`);
          }
          if (this.options.verbose) {
            console.log(`      📝 Code: ${issue.content}`);
          }
        });
      });
    }

    // Generate recommendations
    this.generateRecommendations();

    // Show top files needing attention
    this.showTopFilesNeedingAttention();

    console.log('\n' + '='.repeat(60));
    console.log('✨ Analysis complete!');
    console.log('='.repeat(60));
  }

  // Generate specific recommendations
  generateRecommendations() {
    console.log(`\n💡 RECOMMENDATIONS:`);

    const recommendations = [];

    // Check for common non-semantic patterns
    const divCount = this.results.issues.filter(
      issue =>
        issue.content.includes('<div') &&
        (issue.content.includes('class="header') ||
          issue.content.includes('class="nav') ||
          issue.content.includes('class="main') ||
          issue.content.includes('class="footer'))
    ).length;

    if (divCount > 0) {
      recommendations.push(
        `Replace ${divCount} non-semantic <div> elements with semantic alternatives (header, nav, main, footer)`
      );
    }

    const buttonCount = this.results.issues.filter(
      issue =>
        issue.content.includes('onClick') &&
        (issue.content.includes('<div') || issue.content.includes('<span'))
    ).length;

    if (buttonCount > 0) {
      recommendations.push(
        `Replace ${buttonCount} interactive <div>/<span> elements with <button> for better accessibility`
      );
    }

    const headingCount = this.results.issues.filter(issue =>
      issue.message.includes('heading')
    ).length;

    if (headingCount > 0) {
      recommendations.push(
        `Fix ${headingCount} heading hierarchy issues for better document structure`
      );
    }

    const accessibilityCount = this.results.issues.filter(
      issue => issue.severity === 'error'
    ).length;

    if (accessibilityCount > 0) {
      recommendations.push(
        `Fix ${accessibilityCount} accessibility issues (missing alt attributes, labels)`
      );
    }

    if (recommendations.length === 0) {
      console.log('   🎉 Great job! No major semantic HTML issues found.');
    } else {
      recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    // Semantic HTML best practices
    console.log(`\n📚 SEMANTIC HTML BEST PRACTICES:`);
    console.log(`   • Use <header> for page/section headers`);
    console.log(`   • Use <nav> for navigation menus`);
    console.log(`   • Use <main> for main content area`);
    console.log(`   • Use <section> for thematic content groups`);
    console.log(`   • Use <article> for self-contained content`);
    console.log(`   • Use <aside> for sidebar content`);
    console.log(`   • Use <footer> for page/section footers`);
    console.log(`   • Use proper heading hierarchy (h1 → h2 → h3)`);
    console.log(`   • Use <button> for interactive elements`);
    console.log(`   • Add alt attributes to all images`);
    console.log(`   • Use <label> or aria-label for form inputs`);
  }

  // Show files that need the most attention for semantic HTML improvements
  showTopFilesNeedingAttention() {
    if (this.results.fileStats.size === 0) return;

    console.log(`\n🎯 TOP FILES NEEDING SEMANTIC HTML ATTENTION:`);

    // Sort files by div+span count and show top 5
    const sortedFiles = Array.from(this.results.fileStats.entries())
      .filter(([, stats]) => stats.divCount + stats.spanCount > 0)
      .sort(([, a], [, b]) => b.divCount + b.spanCount - (a.divCount + a.spanCount))
      .slice(0, 5);

    if (sortedFiles.length === 0) {
      console.log('   🎉 No files with excessive div/span usage found!');
      return;
    }

    sortedFiles.forEach(([filePath, stats], index) => {
      const totalNonSemantic = stats.divCount + stats.spanCount;
      const priority = index < 2 ? '🔴 HIGH' : index < 4 ? '🟡 MEDIUM' : '🟢 LOW';

      console.log(`\n   ${index + 1}. ${priority} PRIORITY: ${filePath}`);
      console.log(
        `      <div>: ${stats.divCount} | <span>: ${stats.spanCount} | Total: ${totalNonSemantic}`
      );

      // Suggest specific improvements
      if (stats.divCount > stats.spanCount) {
        console.log(`      💡 Focus on replacing <div> elements with semantic alternatives`);
      } else {
        console.log(`      💡 Focus on replacing <span> elements with semantic alternatives`);
      }
    });

    console.log(`\n   📝 Tip: Start with HIGH priority files for maximum impact!`);
  }
}

// CLI interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    path: 'src/',
    file: null,
    htmlOnly: false,
    jsxOnly: false,
    verbose: false,
    fixSuggestions: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--path':
        options.path = args[++i];
        break;
      case '--file':
        options.file = args[++i];
        break;
      case '--html-only':
        options.htmlOnly = true;
        break;
      case '--jsx-only':
        options.jsxOnly = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--fix-suggestions':
        options.fixSuggestions = true;
        break;
      case '--help':
        console.log(`
Semantic HTML Checker for Orion Project

Usage: node semantic-html-checker.js [options]

Options:
  --path <path>         Specific file or directory to check (default: src/)
  --file <file>         Check specific file and its test file
  --html-only          Only check HTML files
  --jsx-only           Only check JSX/React files
  --verbose            Show detailed analysis
  --fix-suggestions    Show specific fix suggestions
  --help               Show this help message

Examples:
  node semantic-html-checker.js
  node semantic-html-checker.js --path src/components
  node semantic-html-checker.js --file src/components/Button.js
  node semantic-html-checker.js --verbose --fix-suggestions
  node semantic-html-checker.js --jsx-only
        `);
        process.exit(0);
        break;
    }
  }

  return options;
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  const checker = new SemanticHTMLChecker(options);
  checker.analyze().catch(console.error);
}

module.exports = SemanticHTMLChecker;
