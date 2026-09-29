# 邮件、3D 与资料库接入手册

更新：2026-09-09。此版本完成代码与本地测试，不表示已部署公网或已接通真实模型、邮箱、GPU。实际客户资料尚未录入。原件、SQLite 和密钥都位于私有 CMS_DATA_DIR，不能放入 public 或静态站点目录。

## 当前使用方式

邮件后台已有“依据资料生成草稿”，可选关键词或混合检索、确认外部处理、查看原文引用、保存修改、审核和发送。没有生成服务会显示 RAG_NOT_CONFIGURED；没有 SMTP 会显示 SMTP_NOT_CONFIGURED。原有规则草稿仍可使用，不会冒充 RAG 结果。

资料库录入与 3D 生成提供管理 API 和 `createAdminApi` 调用方法，本轮没有增加完整资料管理页面或 3D 后台工作台。现有公共 3D 预览保持原样，匿名付费生成不启用。

## 鉴权和错误

所有下列路径位于 `/api/cms`，要求已登录的 HttpOnly 会话；POST/PATCH 要求精确匹配的 Origin 和 X-CSRF-Token。复用 `/auth/login` 与 `/session`。不要把网关令牌或模型密钥交给浏览器。

失败格式为 `{error:{code,message,current?}}`，客户端抛出 AdminApiError。解析失败返回 HTTP 422，`error.current` 内含已保留的文档 ID、parseState 和底层解析错误码。上游报错只返回安全错误码，不返回原始响应或密钥。

GET `/ai/status` 返回配置标志：ragConfigured、embeddingConfigured、smtpConfigured、studioConfigured、studioGenerationEnabled。这些仅代表配置存在；模型余额、连通性、质量和送达需另行验证。

## 资料录入接口

| 方法与路径（省略 /api/cms） | 请求 / 结果 |
| --- | --- |
| GET /knowledge | `{items: KnowledgeDocument[]}`，最近 1000 份元数据，不含原文 |
| POST /knowledge/documents | JSON `{title,locale,skus?,text}`；返回新文档，默认 draft/internal |
| POST /knowledge/uploads?title=…&locale=en&sku=GT-JAR-050 | 原始文件字节；X-File-Name 为 URL 编码文件名；多个 SKU 重复 sku 参数 |
| GET /knowledge/documents/:id | 文档元数据、版本、解析状态、警告 |
| GET /knowledge/documents/:id/file | 私有原件下载，attachment/no-store |
| PATCH /knowledge/documents/:id | `{version,title?,skus?,status?,visibility?,reviewed?}` |
| POST /knowledge/documents/:id/embeddings | `{version,confirmed:true}`，建立当前模型对应向量；同配置已有完整索引则复用 |
| POST /knowledge/search | `{query,mode?,audience?,locale?,sku?,limit?,confirmed?}` |

locale 支持 en/zh/fr/es/ru/ar。status 为 draft/active/archived，visibility 为 internal/customer。设为 active/customer 时必须显式提交 reviewed:true，表示人工核实且允许对客使用。版本不匹配返回 VERSION_CONFLICT；解析失败不可启用。归档后不再检索，原件保留，没有永久删除接口。

示例录入顺序：上传 → 核对解析警告和原件 → PATCH active/customer/reviewed:true → 搜索验证 → 可选建立向量。为产品资料设置准确 SKU；生成接口按精确 SKU 过滤，未标记该 SKU 的通用资料不会被自动加入。

search 的默认值：mode=bm25，audience=customer，limit=6（最多 10）。内部资料只能在管理员显式 audience=internal 检索时出现；邮件与 3D 简报强制 customer，不能从请求覆盖。hybrid 搜索需要 confirmed:true，因为查询会发送给外部向量服务。缺配置或索引不全明确报错，不降级伪装成 hybrid。

## 解析策略和边界

