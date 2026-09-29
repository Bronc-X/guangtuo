# 邮件、3D 与资料库代码验收

状态：代码完成，本地验证通过；真实服务接入待办。本轮没有修改云服务器/DNS、支付、导入客户资料或发送外部邮件。

## 验证结果

| 检查 | 结果 |
| --- | --- |
| pnpm exec vitest run | 41 个测试文件，219 项通过 |
| Python unittest（Hunyuan 网关） | 18 项通过 |
| pnpm typecheck | 通过 |
| 本轮变动服务、契约、UI、测试、脚本 ESLint | 通过 |
| pnpm audit --prod --json | 0 告警；ExcelJS 的 uuid 间接依赖定向锁到 11.1.1 |
| 生产静态构建 | Next 16.3.1，251 页，6 种语言 |
| 邮件后台实际浏览器操作 | 生成确认门禁、模拟 RAG 草稿、原文引用、无 SMTP 禁发通过 |
| 响应式 | 1440/390 宽度无横向溢出；控制台无错误 |

浏览器验收脚本：`scripts/delivery-qa/knowledge-mail-browser.mjs`。隔离 fixture 使用 `local-qa-mock-not-a-real-model`，标题与正文明确标记 LOCAL QA，样本不是客户资料。截图和机器结果位于 `output/knowledge-mail-20260909/`。没有因为模拟成功而将真实配置状态改为可用。

## 重点用例

资料默认 draft/internal，客户检索不可见；显式 reviewed 才能启用对客资料。真实独立进程解析 TXT 与 DOCX，PDF 文字与扫描件区分，XLSX/CSV 保留出处。归档资料不再参与检索。hybrid 缺配置/索引不全时明确失败。

真实 CMS HTTP 流程：上传 → 资料审核 → 收到询盘 → 生成草稿 → 未审核禁发 → 人工审核 → 模拟发件仅一次。收件人固定，传给模型的数据不含买家邮箱。伪造 chunk ID/原文引用被拒绝；生成过程中资料撤销、发送前资料撤销都被拦截。3D 简报引用过期时不能继续按该简报生成方案图。

3D 私有网关测试包括无令牌、错误令牌、缺配置、未启用、未确认外部处理、上游失败、错误图片、固定资产路径和不自动重试。Python 与 Node 均设置生成开关，未向公共访客开放付费生成。

## UI 与类型兼容修正

沿用现有暖白/深色工作台、字体和间距，只增加资料生成区与引用区；DFII 14（影响 3、适配 5、可行 5、性能 5、维护风险 4）。frontend-design 用于控制布局和响应式，humanwriter 用于写清生成后果、审核与错误，不添加营销文案。

mini-investigate 的检查目标是消除新模块编译错误，不改业务流程。证据来自 tsc：Next 扩充后的 ProcessEnv 必填 NODE_ENV；Node ForkOptions 没有 windowsHide；当前 pdfjs 已移除 isEvalSupported。分别改成配置字典类型、最小解析环境加 NODE_ENV、删除无效参数并禁用不需要的 WASM；回归类型检查和解析测试通过。未改无关业务代码。

## 交接包

`deliverables/showkibiotech-20260908T162210/`（命名为 UTC 时间，北京时间 2026-09-09）。包含新邮件 UI、knowledge/studio/integrations 服务代码与接入手册；不含 QA、原始资料、私有环境文件、Python 虚拟环境或 GPU 权重。

- 静态包 SHA-256：`c67d20d7097f035ab4c083dda09606e170cce40eaa185a104b121354670cb9f8`
- 运行包 SHA-256：`d3c8855c67edd79f74b2c6a931eba24528333d369c0e29c0bd0e38e8e2c88809`
- `productionDeployed:false`，公共付费生成 `generationEnabled:false`。

运行包 README 在静态构建结束后同步到最新私有网关说明，重新计算了运行包校验值。旧的 20260908T142533 包不包含本轮功能，交付新代码应使用本包。

## 尚未验证/接入

专用邮箱及真实送达；文本/向量模型的实际账户、兼容性、费用与生成质量；GPU 环境及模型地区/商业许可；真实资料、OCR 与真实相关性评测。当前 3D 是管理 API 与客户端适配，没有新建完整管理工作台；资料录入也先留 API，符合本轮边界。

归档保留原件，未做永久删除和容量回收管理；单实例 SQLite 检索不代表大规模向量服务。解析子进程是超时/堆限制，不是操作系统沙箱。引用可追溯不保证内容正确，仍必须人工审核。

阿里云仍需登录授权后处理；既有服务器 Caddy 和其他站点必须保留，不能直接运行仅适用于空机的 Nginx 初始化脚本。本轮不改变此前部署状态。
