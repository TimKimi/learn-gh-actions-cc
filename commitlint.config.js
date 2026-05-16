module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 必须包含 scope（括号里的部分）
    'scope-empty': [1, 'never'],
    // subject 小写开头
    'subject-case': [2, 'always', 'lower-case'],
    // body 前需空行
    'body-leading-blank': [2, 'always'],
    // footer 前需空行
    'footer-leading-blank': [2, 'always'],
  },
};