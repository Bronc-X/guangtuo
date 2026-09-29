# 核心功能接通状态与明确报错

检查日期：2026-09-08。本次需求：确认模型是否报错，列出核心未接通项，并让未接通状态明确报错。

## 结论

五款现有包装模型本地复查全部可加载，导出按钮可用，没有复现模型自身故障。之前展示的“暂时无法显示 3D”截图来自主动故障注入（禁用 WebGL 或让 GLB 返回 404），不是五款模型正常入口全部坏了。

本轮曾遇到 `127.0.0.1:3120` 连接拒绝。核对后该验收服务进程及监听均已不存在，已重新启动隔离环境；这是本地服务停止，不是模型文件报错。网站源码和模型没有因此重置。

## 核心状态

| 功能 | 本地实现 / 验证 | 正式服务状态 | 还缺什么 |
| --- | --- | --- | --- |
| 现有五款 3D 包装、Logo、PNG、分享 | 已实现，五款加载和导出就绪复查通过 | 静态包已包含，公网尚未部署 | 服务器、域名、HTTPS；手机实机验收另列 |
| AI 方案图 | 操作、进度和失败处理已实现 | 未接通，正式构建未配置生成服务地址 | 图片服务、授权凭据、受控访问和费用确认 |
| AI 新造型 3D | 网关及任务管理具备本地契约验证 | 未接通，不能实际生成新模型 | 图片前置服务、GPU worker、模型许可和服务配置 |
| 网页顾问 / 邮件草稿的大模型能力 | 现有 FAQ 和初步整理是规则生成，人工审核流程可用 | 没有已接通大模型 Agent 的证据，不能作为 AI Agent 已交付 | 模型服务选型、授权和真实调用验收；规则问答不冒充模型调用 |
| 正式邮件发出 | 审核、TLS 465/STARTTLS 587、失败人工重试已做本机协议验证 | 正式 SMTP 发件邮箱未接通，未证明外部送达 | 专用发件邮箱配置、发件域名记录和获准测试收件人 |
| 询盘保存、后台上传和发布 | 本地 Node/SQLite、图片/PDF、静态构建发布已接通 | 阿里云公网后台尚未部署 | 已创建服务器的公网 IP/授权登录、部署 runtime 和 static、持久化备份 |
| 六语网页 / 文章 | 已有本地化内容和回归记录 | 静态包已包含，公网尚未部署 | 域名与 HTTPS，以及客户内容确认 |
| 每日截图 PDF | 固定三页模板及当日 PDF 已生成 | 未配置每天自动发送 | 接收客户、发送渠道和每日时间；未擅自设置自动发信 |

`showkibiotech.com` 本次本地 DNS 查询仍返回“DNS 名称不存在”。这是本机查询结果，不冒充全球 DNS 检查。

## 本轮报错修正

1. 新造型入口显示显式 `role="alert"`，覆盖六种语言，并保留不可执行按钮的禁用状态：
   - `STUDIO_NOT_CONFIGURED`：尚未配置生成服务，说明 AI 方案图和新造型 3D 均未接通。
   - `STUDIO_UNREACHABLE`：已配置地址但连接失败，提示维护人检查服务后再试。
   - `IMAGE_SERVICE_UNAVAILABLE` / `MODEL_SERVICE_UNAVAILABLE`：区分图片服务和 3D 服务未就绪。
   - 初次检查显示“正在检查生成服务”，健康请求最多等待 10 秒；未接通时状态栏不再显示准备就绪类文字。
2. 后台 SMTP 未配置时显示 `SMTP_NOT_CONFIGURED` 错误，包括“还没有询盘”的空列表；已有记录的邮件编辑器同样显示错误并禁止发送。
3. 询盘 API 503 的实际浏览器验证：显示提交失败提示、保留已填字段、允许重试、留在询盘页，不写入 `gt-job:` 演示成功记录。

以上是可恢复的界面报错，不是故意让整页崩溃。没有给未接通功能伪造成功结果，没有改模型资产、发件收件人、权限规则或真实发送逻辑。

采用 mini-investigate 定位两处提示缺口；沿用现有前端错误样式，按 humanwriter 将文案写为失败对象、当前限制和维护动作，没有重做视觉布局。

## 验证与证据

- [五款模型检查](../output/connectivity-audit-20260908/five-models.json)：5/5 通过。
- [全量测试结果](../output/connectivity-audit-20260908/tests.json)：198/198 通过。
- 类型检查、修改文件及 QA 脚本 ESLint：通过，零警告。
- [浏览器错误状态检查](../output/connectivity-audit-20260908/service-errors.json)：14/14 通过，包括六语 × 两视口、无询盘时 SMTP 错误、询盘 503 不假成功。
- [桌面生成服务错误](../output/connectivity-audit-20260908/studio-unconfigured-1440.png)、[手机生成服务错误](../output/connectivity-audit-20260908/studio-unconfigured-390.png)、[后台空列表错误](../output/connectivity-audit-20260908/smtp-unconfigured-empty.png)、[询盘服务断开错误](../output/connectivity-audit-20260908/inquiry-service-unavailable.png)均已目视检查。
- 新增回归测试先复现 4 个预期失败，再实施修正并通过；新错误状态在隔离的无 SMTP 服务上验证，未向外部邮箱发送邮件。

## 新部署版本

最新版本为 **`showkibiotech-20260908T142533`**，替代先前的 `showkibiotech-20260908T132011`。

- [部署清单](../deliverables/showkibiotech-20260908T142533/manifest.json)
- [部署说明](../deliverables/showkibiotech-20260908T142533/DEPLOY.md)
- [静态站包](../deliverables/showkibiotech-20260908T142533/showkibiotech-20260908T142533-static.tar.gz)
- [后台运行包](../deliverables/showkibiotech-20260908T142533/showkibiotech-20260908T142533-runtime.tar.gz)

生产构建成功，251 个 HTML，同源 `/api`；生成服务保持禁用，`productionDeployed: false`。本轮隔离验收站运行在 `127.0.0.1:3120`，后台未配置 SMTP，用于查看真实未接通提示，不是公网正式站。