- 文件上限 8 MB；只接受 UTF-8 TXT/Markdown/CSV、PDF、DOCX、XLSX。旧 DOC/XLS、图片、压缩资料包不支持，先转换。
- PDF 最多 100 页，仅提取文字，不执行 PDF 脚本、不渲染远程资源。全扫描件返回 needs_ocr/OCR_REQUIRED；部分页面无文字时保留逐页警告，需人工补 OCR 后重新上传。当前未接 OCR。
- DOCX 提取纯文本段落，保留段落编号；不输出可执行 HTML。不保证复杂表格版式或图片中的文字被识别。
- XLSX 保留工作表和行号；首行作为字段名，20 行成组。CSV 同理，支持引号和逗号。公式不执行，只提取已有缓存值并标记警告；合并单元格、复杂多表头必须人工核对。
- Office ZIP 检查中央目录：2000 项，单项标称解压 32 MB，总计 64 MB；拒绝加密、多卷和超限档案。没有把 ZIP 元数据当作完整安全证明。
- 最多 50 个工作表、每表 50000 行/200 列，提取文字总计 500000 字符。每块 1400 字符、重叠 180，单文档最多 500 块。出处保留页码/段落/表名行号；跨块上下文需查看原件。
- 正式入口使用固定独立解析子进程，20 秒超时，256 MB V8 堆限制，仅继承最小系统环境。不是操作系统沙箱，也不是硬 RSS 内存限制；高风险不可信文件建议另加容器/系统资源隔离。
- 原始资料按随机 UUID 保存并记录 SHA-256。新上传不覆盖历史文档；替换资料需停用旧文档、上传新文档、重新审核。失败记录原件仍保留。

## BM25 + RAG 策略

1. 先筛 active/已解析、可见范围，再筛语言/SKU。最多允许 10000 个活跃资料块参与本地检索，超限报错；最多保存 1000 份文档，归档不释放文档数量。
2. NFKC、英文小写、产品编号完整 token，中文 Intl.Segmenter 分词补充汉字二元组；标题与正文共同计算 BM25（k1=1.2，b=0.75）。无词汇相关结果不返回任意兜底资料。
3. hybrid 另取语义候选：同端点/模型/维度 profile 的向量、余弦相似度，当前门槛 0.2、最多 30 候选。该阈值尚未经过真实客户资料校准，不是准确率承诺。
4. BM25 最多 30 候选与语义候选做 RRF（k=60，词汇权重 0.6，语义权重 0.4），返回前 6 条及出处。向量按 32 块分批生成、校验维度/非零数值并缓存，模型配置变化要求重建匹配索引。
5. 邮件/3D 取指定 SKU 的已审核对客证据，可跨资料语言检索；locale 控制生成语言。没有相关证据返回 NO_RELEVANT_EVIDENCE，不请求生成模型。
6. 查询、资料标题和正文均作为不可信数据；模型无工具、无收件人权限。要求结构化 JSON、chunkId 和逐字原文引用。伪造引用、引用不属于召回资料、拒答或格式错误均拒绝保存。
7. 生成后复核文档版本；邮件审核、发送前再检查一次。资料更新/归档后旧草稿返回 RAG_SOURCES_STALE。手动编辑保留原引用但清除发送授权，仍需审核。

引用存在只证明原文可追溯，不证明生成内容与原文逻辑一致。报价、认证、医疗功效、交期和量产承诺必须人工核实。当前 BM25 在请求内计算，向量扫描使用 SQLite 存储加内存余弦；不是独立大规模向量数据库。后续用真实资料建立相关性样本后再调分词、切块、权重和阈值。

## 邮件接口

POST `/inquiries/:id/generate`：`{version,mode:"bm25"|"hybrid",confirmed:true}`。只将 SKU、产品目标、配置、包装偏好、合规要求和市场用于检索/生成，不发送邮箱、姓名、公司或私有备注。confirmed 明确允许相关需求与证据交给配置的外部服务处理。

成功返回 StoredInquiry：generator=rag、grounding（模型、时间、检索方式、引用）、email.status=pending_review；固定原询盘收件人，不自动审批/发送。再次生成替换草稿并撤销旧审核。原始六部分规则整理保持独立显示。

沿用 PATCH `/inquiries/:id` 保存主题/正文，POST `/approve` `{version,confirmed:true}` 审核，POST `/send` `{}` 发送已审核版本。发送成功只代表 SMTP 接收，不代表进入收件箱或客户阅读。超时/中断需核查发件记录，不能连续盲重试。

## 3D 接口

