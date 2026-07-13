# 📝 更新日志

> 所有重要的版本更新都会记录在此文件中。

---

## [0.0.94] - 2026-06-27

### ✨ 新特性

- **VitePress 文档站点**
  - 集成 VitePress，提供结构化文档（指南 / API 参考 / 类型定义）
  - 支持 `npm run docs:dev` 本地预览、`docs:build` 构建
  - 自定义主题加载库样式与图标字体，路径别名 `/src/` 直连源码

- **独立 Demo 页面**
  - 白板和截图全屏演示，独立 HTML 页面，零 VitePress 样式
  - Vite 插件在 dev 模式下拦截请求，绕过 VitePress 管道
  - 独立 Vite 多页构建，生产环境合并到 `dist/play/`

- **截图图片缩放内置化**
  - `scaleImageToFit` 内置到 `initScreenShot` 中
  - 图片自动缩放至容器像素尺寸，坐标一一对应
  - 调用方只需传入原始图片 URL，无需手动处理缩放

### 🐛 问题修复

| 问题描述 | 涉及文件 | 状态 |
|---------|---------|------|
| 截图背景图与框选区渲染错位 | `screenshot/core.ts` | ✅ 已修复 |
| Demo 页面 VitePress 暗色模式样式泄漏 | `demo/*.md` | ✅ 已修复 |
| SPA 路由拦截导致独立 Demo 页面 404 | `theme/index.ts` | ✅ 已修复 |
| `containerDom` 赋值覆盖导致坐标换算错误 | `screenshot/core.ts` | ✅ 已修复 |

### 📦 变更文件

| 文件 | 变更 |
|------|------|
| `docs/` | 新增：文档站点 & Demo 页面 |
| `src/modules/screenshot/core.ts` | 重构：缩放内置化 + 坐标修正 + resize 监听 |
| `package.json` | 新增 `docs:*` 脚本 |
| `.gitignore` | 排除 VitePress 构建产物 |
| `tsconfig.json` | exclude 排除 `docs/` |
| `index.html` / `src/main.ts` | 移除（不再需要） |

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
