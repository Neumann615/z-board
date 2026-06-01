# 📝 更新日志

> 所有重要的版本更新都会记录在此文件中。

---

## [0.0.93] - 2026-06-01

> 🎉 首次发布 npm 包！

### ✨ 新特性

- **TypeScript 全面重构**
  - JavaScript → TypeScript 完整迁移
  - 添加完整的类型定义文件 (`index.d.ts`)
  - 配置 `tsconfig.json` 严格类型检查

- **代码结构优化**
  - 抽离白板和截图模块的公共代码
  - `common/render.ts` - 公共渲染逻辑
  - `common/eventBinding.ts` - 公共事件绑定
  - 保留所有原有方法注释

- **打包配置升级**
  - 支持 ES Module 和 CommonJS 双格式输出
  - 自动生成 TypeScript 类型声明文件
  - 修复包名 `z-board` 导致的部分环境兼容问题
  - CSS 样式文件正确导出

### 🐛 问题修复

| 问题描述 | 涉及文件 | 状态 |
|---------|---------|------|
| `Invalid assignment target` 错误 | `screenshot/core.ts` | ✅ 已修复 |
| `NotFoundError` 卸载异常 | `tooltip.ts` | ✅ 已修复 |
| 画笔工具鼠标交互无响应 | `toolbar.ts` | ✅ 已修复 |
| 文本框颜色/粗细切换失效 | `eventBinding.ts` | ✅ 已修复 |
| 遗漏 `setTop`/`setBottom`/`save` 方法 | `toolbar.ts` | ✅ 已补全 |

### 📦 发布配置

- `package.json` 的 `exports` 字段配置
- `main` / `module` / `types` 入口文件设置
- 成功发布到 npm registry

---

## [0.0.9] - 2023-10-12

### 🐛 问题修复

- 改进初始化异常处理，支持多次重复 `init`
- 白板和截图新增卸载方法
- 解决 `popover`、`tooltip` 卸载异常的问题

---

## [0.0.8] - 2023-10-07

### 🐛 问题修复

- 修复选中元素置顶置底有时失效的问题

---

<!--
📌 版本号规则：
• MAJOR: 破坏性更新，不兼容的 API 变更
• MINOR: 新功能，向后兼容
• PATCH: 问题修复，向后兼容
-->
