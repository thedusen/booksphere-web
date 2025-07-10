import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";
import tseslint from "typescript-eslint";
import vitest from "eslint-plugin-vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default tseslint.config(
  {
    ignores: [".next/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  {
    // Vitest configuration
    files: ["src/**/*.test.{ts,tsx}", "e2e/**/*.spec.ts"],
    ...vitest.configs.recommended,
    rules: {
        ...vitest.configs.recommended.rules,
        "vitest/expect-expect": "off",
    }
  }
);
