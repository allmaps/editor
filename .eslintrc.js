module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  extends: [
    "plugin:vue/recommended",
    "plugin:vue/essential",
    "eslint:recommended",
  ],
  parserOptions: {
    ecmaVersion: 2020,
    parser: "babel-eslint"
  },
  rules: {
    "no-console": "off",
    "vue/no-unused-vars": "warn",
    semi: ["error", "never"]
  }
}
