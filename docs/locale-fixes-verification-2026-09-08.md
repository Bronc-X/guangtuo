# 中英阿问题修复与复验

2026-09-08。状态：原检查报告中的问题已修复，完成本地验收与生产构建，尚未部署。

## 修复结果

| 问题 | 修复后 |
| --- | --- |
| 阿文 238 处字段使用英文兜底 | 补齐产品、品类、41 个膜型、材料体系、工艺和专利说明；原有缺翻译项清零 |
| 规格中的 patch / patches | 中文和阿文均显示本地化数量单位，数值保持不变 |
| 两篇知识文章缺英阿版本 | 标题、摘要、正文、分类、日期、面包屑、首页入口和文章操作文案均已接入对应语言 |
| 文章切换语言进入 404 | 中英阿直接切换对应文章；目标语言无译文时进入其文章列表并显示本地化说明 |
| 表单错误暴露英文与内部字段名 | 必填、邮箱、长度、同意说明等错误使用当前语言；错误框获得焦点，用户能直接看到提示 |
| QUOTE DETAILS、EVIDENCE、FAQ 等固定标签 | 已改为本地化文字，包含 CSS 生成的表单标题和首页链接辅助标签 |
| 阿语工作室、提交结果及实验室标题 | 标题和描述已翻译；实验室的方案切换、咨询回复和填写信息状态也已本地化 |

文章译文保存在 `content/article-translations.json`，与已核对的中文原文绑定。CMS 修改原文后，对应旧译文暂停展示；更新译文及其 source 后恢复。未发布文章不会被译文重新带回网站。CMS 本身的编辑界面和发布流程未扩展；本次处理的是当前两篇文章及安全的语言切换行为。

## 验证

- 27 个测试文件、**171 项测试通过**。新增回归覆盖产品／膜型阿文、扩展字典、规格单位、文章静态路径、缺译文切换、旧译文失效、错误提示和实验室文案。
- 类型检查、修改文件 ESLint、差异空白检查通过。
- 生产构建通过，共生成 **247 个静态页面**；本次中英阿 **123 个目标路由**对应的导出文件全部存在。
- 123 个本地页面返回 200；中阿正文中剩余的独立拉丁文本仅为品牌、SKU 和颜色代码，未发现已记录的英文文案残留。
- **54 组**桌面／手机检查通过：三语、九类页面、1280×720 和 375×812；未发现整页横向溢出或已加载的可见破图。
- 两篇文章在桌面和手机上完成 **16 次语言切换检查**，路径、查询参数、锚点、语言和方向正确；缺译文时提示可见。
- 三语均复测了空格输入产生的 8 条业务校验错误；另实测中文空表单，10 条错误本地化且焦点进入错误框。未发送测试邮件或提交有效询盘。

## 消融复验

| 条件 | 修复前 | 修复后 |
| --- | --- | --- |
| 移除阿文英文兜底 | 277 个空字段，其中 238 个是缺失译文 | 39 个共用单位／材料代号变为空值，**自然语言译文缺失为 0** |
| 移除公司页扩展字典 | 251 处退回英文 | 仍能观察到同样影响；新增公司页回归检查可发现此类退化 |
| 移除 CMS 文章集合 | 中文文章 2 → 0，英阿无文章 | 中英阿文章均为 2 → 0，译文不会脱离源文章单独出现 |
| 移除 RTL | 内容不变，布局转为从左到右 | 影响仍可观察；实验后方向和位置已恢复 |

翻译消融使用独立构建变体，七个相关源文件的 SHA-256 在实验前后相同，中英文对照数据未改变。消融没有改动工作区的实际业务实现。

## 证据与复跑

- [字段检查](../output/locale-fixes-2026-09-08/data-audit.json) · [全部页面记录](../output/locale-fixes-2026-09-08/rendered-audit.json) · [文案残留核对](../output/locale-fixes-2026-09-08/residual-check.json)
- [视口检查](../output/locale-fixes-2026-09-08/browser-checks.json) · [文章切换](../output/locale-fixes-2026-09-08/article-switches.json) · [错误提示](../output/locale-fixes-2026-09-08/form-validation.json) · [空表单](../output/locale-fixes-2026-09-08/empty-form.json)
- [翻译消融](../output/locale-fixes-2026-09-08/ablation.json) · [RTL 恢复记录](../output/locale-fixes-2026-09-08/rtl-ablation.json)
- [阿文分类修复后](../output/locale-fixes-2026-09-08/ar-category-fixed.png) · [阿文文章手机版](../output/locale-fixes-2026-09-08/article-ar-375x812.png) · [中文错误提示](../output/locale-fixes-2026-09-08/zh-validation.png) · [阿文实验室填写状态](../output/locale-fixes-2026-09-08/ar-ui-lab-fixed.png)

```powershell
pnpm test
pnpm typecheck
pnpm build
pnpm exec tsx scripts/audit-locales.ts output/locale-fixes-2026-09-08
pnpm exec tsx scripts/ablate-locales.ts output/locale-fixes-2026-09-08
```

浏览器复验使用 `scripts/check-locale-browser.mjs` 和 `scripts/check-article-locales.mjs`，运行时设置已安装 browse 的 `BROWSE_BIN`、`BROWSE_SERVER_SCRIPT`，并传入本地站点地址和输出目录。`scripts/audit-rendered-locales.js` 在站点浏览器内执行，用于收集全部三语正文与元数据。

原始问题及修复前证据保留在 [首次检查报告](locale-completeness-ablation-2026-09-08.md)。本轮完成本地修复与构建；尚未部署，也未执行外部询盘邮件投递。
