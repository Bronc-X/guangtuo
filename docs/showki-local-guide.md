# 修齐网站本地运行与配置

## 启动与查看

在项目根目录运行 `pnpm dev:all`，同时启动网站与本地业务服务。已有进程时无需重复启动；单独启动业务服务使用 `pnpm cms:start`。

- 网站：http://127.0.0.1:3000/zh/
- 包装工作室：http://127.0.0.1:3000/zh/studio/
- 本地业务服务：http://127.0.0.1:3111/api
- 留资查看：http://127.0.0.1:3000/admin/

## 问询顾问的大语言模型

配置位于项目根目录 `.env.development.local`，已被 Git 忽略。更改后重启网站与业务服务。

| 配置名 | 用途 |
| --- | --- |
| `RAG_API_BASE_URL` | 已有模型服务的 API 地址 |
| `RAG_MODEL` | 顾问使用的文本模型，当前为 `gpt-5.6-sol` |
| `RAG_API_KEY` | 服务端凭据，只在本地配置，不加入前端或提交 |
| `CMS_ALLOWED_ORIGIN` | 允许的网站来源，当前为 `http://127.0.0.1:3000` |
| `NEXT_PUBLIC_API_BASE_URL` | 浏览器连接本地业务服务，当前为 `http://127.0.0.1:3111/api` |

顾问读取完整对话，逐步补全需求，并将整理出的需求和原始对话一起交给留资表单。模型故障时显示可重试提示。留资保存到本地业务数据库；不会自动发送邮件，邮件须在后台确认。

## 联系方式和图片维护

公开联系方式统一在 `src/data/brand-contact.ts` 维护。微信号为 `13427620687`，对应二维码位于 `public/assets/contact/wechat-qr.png`；WhatsApp 和 TikTok 二维码在同一目录。Facebook 暂按提供的邮箱显示，不推测主页链接。

正式标志来自用户提供的 PDF，位于 `public/assets/brand/showki-logo.svg`。低清产品图的高清替换清单位于 `artifacts/showki-redesign/asset-replacements.json`。证书、二维码等原件保留真实内容。

## 3D 功能边界

现有包装提供乳液瓶、面霜罐、洁面瓶、真空瓶和玻璃精华瓶，可调整外观、查看开合、分享配置和下载 PNG。下载前必须成功提交留资。

“新造型”的自动 3D 生成依赖独立图像与 3D 工作服务。当前本机网关报告 `STUDIO_NOT_CONFIGURED`，GPU 工作服务尚未就绪；文本问询模型不能代替这项服务。后续配置请按 `services/hunyuan3d/README.md` 完成，不能将当前状态视为新造型生成已通过验收。

Juvyglow 页面提供的 YouTube 视频已嵌入关于我们；已确认播放器加载，实际播放取决于访问者的 YouTube 网络连接。
