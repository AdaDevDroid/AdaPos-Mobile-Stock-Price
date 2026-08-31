import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "output/**",
      "next-env.d.ts",
      "public/test-network.ts",
      "server.js",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { files: ["scripts/**/*.cjs", "tests/**/*.cjs"], rules: { "@typescript-eslint/no-require-imports": "off" } },
];

export default eslintConfig;
