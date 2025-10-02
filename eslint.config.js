import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import prettierConfig from "eslint-config-prettier";
import prettier from "eslint-plugin-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default [
  {
    ignores: [
      "dist/**",
      "build/**",
      "node_modules/**",
      "src-tauri/target/**",
      "*.min.js",
      "*.min.css",
      "src/routeTree.gen.ts",
      "src/__tests__/test-setup.ts",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    settings: {
      react: { version: "detect" },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "@typescript-eslint": tseslint,
      prettier,
    },
    rules: {
      // Base JavaScript rules
      ...js.configs.recommended.rules,

      // Prettier integration
      "prettier/prettier": "error",

      // Disable conflicting rules
      ...prettierConfig.rules,

      // TypeScript specific
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-empty-function": "off",

      // React specific
      "react/react-in-jsx-scope": "off", // Not needed in React 17+
      "react/prop-types": "off", // Using TypeScript for prop validation
      "react/jsx-uses-react": "off", // Not needed in React 17+
      "react/jsx-uses-vars": "error",
      "react/jsx-key": "error",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-undef": "error",
      "react/no-unescaped-entities": "warn",
      "react/display-name": "off",

      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // React Refresh (for HMR)
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // General JavaScript rules
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "warn",
      "no-unused-vars": "off", // Using @typescript-eslint/no-unused-vars instead
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-template": "error",
      "no-duplicate-imports": "error",
    },
  },
  {
    files: ["**/*.config.{js,ts}", "vite.config.ts", "eslint.config.js"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-var-requires": "off",
    },
  },
  {
    files: [
      "**/*.test.{js,jsx,ts,tsx}",
      "**/*.spec.{js,jsx,ts,tsx}",
      "src/__tests__/**/*.{js,jsx,ts,tsx}",
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
];
