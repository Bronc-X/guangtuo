# 广拓生物独立站实施基线

项目主 3D 生成引擎已确定为 **Hunyuan3D-2mini**。正式 Studio 固定使用 50 步、octree 384 并保留原生高精度网格；TripoSG 已暂停，只保留历史评测与回滚资产，不参与默认启动和部署。

这是按确认版合同和已确认建站计划建立的可运行第一版。它采用 Juvy Glow 的 B2B 产品目录转化逻辑，但没有复制其品牌资产、文案或源码。

## 当前已完成

- 中英文静态路由、首页、分类、5 个独立建模边界的概念 SKU、产品详情、流程、推荐、方案、询盘、状态和联系页。
- 3D 核心：海报优先加载、360°拖拽与自动旋转、每款最多 6 组参数、Logo 本地上传贴图与位置预览、URL 配置恢复、PNG 效果图导出、WebGL 降级。
- AI 邮件核心：15 项询盘契约、固定六段式方案、20 个双语安全回复预设、邮件草稿、人工审批状态，以及价格、MOQ、交期、合同、认证、功效、附件、低置信度和提示词注入的转人工规则。
- 生产 API 核心：幂等创建、随机访问令牌、仅存令牌哈希、任务状态查询、DynamoDB 适配器、SQS 入队和严格 CORS。
- AWS CDK：私有 S3、CloudFront OAC、安全响应头、Regional API Gateway、WAF、Lambda、DynamoDB、AI/邮件队列与 DLQ、预算提醒。
- `output: "export"` 静态构建，可将 `out/` 部署到私有 S3 + CloudFront。
- 单元测试、类型检查、代码检查和静态构建。

## 本地运行

```powershell
pnpm install
pnpm dev
```

本地混元生产单元需要三个终端，依次运行：

```powershell
pnpm 3d:hunyuan:preflight
pnpm 3d:hunyuan:start
pnpm 3d:gateway:start
```

然后访问 `/zh/studio/`。混元服务监听 `127.0.0.1:8080`，静态站可访问的本地网关监听 `127.0.0.1:8091`。详细边界见 [services/hunyuan3d/README.md](services/hunyuan3d/README.md)。

完整检查：

```powershell
pnpm check
pnpm build
```

## 已验证公开站基线

公开站当前确认版已固化为独立回归门禁，覆盖首页保留模块、真实产品图片、13 个 SKU、3D 工作室、邮件助手、导航固定与返回顶部、四语言路径，以及导航间距和产品／语言悬停下拉。

```powershell
pnpm test:baseline
```

以后修改公开页面、导航、产品数据、语言路由或首页模块时，必须在修改前和修改后各运行一次该命令。基线失败时应先确认用户可见行为是否回归，不得通过删除或放宽断言掩盖问题。

## 上线前必须由客户提供

1. 已购买的 Cruip 模板、订单/许可、品牌手册、正式 Logo、中英文文案和合法图片；当前品牌与产品图片为概念资产。
2. 每个 SKU 的 GLB/KTX2、配置规则、SKU 对照；演示几何体不代表最终工业模型。
3. 可书面公开的工厂、认证、案例、MOQ、交期、功效和法规资料。
4. AWS、域名/DNS、SES、Bedrock 权限和四套邮件模板；Microsoft 365 Agent 另需变更单、管理员授权和专用邮箱。

## 关键安全边界

- 未设置 `NEXT_PUBLIC_API_BASE_URL` 时完全本地演示；配置生产 API 后，询盘会安全提交并查询真实异步状态。
- 3D Studio 的 provider 在前后端都锁定为 `hunyuan3d`；服务端拒绝 `triposg` 请求。Tripo 的 Compose 服务默认 profile 已禁用。
- 混元原生高精度 GLB 是内部几何母版；公开产品配置器继续使用经过人工审核、拆件和性能处理的正式 GLB，不能把 AI 白模直接视为开模文件。
- Bedrock 与 SES Worker 已提供部署适配器，但默认环境值会令其安全停止；只有取得批准模型、验证发件域名、模板和审核授权后才能启用。
- 正式站邮件默认 `pending_review`，必须人工批准后才进入 SES 队列。
- AI 不得自行补全 MOQ、价格、交期、认证或功效声明。
- Proposal、Status 和 Inquiry 页面不进入 sitemap；生产 API 必须使用限流、幂等键、WAF、严格 CORS 和服务端 Schema 校验。

接入细节见 [docs/production-integration.md](docs/production-integration.md)，安全边界见 [docs/security-model.md](docs/security-model.md)，公开接口见 [src/server/openapi.json](src/server/openapi.json)。
