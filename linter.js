#!/usr/bin/env node

/**
 * Comprehensive Linter for Orion Project
 *
 * This script performs multiple types of code analysis:
 * - Semantic HTML analysis
 * - Accessibility checks
 * - Code quality metrics
 * - Performance suggestions
 * - Security best practices
 *
 * Usage: node linter.js [options]
 * Options:
 *   --path <path>     Specific file or directory to check (default: src/)
 *   --file <file>     Check specific file and its test file
 *   --html-only       Only check HTML/semantic issues
 *   --accessibility   Only check accessibility issues
 *   --performance     Only check performance issues
 *   --security        Only check security issues
 *   --verbose         Show detailed analysis
 *   --fix-suggestions Show specific fix suggestions
 *   --format <format> Output format: console, json, html (default: console)
 */

const fs = require('fs');
const path = require('path');

// Import the semantic HTML checker
const SemanticHTMLChecker = require('./semantic-html-checker.js');

class ComprehensiveLinter {
  constructor(options = {}) {
    this.options = {
      path: options.path || 'src/',
      file: options.file || null,
      htmlOnly: options.htmlOnly || false,
      accessibility: options.accessibility || false,
      performance: options.performance || false,
      security: options.security || false,
      verbose: options.verbose || false,
      fixSuggestions: options.fixSuggestions || false,
      format: options.format || 'console',
      ...options,
    };

    this.results = {
      semanticHTML: null,
      accessibility: [],
      performance: [],
      security: [],
      codeQuality: [],
      filesChecked: 0,
      totalIssues: 0,
      summary: {
        errors: 0,
        warnings: 0,
        suggestions: 0,
      },
    };
  }

