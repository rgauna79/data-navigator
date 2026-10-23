module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // El proyecto no usa PropTypes
    'react/prop-types': 'off',
  },
  overrides: [
    {
      // Los contextos exportan su Provider junto con su hook
      files: ['src/context/**'],
      rules: { 'react-refresh/only-export-components': 'off' },
    },
    {
      files: ['**/*.test.js'],
      env: { node: true },
    },
  ],
}