| 方法与路径（省略 /api/cms） | 用途 |
| --- | --- |
| GET /studio/status | 私有网关真实健康请求，图片/GPU 分开报告 |
| POST /studio/briefs | `{query,sku,locale,mode,confirmed:true}` → 带引用的设计提示和持久 brief ID，不执行图片生成 |
| POST /studio/concept-images | `{sku,prompt,specifications?,confirmed:true,briefId?}` → 方案图 ID 和管理端图片路径 |
| GET /studio/concept-images/:id | 管理会话保护的 PNG |
| POST /studio/jobs | `{sku,conceptImageId,seed?,specifications?,confirmed:true}` → 202、任务状态 |
| GET /studio/jobs/:id | queued/preparing/generating/finalizing/completed/failed、progress、文件路径 |
| GET /studio/jobs/:id/model | 完成后的 GLB，未就绪明确报错 |

可用 SKU：GT-AIRLESS-030、GT-DROPPER-030、GT-JAR-050、GT-MASK-FULL-025、GT-MASK-SPLIT-030。prompt 长 12–1200 字符；最多 12 个规格字段，每键 64/值 128 字符。seed 默认 1234。生成质量参数仍在私有 GPU 网关固定，不暴露浏览器调整。

使用生成简报时传回 briefId，服务端核对 SKU/提示原文/资料版本；人工自由设计提示可不传 briefId，不冒充资料生成结果。简报上限 1000 条。方案图与任务沿用 Python 网关已有内容缓存；Node 不自动重试生成请求，超时结果可能未知，先核查网关。图/模型下载采用固定网关路径与签名校验，不跟随上游返回的任意 URL。

Python 所有实际请求（包括健康检查）需要 `Authorization: Bearer STUDIO_GATEWAY_TOKEN`。生成还要求两侧 STUDIO_GENERATION_ENABLED=true 和 STUDIO_LICENSE_ACCEPTED=true。CORS 不作为鉴权；仅 CMS 可以持有令牌。公网站点不能直接调用这个私有网关。保留 GPT Image 2 + Hunyuan3D-2mini 现有方案；模型只是概念外观，不是可直接生产的 CAD/结构验证。

## 环境与接入顺序

参考 `deploy/aliyun/runtime.env.example`。生产由现有 systemd EnvironmentFile 注入；本地 Node 可用 `node --env-file=<私有环境文件> --import tsx services/content-admin/server.ts`。不要以为 tsx 会自动加载 .env.local。Python 启动脚本只读取列明的私有配置。

RAG_API_KEY、RAG_API_BASE_URL（默认 https://api.openai.com/v1）、RAG_MODEL、RAG_EMBEDDING_MODEL、可选 RAG_EMBEDDING_DIMENSIONS。未设置模型名时相应能力不启用，没有隐含模型替代。接口使用 `/embeddings` 和 `/responses` 严格 JSON schema，store:false、无工具。仅完成本地协议模拟，尚未用真实账户验证该模型的兼容性；store:false 也不等于供应商零保留，需确认数据处理协议。

STUDIO_GATEWAY_URL 只由运维配置，要求 HTTPS 或本机回环 HTTP；STUDIO_GATEWAY_TOKEN 两侧一致。Python 另需 OPENAI_API_KEY、STUDIO_MODEL_WORKER_URL 和 GPU 运行环境。2 GB 阿里云 Web 服务器不承担 GPU 推理；另行选 GPU 机器和核对模型的地区/用途/商业许可后才能启用。运行包包含网关源码，不包含 Python 虚拟环境、CUDA、模型权重或令牌。

接入顺序：配置专用 SMTP 并向自有测试邮箱验送达 → 配置文本/向量模型并做一次获准测试 → 录入少量真实资料并人工审核 → 对照 BM25/hybrid 的真实命中和引用 → 确认 GPU/图片费用、许可和网关健康 → 管理员生成样例。任何一项未完成都保持相应能力未接通。

## 本地验证与已知限制

测试覆盖解析、BM25、向量融合、配置缺失、草稿引用、资料撤销、固定收件人、人工审核、CMS 鉴权/CSRF、3D 网关令牌、付费开关和上游错误。真实邮件送达、实际模型质量、GPU 性能、复杂扫描件 OCR 仍待接入验证。

环境无真实资料时搜索应为空，不能把 tests/ 或隔离 QA 样本导入正式知识库。发布包白名单包含服务代码，不包含 CMS_DATA_DIR、原件、QA 数据、.env 或模型缓存。
