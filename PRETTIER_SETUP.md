# Prettier Setup for Orion Project

## 🎨 **What is Prettier?**

Prettier is an opinionated code formatter that automatically formats your JavaScript, TypeScript, CSS, HTML, JSON, and other files to ensure consistent code style across your project.

## 📦 **Installation**

Prettier has been installed as a dev dependency:

```bash
npm install --save-dev prettier husky lint-staged
```

## ⚙️ **Configuration**

### **Prettier Config (`.prettierrc`)**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "quoteProps": "as-needed",
  "jsxSingleQuote": true,
  "proseWrap": "preserve",
  "htmlWhitespaceSensitivity": "css",
  "embeddedLanguageFormatting": "auto"
}
```

### **Prettier Ignore (`.prettierignore`)**

Excludes build outputs, dependencies, and generated files from formatting.

## 🚀 **Usage Commands**

### **Format All Files**

```bash
npm run format
```

### **Check Formatting (CI/CD)**

```bash
npm run format:check
```

### **Format Staged Files Only**

```bash
npm run format:staged
```

## 🔧 **Git Hooks Integration**

### **Pre-commit Hook**

Automatically formats and lints staged files before each commit:

```bash
# .husky/pre-commit
npx lint-staged
```

### **Lint-staged Configuration**

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --fix"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

## 🎯 **Benefits**

1. **Consistent Code Style**: All team members write code in the same format
2. **Reduced Code Reviews**: Less time spent on style discussions
3. **Automatic Formatting**: No manual formatting needed
4. **Git Integration**: Automatic formatting on commit
5. **CI/CD Ready**: Format checking in build pipelines

## 🔄 **Workflow**

### **Development Workflow**

1. Write code normally
2. Stage files with `git add`
3. Commit with `git commit` (Prettier runs automatically)
4. Code is automatically formatted and linted

### **Manual Formatting**

```bash
# Format specific file
npx prettier --write src/components/Button.js

# Format specific directory
npx prettier --write src/components/

# Check formatting without changing files
npx prettier --check src/
```

## 🛠️ **IDE Integration**

### **VS Code**

Install the Prettier extension and add to settings:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.formatOnPaste": true
}
```

### **Other IDEs**

- **WebStorm**: Built-in Prettier support
- **Sublime Text**: Install JsPrettier package
- **Atom**: Install prettier-atom package

## 📋 **File Types Supported**

- **JavaScript**: `.js`, `.jsx`
- **TypeScript**: `.ts`, `.tsx`
- **CSS**: `.css`, `.scss`, `.less`
- **HTML**: `.html`
- **JSON**: `.json`
- **Markdown**: `.md`
- **YAML**: `.yml`, `.yaml`

## 🔍 **Integration with Linter**

Prettier works alongside your custom linter (`linter.js`) and ESLint:

1. **Prettier**: Handles code formatting
2. **ESLint**: Handles code quality and style rules
3. **Custom Linter**: Handles semantic HTML, accessibility, performance, and security

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Conflicts with ESLint**: Use `eslint-config-prettier` to disable conflicting rules
2. **Git Line Endings**: Configure `.gitattributes` for consistent line endings
3. **Large Files**: Add large files to `.prettierignore`

### **Reset Formatting**

```bash
# Reset all formatting
npm run format

# Check what would be formatted
npm run format:check
```

## 📚 **Best Practices**

1. **Commit Often**: Small commits with automatic formatting
2. **Team Agreement**: Everyone uses the same Prettier config
3. **CI Integration**: Run `format:check` in your build pipeline
4. **IDE Setup**: Enable format-on-save in your editor
5. **Ignore Files**: Add generated files to `.prettierignore`

## 🔗 **Related Tools**

- **ESLint**: Code quality and style rules
- **Husky**: Git hooks management
- **Lint-staged**: Run linters on staged files
- **Custom Linter**: Semantic HTML and accessibility checks

---

**Happy Coding! 🎉** Your code will now be automatically formatted and consistent across the entire Orion project.
