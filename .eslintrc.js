module.exports = {
  parser: 'babel-eslint',
  plugins: ['prettier'],
  env: {
    browser: true,
    node: true,
    es6: true
  },
  overrides: [
    {
      files: ['lib/**/*.js'],
      env: {
        node: false,
        browser: true,
        commonjs: true
      },
      globals: {
        NODE_ENV: true
      }
    },
    {
      files: ['test/**/*.js'],
      env: {
        mocha: true
      }
    }
  ],
  rules: {
    'prettier/prettier': 'error',
    'no-empty': ['error', { allowEmptyCatch: true }]
  },
  extends: [
    'prettier',
    'eslint:recommended'
  ]
};