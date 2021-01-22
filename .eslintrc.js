module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  extends: [
    "plugin:vue/recommended",
    "prettier",
    "plugin:vue/essential",
    "eslint:recommended",
    "prettier/vue",
    "plugin:prettier/recommended",
    "@vue/prettier"
  ],
  plugins: ["prettier"],
  parserOptions: {
    ecmaVersion: 2020,
    parser: "babel-eslint"
  },
  rules: {
    "no-console": "off",
    "vue/no-unused-vars": "warn"
  }
};
