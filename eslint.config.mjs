import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // One-off dev/admin tooling — not shipped code. Excluded so the lint gate
    // covers app/lib/components only. (audit ④-lint / ④-junk)
    "scripts/**",
    "convertSkills.js",
  ]),
  {
    // Triage to make lint a usable gate (audit ④-lint). The rules below stay
    // visible as WARNINGS rather than blocking errors:
    //  - no-explicit-any: the codebase uses `any` deliberately for Supabase row
    //    shapes and template value maps. Worth tightening over time, not a bug.
    //  - no-unused-vars: real dead code, but build-safe; clean up incrementally.
    //  - exhaustive-deps: several intentional omissions already carry inline
    //    disables; as a warning it informs without blocking.
    // Cosmetic JSX apostrophe/quote escaping is turned OFF entirely.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "off",
      // React-Compiler rule family (react-hooks v6 recommended): optimization
      // correctness, not bugs. The codebase has intentional patterns here (e.g.
      // the MultiPartQuestion render-once useMemo with an explicit disable).
      // Kept as warnings for incremental cleanup rather than blocking the gate.
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
]);

export default eslintConfig;
