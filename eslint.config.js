// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // Draait op Deno met npm:/jsr:-specifiers; hoort niet bij de
    // Expo/Node-lintconfiguratie (zie ook tsconfig.json).
    ignores: ["dist/*", "supabase/functions/**"],
  }
]);
