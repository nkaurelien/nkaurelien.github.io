import { defineConfig } from 'vite-plus';

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  lint: {
    plugins: ['eslint', 'react', 'nextjs', 'jsx-a11y', 'import', 'unicorn', 'oxc', 'typescript'],
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    ignorePatterns: [
      '.next/**',
      'out/**',
      'node_modules/**',
      'src/generated/**',
      '.agents/**',
      '.claude/**',
      '.claude-flow/**',
      '.genkit/**',
      '.specify/**',
      'public/**',
      'redirect-page/**',
    ],
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    tabWidth: 2,
    useTabs: false,
    singleQuote: true,
    semi: true,
    bracketSpacing: true,
    arrowParens: 'avoid',
    trailingComma: 'es5',
    bracketSameLine: true,
    printWidth: 150,
    sortPackageJson: false,
    ignorePatterns: [
      '.next/**',
      'out/**',
      'node_modules/**',
      'src/generated/**',
      '.agents/**',
      '.claude/**',
      '.claude-flow/**',
      '.genkit/**',
      '.specify/**',
      'public/**',
      'datasources/**',
      'latex/**',
    ],
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}', 'tests/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules/**', '.next/**', '.agents/**', '.claude/**'],
  },
  run: {
    enablePrePostScripts: true,
    cache: {
      tasks: true,
      scripts: false,
    },
  },
});
