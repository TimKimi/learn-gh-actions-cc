import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    // 规则适用于所有 src 下的 JS 文件
    files: ["src/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,   // 允许 process, require, module, console 等
      },
    },
  },
  {
    // 对测试文件额外添加 Jest 全局变量
    files: ["src/**/*.test.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,   // 允许 describe, it, expect 等
      },
    },
  },
];