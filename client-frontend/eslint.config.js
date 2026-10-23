import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

// Configuración "flat" de ESLint 9 (reemplaza a .eslintrc.cjs)
export default [
  { ignores: ["dist"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "18.2" } },
  },
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  {
    // Solo las reglas clásicas de hooks. Las nuevas de eslint-plugin-react-hooks 7
    // están pensadas para el React Compiler, que este proyecto no usa.
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // El proyecto no usa PropTypes
      "react/prop-types": "off",
    },
  },
  {
    // Los contextos exportan su Provider junto con su hook
    files: ["src/context/**"],
    rules: { "react-refresh/only-export-components": "off" },
  },
  {
    files: ["**/*.test.js", "*.config.js"],
    languageOptions: { globals: globals.node },
  },
];