  // Accessibility checks
  checkAccessibility(filePath, content) {
    const issues = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Missing alt attributes
      if (/<img[^>]*(?!alt=)[^>]*>/gi.test(line)) {
        issues.push({
          type: 'accessibility',
          severity: 'error',
          file: filePath,
          line: lineNumber,
          message: 'Image missing alt attribute',
          suggestion: 'Add descriptive alt text for screen readers',
          code: line.trim(),
        });
      }

      // Missing form labels
      if (
        /<input[^>]*(?!aria-label)[^>]*(?!id=)[^>]*>/gi.test(line) &&
        !line.includes('type="hidden"') &&
        !line.includes('aria-label')
      ) {
        issues.push({
          type: 'accessibility',
          severity: 'warning',
          file: filePath,
          line: lineNumber,
          message: 'Input missing label or aria-label',
          suggestion: 'Add aria-label or wrap with <label> element',
          code: line.trim(),
        });
      }

      // Interactive elements without proper roles
      if (/<div[^>]*onClick[^>]*>/gi.test(line) || /<span[^>]*onClick[^>]*>/gi.test(line)) {
        issues.push({
          type: 'accessibility',
          severity: 'warning',
          file: filePath,
          line: lineNumber,
          message: 'Interactive element should use semantic HTML',
          suggestion: 'Replace with <button> or add role="button" and tabindex',
          code: line.trim(),
        });
      }

      // Missing heading hierarchy
      const headingMatch = line.match(/<h([1-6])[^>]*>/gi);
      if (headingMatch) {
        const level = parseInt(headingMatch[0].match(/<h([1-6])/)[1]);
        if (level > 1 && !this.hasPreviousHeading(level - 1, lines.slice(0, index))) {
          issues.push({
            type: 'accessibility',
            severity: 'warning',
            file: filePath,
            line: lineNumber,
            message: `Heading h${level} may skip heading levels`,
            suggestion: 'Ensure proper heading hierarchy (h1 → h2 → h3)',
            code: line.trim(),
          });
        }
      }

      // Color contrast issues (basic check)
      if (
        /color:\s*#[0-9a-fA-F]{3,6}/gi.test(line) &&
        !line.includes('background') &&
        !line.includes('background-color')
      ) {
        issues.push({
          type: 'accessibility',
          severity: 'suggestion',
          file: filePath,
          line: lineNumber,
          message: 'Consider color contrast for accessibility',
          suggestion: 'Ensure sufficient contrast ratio (4.5:1 for normal text)',
          code: line.trim(),
        });
      }
    });

    return issues;
  }

  // Performance checks
  checkPerformance(filePath, content) {
    const issues = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Large images without lazy loading
      if (
        /<img[^>]*(?!loading=)[^>]*>/gi.test(line) &&
        !line.includes('loading=') &&
        !line.includes('hero') &&
        !line.includes('above-fold')
      ) {
        issues.push({
          type: 'performance',
          severity: 'suggestion',
          file: filePath,
          line: lineNumber,
          message: 'Consider lazy loading for images',
          suggestion: 'Add loading="lazy" to images below the fold',
          code: line.trim(),
        });
      }

      // Inline styles that could be CSS classes
      if (/style=\{[^}]*\}/gi.test(line) && line.length > 100) {
        issues.push({
          type: 'performance',
          severity: 'suggestion',
          file: filePath,
          line: lineNumber,
          message: 'Large inline styles may impact performance',
          suggestion: 'Consider moving complex styles to CSS classes',
          code: line.trim(),
        });
      }

      // Missing key props in lists
      if (/\.map\([^)]*=>/gi.test(line) && !line.includes('key=')) {
        issues.push({
          type: 'performance',
          severity: 'warning',
          file: filePath,
          line: lineNumber,
          message: 'Missing key prop in list rendering',
          suggestion: 'Add unique key prop to list items for React optimization',
          code: line.trim(),
        });
      }

      // Potential memory leaks
      if (/addEventListener/gi.test(line) && !line.includes('removeEventListener')) {
        issues.push({
          type: 'performance',
          severity: 'warning',
          file: filePath,
          line: lineNumber,
          message: 'Event listener may cause memory leaks',
          suggestion: 'Ensure event listeners are properly cleaned up',
          code: line.trim(),
        });
      }
    });

    return issues;
  }

  // Security checks
  checkSecurity(filePath, content) {
    const issues = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Dangerous HTML injection patterns
      if (/dangerouslySetInnerHTML/gi.test(line)) {
        issues.push({
          type: 'security',
          severity: 'error',
          file: filePath,
          line: lineNumber,
          message: 'dangerouslySetInnerHTML can lead to XSS attacks',
          suggestion: 'Sanitize content or use safer alternatives',
          code: line.trim(),
        });
      }

      // Hardcoded secrets or sensitive data
      if (/(password|secret|key|token)\s*[:=]\s*['"][^'"]{8,}['"]/gi.test(line)) {
        issues.push({
          type: 'security',
          severity: 'error',
          file: filePath,
          line: lineNumber,
          message: 'Potential hardcoded secret detected',
          suggestion: 'Use environment variables for sensitive data',
          code: line.trim(),
        });
      }

      // Unsafe URL construction
      if (/window\.location/gi.test(line) && !line.includes('origin')) {
        issues.push({
          type: 'security',
          severity: 'warning',
          file: filePath,
          line: lineNumber,
          message: 'Direct window.location usage may be unsafe',
          suggestion: 'Validate URLs before navigation',
          code: line.trim(),
        });
      }

      // Missing CSRF protection
      if (/fetch\(/gi.test(line) && !line.includes('credentials') && !line.includes('csrf')) {
        issues.push({
          type: 'security',
          severity: 'suggestion',
          file: filePath,
          line: lineNumber,
          message: 'Consider CSRF protection for API calls',
          suggestion: 'Add CSRF tokens or proper credentials handling',
          code: line.trim(),
        });
      }
    });

    return issues;
  }

  // Code quality checks
  checkCodeQuality(filePath, content) {
    const issues = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Console statements in production code
      if (
        /console\.(log|warn|error|debug)/gi.test(line) &&
        !filePath.includes('test') &&
        !filePath.includes('__tests__')
      ) {
        issues.push({
          type: 'codeQuality',
          severity: 'suggestion',
          file: filePath,
          line: lineNumber,
          message: 'Console statement in production code',
          suggestion: 'Remove or replace with proper logging',
          code: line.trim(),
        });
      }

      // TODO/FIXME comments
      if (/\/\/\s*(TODO|FIXME|HACK|XXX)/gi.test(line)) {
        issues.push({
          type: 'codeQuality',
          severity: 'suggestion',
          file: filePath,
          line: lineNumber,
          message: 'TODO/FIXME comment found',
          suggestion: 'Address technical debt items',
          code: line.trim(),
        });
      }

      // Long lines
      if (line.length > 120) {
        issues.push({
          type: 'codeQuality',
          severity: 'suggestion',
          file: filePath,
          line: lineNumber,
          message: 'Line exceeds recommended length',
          suggestion: 'Break long lines for better readability',
          code: line.trim(),
        });
      }

      // Missing PropTypes or TypeScript types
      if (
        /function\s+\w+\([^)]*\)/gi.test(line) &&
        !line.includes('PropTypes') &&
        !line.includes(':') &&
        filePath.endsWith('.js')
      ) {
        issues.push({
          type: 'codeQuality',
          severity: 'suggestion',
          file: filePath,
          line: lineNumber,
          message: 'Function missing type definitions',
          suggestion: 'Add PropTypes or consider migrating to TypeScript',
          code: line.trim(),
        });
      }
    });

    return issues;
  }

  // Helper method to check for previous heading levels
  hasPreviousHeading(targetLevel, previousLines) {
    const headingRegex = new RegExp(`<h([1-${targetLevel}])[^>]*>`, 'gi');
    return previousLines.some(line => headingRegex.test(line));
  }

  // Check if file should be analyzed
  shouldCheckFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ['.html', '.js', '.jsx', '.ts', '.tsx'].includes(ext);
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
    console.log('🔍 Starting Comprehensive Code Analysis...\n');

    let filesToCheck = [];

    // Handle single file analysis
    if (this.options.file) {
      const componentFile = this.options.file;

      if (!fs.existsSync(componentFile)) {
        console.error(`❌ File not found: ${componentFile}`);
        process.exit(1);
      }

      filesToCheck.push(componentFile);

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

    // Run semantic HTML analysis if requested
    if (!this.options.accessibility && !this.options.performance && !this.options.security) {
      const semanticChecker = new SemanticHTMLChecker({
        path: this.options.file ? this.options.file : this.options.path,
        file: this.options.file,
        verbose: this.options.verbose,
        fixSuggestions: this.options.fixSuggestions,
      });

      await semanticChecker.analyze();
      this.results.semanticHTML = semanticChecker.results;
    }

    // Analyze each file
    filesToCheck.forEach(filePath => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');

        this.results.filesChecked++;

        // Run different checks based on options
        if (this.options.accessibility || !this.options.htmlOnly) {
          const accessibilityIssues = this.checkAccessibility(filePath, content);
          this.results.accessibility.push(...accessibilityIssues);
        }

        if (this.options.performance || !this.options.htmlOnly) {
          const performanceIssues = this.checkPerformance(filePath, content);
          this.results.performance.push(...performanceIssues);
        }

        if (this.options.security || !this.options.htmlOnly) {
          const securityIssues = this.checkSecurity(filePath, content);
          this.results.security.push(...securityIssues);
        }

        if (!this.options.htmlOnly) {
          const codeQualityIssues = this.checkCodeQuality(filePath, content);
          this.results.codeQuality.push(...codeQualityIssues);
        }

        if (this.options.verbose) {
          const totalIssues =
            this.results.accessibility.length +
            this.results.performance.length +
            this.results.security.length +
            this.results.codeQuality.length;
          console.log(`📄 ${filePath}: ${totalIssues} issues found`);
        }
      } catch (error) {
        console.error(`❌ Error reading file ${filePath}:`, error.message);
      }
    });

    // Calculate totals
    this.results.totalIssues =
      this.results.accessibility.length +
      this.results.performance.length +
      this.results.security.length +
      this.results.codeQuality.length;

    // Count by severity
    const allIssues = [
      ...this.results.accessibility,
      ...this.results.performance,
      ...this.results.security,
      ...this.results.codeQuality,
    ];

    allIssues.forEach(issue => {
      if (issue.severity === 'error') this.results.summary.errors++;
      else if (issue.severity === 'warning') this.results.summary.warnings++;
      else if (issue.severity === 'suggestion') this.results.summary.suggestions++;
    });

    this.generateReport();
  }

  // Generate and display the analysis report
  generateReport() {
    if (this.options.format === 'json') {
      console.log(JSON.stringify(this.results, null, 2));
      return;
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE CODE ANALYSIS REPORT');
    console.log('='.repeat(80));

    console.log(`\n📈 SUMMARY:`);
    console.log(`   Files analyzed: ${this.results.filesChecked}`);
    console.log(`   Total issues: ${this.results.totalIssues}`);
    console.log(`   Errors: ${this.results.summary.errors}`);
    console.log(`   Warnings: ${this.results.summary.warnings}`);
    console.log(`   Suggestions: ${this.results.summary.suggestions}`);

    // Show issues by category
    if (this.results.accessibility.length > 0) {
      this.showIssuesByCategory('♿ ACCESSIBILITY ISSUES', this.results.accessibility);
    }

    if (this.results.performance.length > 0) {
      this.showIssuesByCategory('⚡ PERFORMANCE ISSUES', this.results.performance);
    }

    if (this.results.security.length > 0) {
      this.showIssuesByCategory('🔒 SECURITY ISSUES', this.results.security);
    }

    if (this.results.codeQuality.length > 0) {
      this.showIssuesByCategory('📝 CODE QUALITY ISSUES', this.results.codeQuality);
    }

    // Show semantic HTML results if available
    if (this.results.semanticHTML) {
      console.log(`\n🏗️  SEMANTIC HTML ANALYSIS:`);
      console.log(`   Files analyzed: ${this.results.semanticHTML.filesChecked}`);
      console.log(`   Issues found: ${this.results.semanticHTML.issuesFound}`);
      console.log(
        `   Semantic elements used: ${this.results.semanticHTML.semanticElementsUsed.size}`
      );
      console.log(
        `   Non-semantic elements used: ${this.results.semanticHTML.nonSemanticElementsUsed.size}`
      );
    }

    this.generateRecommendations();

    console.log('\n' + '='.repeat(80));
    console.log('✨ Analysis complete!');
    console.log('='.repeat(80));
  }

  // Show issues by category
  showIssuesByCategory(title, issues) {
    console.log(`\n${title}:`);

    const issuesByFile = issues.reduce((acc, issue) => {
      if (!acc[issue.file]) acc[issue.file] = [];
      acc[issue.file].push(issue);
      return acc;
    }, {});

    Object.entries(issuesByFile).forEach(([file, fileIssues]) => {
      console.log(`\n📄 ${file}:`);
      fileIssues.forEach(issue => {
        const severity =
          issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : '💡';
        console.log(`   ${severity} Line ${issue.line}: ${issue.message}`);
        if (this.options.fixSuggestions && issue.suggestion) {
          console.log(`      💡 Suggestion: ${issue.suggestion}`);
        }
        if (this.options.verbose) {
          console.log(`      📝 Code: ${issue.code}`);
        }
      });
    });
  }

  // Generate recommendations
  generateRecommendations() {
    console.log(`\n💡 TOP RECOMMENDATIONS:`);

    const recommendations = [];

    if (this.results.summary.errors > 0) {
      recommendations.push(`🔴 Fix ${this.results.summary.errors} critical errors first`);
    }

    if (this.results.summary.warnings > 0) {
      recommendations.push(
        `🟡 Address ${this.results.summary.warnings} warnings for better code quality`
      );
    }

    if (this.results.accessibility.length > 0) {
      recommendations.push(
        `♿ Improve accessibility: ${this.results.accessibility.length} issues found`
      );
    }

    if (this.results.performance.length > 0) {
      recommendations.push(
        `⚡ Optimize performance: ${this.results.performance.length} suggestions`
      );
    }

    if (this.results.security.length > 0) {
      recommendations.push(
        `🔒 Enhance security: ${this.results.security.length} issues to address`
      );
    }

    if (recommendations.length === 0) {
      console.log('   🎉 Great job! No major issues found.');
    } else {
      recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
  }
}

// CLI interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    path: 'src/',
    file: null,
    htmlOnly: false,
    accessibility: false,
    performance: false,
    security: false,
    verbose: false,
    fixSuggestions: false,
    format: 'console',
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
      case '--accessibility':
        options.accessibility = true;
        break;
      case '--performance':
        options.performance = true;
        break;
      case '--security':
        options.security = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--fix-suggestions':
        options.fixSuggestions = true;
        break;
      case '--format':
        options.format = args[++i];
        break;
      case '--help':
        console.log(`
Comprehensive Linter for Orion Project

Usage: node linter.js [options]

Options:
  --path <path>         Specific file or directory to check (default: src/)
  --file <file>         Check specific file and its test file
  --html-only          Only check HTML/semantic issues
  --accessibility      Only check accessibility issues
  --performance        Only check performance issues
  --security           Only check security issues
  --verbose            Show detailed analysis
  --fix-suggestions    Show specific fix suggestions
  --format <format>    Output format: console, json, html (default: console)
  --help               Show this help message

Examples:
  node linter.js
  node linter.js --file src/components/Button.js
  node linter.js --accessibility --verbose
  node linter.js --performance --fix-suggestions
  node linter.js --format json
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
  const linter = new ComprehensiveLinter(options);
  linter.analyze().catch(console.error);
}

module.exports = ComprehensiveLinter;
