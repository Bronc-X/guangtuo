# 安全模型与残余风险

## 数据流

```text
浏览器表单
  → API Gateway + WAF + 固定域名 CORS
    → Lambda 二次 Schema 校验
      → DynamoDB（询盘、状态、令牌哈希、TTL）
      → AI SQS → Bedrock Worker → 六段式 Schema
      → 人工审批 → Mail SQS → SES
```

浏览器只在首次创建时获得随机访问令牌，令牌放在 URL fragment 对应的会话存储中，不进入查询参数、服务端访问日志或 sitemap。服务端只保存带询盘 ID 域隔离的 SHA-256 哈希，并使用固定时序比较；错误 ID 和错误令牌统一返回 404，降低枚举和 IDOR 风险。

## 已编码控制

- 15 项严格 Schema、长度限制和禁止额外字段的 OpenAPI 契约。
- 创建与重试必须携带 12–128 字符幂等键；数据库写入带条件表达式。
- 任务状态使用白名单转换，失败最多重试两次。
- 邮件必须处于 `pending_review` 且审核人获授权；商业承诺关键词会阻止普通批准。
- API 仅回传任务 ID、状态、次数和更新时间，不回显邮箱、正文或模型输出。
- S3 完全私有、CloudFront OAC、HTTPS、安全响应头、DynamoDB PITR/加密/TTL、SQS 加密及 DLQ。
- WAF 托管通用规则和每 IP 限流；Lambda X-Ray；日志保留 30 天。

## 上线前仍需验证

- 使用正式 Entra/OIDC 声明实现审核人 RBAC；当前领域层只提供授权判定入口。
- Bedrock Worker 需要模型区域、模型 ID、10 个案例、提示词版本和输出 Schema 的正式适配。
- SES Worker 需要已验证域名、模板、退信/投诉事件和审批审计写入。
- API Gateway 生产域名、WAF 阈值、CSP `connect-src` 和 CORS 必须按正式域名收紧。
- 完成依赖扫描、日志 PII 扫描、IDOR/重放/并发幂等测试与恢复演练。

## 明确禁止

- 不在 `NEXT_PUBLIC_*`、Git、构建产物或浏览器日志中放置 AWS/Microsoft 密钥。
- 不记录邮箱、电话、询盘正文、提示词或模型输出。
- 不允许 AI 自行确认价格、MOQ、交期、认证、功效或合同条款。
- 不因拥有 DynamoDB 管理权限而跳过逐询盘访问令牌验证。
