# 后台编辑与聚合营销

## 编辑

- 首页、页面、产品、膜型、资质、文章保留手工换行。列表字段仍按“一行一项”处理，屏幕变窄时还会自然折行。
- 展示文字可设置 12–96 px 字号，预览立即更新；恢复默认可移除覆盖值。保存草稿不影响前台，发布后六种语言使用同一字号。
- 每个图片、二维码、文章封面和 PDF 字段可独立上传并自动选用，原素材库仍可复用。单文件上限 8 MB。

## 营销工作台

入口：后台 → 聚合营销。流程为输入关键词、抓取近七天新闻线索、填写产品事实、选择图片、生成八平台模板、编辑文案和字幕、合成、预览与下载。

视频使用本机 FFmpeg 和 Sharp，720×1280、24 fps、H.264/AAC，每屏 6 秒，无配音；初始字幕取主题与产品事实前 90 字，可人工改写。没有模型调用与外部视频服务费用。正文事实保留输入语言，中文和英文模板不会自行翻译事实。

“行业线索”来源为 Google News RSS，含来源、日期和原文链接，是近期相关新闻，不代表各社交平台热榜或热度排名。无结果和请求失败会显示状态。

已生成内容保存在私有 CMS 数据目录，视频必须登录才能读取；支持 MP4、TXT、JSON 导出。发送需明确选平台并确认，已有回执不自动重发，异常或中断显示“结果待核查”。

## 授权状态和接入

用户已选择先上线并显示待授权。当前八个平台均未绑定，不进行任何真实发送。Postiz 和国内浏览器发布器也未安装到小内存网站服务器。发送适配代码已编写，真实账号端到端验收需授权后进行。

- LinkedIn、Facebook、Instagram、YouTube、TikTok：通过 [Postiz](https://github.com/gitroomhq/postiz-app) 的公开 API 接入。可使用独立服务器自托管实例。`MARKETING_POSTIZ_URL` 以 `/api/public/v1` 结尾，密钥只放私有 runtime.env。应用权限和账号授权是实际发布的前提。
- 小红书、抖音：适配 [social-auto-upload](https://github.com/dreammis/social-auto-upload) 的 `check` / `upload-video` CLI；配置可执行文件、工作目录、账号名，并在发布器环境登录。登录过期仍需重新授权，SSH 密钥不能替代社交账号登录。
- 微信公众号：使用官方 token、永久封面、草稿、文章发布接口。需 AppID / AppSecret、IP 白名单和文章发布权限；图文发布不等于群发给订阅者，也不等于视频号。

接口参考：[Postiz 发布](https://docs.postiz.com/public-api/posts/create)、[上传文件](https://docs.postiz.com/public-api/uploads/upload-file)、[TikTok 设置](https://docs.postiz.com/public-api/providers/tiktok)。调研的 TrendRadar 侧重趋势，MoneyPrinterTurbo 相对本服务器资源需求较大；当前采用较轻的 RSS + 免费模板 + FFmpeg。

## 验证

- HTTP 集成检查覆盖六类内容的字号保存、发布和译文关联；拒绝无效尺寸及过期版本。
- 浏览器实际检查首页标题 32 px、简介 18 px，以及换行、空行、独立上传和自动选用。
- 真实合成视频通过 ffprobe：720×1280，18 秒，H.264 + AAC；检查过中文字幕画面。
- 发布适配器使用模拟接口验证任务结构、可见性、回执和公众号正文转义；未使用真实账号发送。

生产更新沿用服务器当前发布快照，不发布客户未发布草稿。服务器 SSH 已使用密钥连接，不需要阿里云登录二维码。

## 生产交付结果

- 2026-09-21 已部署：`/opt/showkibiotech/releases/showkibiotech-20260921-editing-marketing`。
- 静态代码版本：`/var/www/showkibiotech/code-showkibiotech-20260921-editing-marketing-v2`。内容发布编号仍为 `8de6e735-4b36-4773-8058-679ed78a6dab`，发布快照 SHA256 与部署前完全相同。
- 加密备份：`/root/showki-backups/showkibiotech-20260921-editing-marketing/cms-and-runtime.tar.gz.enc`；目录同时保留上一应用、静态目录指针和快照校验值。
- 49 个测试文件、250 项测试全部通过；TypeScript、ESLint、生产静态构建通过。
- 六语言首页、后台、健康接口均为 HTTP 200；匿名后台接口为 HTTP 401。线上首页实际计算样式为 `white-space: pre-wrap`，桌面无横向溢出。
- 以服务用户在服务器实际合成视频成功，新闻线索请求返回 14 条；八个平台状态全部为未授权。
- 客户确认先上线待授权版本。未登录客户社交账号、未发布任何营销内容、未调用文案模型。登录后的表单流程在独立测试库验收；生产检查保留客户数据不变。

## 旧后台界面反馈后的修正

用户截图仍没有字号、独立上传和营销导航。2026-09-21 14:57 检查生产 HTML 引用的 `app/admin/page-3122189d9883396b.js`，三个功能均存在，HTTP 200；但原后台入口没有 Cache-Control，旧页面/浏览器缓存仍可能保留旧版。

已在 Nginx 为 `/admin/` 及其路由数据设置 `Cache-Control: no-store, max-age=0`，保留安全响应头及带哈希静态资源的长期缓存。`nginx -t` 与配置测试通过；公网验证后台及 `/admin/index.html` 均带新缓存头。无需重启 CMS，也未修改客户数据。原 Nginx 配置备份在本次交付的私有备份目录。

使用 `https://showkibiotech.com/admin/?v=20260921` 重新进入，或对原页面强制刷新。此轮内置浏览器连接失败，未能核验用户现有登录页面；线上资源验证不能替代该项可见结果确认。
