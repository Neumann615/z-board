# AI 产出与临时文件规则

本目录中的 AI 辅助开发会产生临时文件、调试材料、测试数据和验证产物。为了避免这些内容污染工程目录，所有 AI 生成的非工程必需文件都必须集中放在项目根目录的 `ai-drafts/` 中。

## 必须放入 `ai-drafts/` 的内容

包括但不限于：

- 临时测试脚本
- 临时验证脚本
- 手工验证页面
- 测试结果数据
- JSON / CSV / HAR / 日志 / 报告
- 调试截图
- 录屏
- 对比图
- 临时图片素材
- 临时 bundle、归档、导出文件
- AI 生成的草稿、方案附件、示例数据

推荐子目录：

```text
ai-drafts/
├── screenshots/
├── test-results/
└── archives/
```

## 命名规则

临时文件应使用可识别的名称：

```text
YYYY-MM-DD-<模块或主题>-<描述>.<ext>
```

示例：

```text
2026-10-17-screenshot-crop-check.png
2026-10-17-whiteboard-pointer-test.mjs
2026-10-17-thick-curve-pixels.json
```

## 正式测试与临时验证的区别

正式回归测试属于工程文件，放在 `tests/`，命名使用：

```text
<module>.test.ts
```

例如：

```text
tests/history.test.ts
tests/curve-path.test.ts
```

这类文件应当提交，并纳入 `npm test`。
一次性手动验证脚本、运行输出、截图和临时数据仍必须放入 `ai-drafts/`。

## 禁止事项

- 不要把 AI 调试文件、截图、测试结果直接放在仓库根目录
- 不要放入 `src/`
- 不要放入 `docs/public/`
- 不要放入 `lib/`
- 不要提交构建产物或临时验证产物
- 不要覆盖工程内的正式资源
- 不要把 `ai-drafts/` 中的临时文件加入 Git 提交

## 清理要求

每次任务结束前：

1. 如果只是短期验证，直接删除临时文件
2. 如果还有排查价值，移动到 `ai-drafts/` 对应子目录
3. 正式改动只保留源代码、文档、测试配置和必要的工程资源
4. 提交前确认 `git status` 中没有混入 AI 临时产物

`ai-drafts/` 已加入 `.gitignore`，默认不会被提交。
