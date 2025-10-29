import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".git/**"
    ]
  },

  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "semi": ["error", "always"],
      "quotes": ["error", "single"],
      "object-curly-newline": ["error", {
        "ObjectExpression": { "multiline": true, "consistent": true },
        "ObjectPattern": { "multiline": true, "consistent": true },
        "ImportDeclaration": { "multiline": true, "consistent": true },
        "ExportDeclaration": { "multiline": true, "consistent": true }
      }],
      "padding-line-between-statements": [
        "error",
        { "blankLine": "always", "prev": "block", "next": "*" },
        { "blankLine": "any", "prev": "block", "next": "block" }
      ],
      "brace-style": ["error", "1tbs", { "allowSingleLine": false }],
      "indent": ["error", 2]
    }
  }
];
