# 商务与机会、方案与报价

## 使用入口

后台左侧新增「12 商务与机会」「13 方案与报价」。沿用现有管理员登录和 CSRF 保护，数据保存在服务器私有 SQLite，不进入公开网站或六语言发布快照。

商务模块打开时自动同步独立站询盘，每批最多 1,000 条，可继续点击刷新。原询盘和邮件仍由原模块管理。可新增线索、导入 UTF-8 CSV、按阶段筛选、搜索客户、记录负责人、需求、下一步及跟进日期。公开线索与收到咨询分别标记。CSV 每批最多 200 条，以 externalId 去重，重复导入不覆盖已编辑的商机；先验证整批，再事务写入。

CSV 下载模板包含 externalId、name、company、contact、platform、kind、sourceUrl、requirements。还可增加 market、stage、owner、nextAction、nextDate、notes。platform 使用界面列出的中文/英文平台名；kind 为 public 或 inbound；stage 为 new / qualified / contacted / quoted / won / lost；nextDate 为 YYYY-MM-DD。来源链接仅接受 HTTP(S)。

## 免费与外部接口范围

- 无新增 API 费用：网站询盘同步、人工录入、CSV 导入、跟进、模板文件、金额计算及打印版导出。没有模型调用。
- 已实现 Chatwoot 会话列表适配器，尚未配置客户账号。支持手动按页导入已授权收件箱的客户资料和当前返回的公开入站消息；不会导入坐席密钥、内部私密备注或发出消息。不是完整双向客服系统，也不保证 Chatwoot 覆盖所有八个平台。重复会话保留原商机，后续沟通在原收件箱继续处理。
- 已实现 TikHub 指定 TikTok 视频首批公开评论适配器。未配置密钥、未启用、未真实联网验收。请求需服务端开关和界面确认；不后台轮询，不自动付费，不爬取私信。不代表其它 TikHub 平台接口也已适配。
- TikHub 官方提供有限新用户额度，并按端点收费；接口是否支持赠送额度应先在其控制台核实，不能宣传为永久免费。
- TarSocial 未找到可核实的公开接口规范，本次选择 TikHub，没有虚构 TarSocial 接口。
- Postiz/聚合营销负责发布，与本模块收件箱、公开线索采集分开管理。

服务端配置见 `.env.example`：

```
BUSINESS_CHATWOOT_URL=https://your-inbox.example.com
BUSINESS_CHATWOOT_ACCOUNT_ID=账号数字ID
BUSINESS_CHATWOOT_TOKEN=私有令牌
BUSINESS_TIKHUB_TOKEN=私有令牌
BUSINESS_TIKHUB_ENABLED=false
BUSINESS_TIKHUB_DAILY_LIMIT=5
```

密钥只放 `/etc/showkibiotech/runtime.env` 等私有服务环境，禁止写入公开配置或 NEXT_PUBLIC。TikHub 开关默认关闭；启用前确认具体端点额度和成本授权。每日上限为本后台的请求次数限制（UTC 日期），不是 TikHub 余额或免费额度；最大 50 次，失败或超时仍占次数，重启不会重置当天计数。请求固定官方主机；Chatwoot 使用管理员配置的 HTTPS 主机，拒绝重定向，20 秒超时、2 MB 响应上限。接口未知形状按失败处理，不伪装成空结果。

## 文件工作流

选择商机 → 生成合作方案/报价单/合同草稿 → 填写产品规格、单价、整数数量、币种、主体、有效日期、交付、付款与条款 → 保存 → 人工复核 → 下载打印版。

报价或方案可生成同一商机的关联合同，继承已保存的价格与条款，独立保存原文件。生成时保存客户快照，不因后来修改商机而悄悄覆盖文件。版本冲突返回 409，编辑会撤销复核。复核不等于发送、签署或合同生效。没有自动邮件、电子签约、支付、汇率转换，也没有默认承诺价格、交期、公司主体或法律条款。

金额用最小货币单位计算；税率最多两位小数，按折后商品小计计税，运费单独加总不另计税。总价四舍五入到分。空价格显示待填写；显式 0 表示零价；折扣不允许超过已完整填写的商品小计。仅支持 CNY/USD/EUR/GBP，单价小于一百万，每项数量 1–100,000，最多 100 项。

下载格式是独立 HTML 打印版，包含价格表和合同签署空栏，打开后可用浏览器打印另存 PDF；不是伪装的 Word/PDF 文件。内容进行 HTML 转义，换行保留，草稿和复核状态明确。需要真实单价与双方确认条款后才能用于具体业务。

## 验证

- `pnpm exec vitest run`：50 个文件，261 项通过。
- 最后导航与保存修正后重跑 `tests/admin-console.test.ts`、`tests/content-admin/business.test.ts`：19 项通过。
- `pnpm exec tsc --noEmit` 通过。
- `pnpm exec eslint . --ignore-pattern '.venv-translation/**'` 通过。直接全目录 lint 会误检查第三方 Python 环境内 torch 的 JS，产生既有错误，未修改第三方依赖。
- 隔离本地后台浏览器验收：新增商机、生成报价、保存、复核、关联合同、CSV 错误提示与成功导入；2000 × 0.25 = USD 500.00；空行和换行保存与预览一致。手机 390px 无整页横向溢出；桌面 1440px、760px 高度导航可滚动访问所有模块。
- 下载端点实际返回 HTML、200 与 no-store；匿名导出被拦截。外部接口仅使用假响应验证，未消耗客户服务额度。
- 测试数据和截图位于 `artifacts/business-qa-20260921/`，不部署到生产。

## 正式部署结果

已通过 SSH 部署 `showkibiotech-20260921-business-commercial`。应用目录 `/opt/showkibiotech/releases/showkibiotech-20260921-business-commercial`，静态目录 `/var/www/showkibiotech/code-showkibiotech-20260921-business-commercial-v2/releases/100152da-1eff-4885-838f-b769e0aeb66b`。切换前做了加密备份，切换过程具备失败恢复指针。

线上六语言页面、后台入口与 health 全部返回 200，三条新私有接口匿名访问返回 401。生产 SQLite 已创建三个新表；实际对外提供的后台 JS 含两个新菜单，后台 HTML 保持 no-store。生产已发布内容 SHA-256 与构建前快照一致，未覆盖客户修改。Chatwoot 与 TikHub 配置检查均为 false，没有第三方调用。生产客户账号登录后的交互未代为操作；完整交互验收在隔离后台完成。

入口：https://showkibiotech.com/admin/?v=20260921-business
验证记录：`artifacts/business-deploy-20260921/verification.json`。

官方接口参考：

- https://developers.chatwoot.com/api-reference/conversations/conversations-list
- https://docs.tikhub.io/186826063e0
- https://tikhub.io/pricing
