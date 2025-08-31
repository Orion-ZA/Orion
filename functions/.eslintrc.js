module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
  ],
  rules: {
    // Disable most strict rules
    "quotes": "off", // Allow both single and double quotes
    "max-len": "off", // No line length limits
    "comma-dangle": "off", // No trailing comma enforcement
    "object-curly-spacing": "off", // No spacing rules for objects
    "no-trailing-spaces": "warn", // Make trailing spaces a warning instead of error
    "eol-last": "off", // No requirement for newline at end of file
    
    // Additional relaxed rules
    "indent": "off", // No specific indentation rules
    "semi": "off", // No semicolon enforcement
    "no-console": "off", // Allow console statements
    "arrow-parens": "off", // No arrow function parentheses rules
    "prefer-const": "warn", // Make const preference a warning only
  },
};