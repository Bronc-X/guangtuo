# Buffer 注册、绑定与排期

入口：[后台 → 聚合营销 → 媒体排期](https://showkibiotech.com/admin/?v=20260922-buffer&view=marketing&marketing_panel=schedule)。

1. 打开 [Buffer](https://buffer.com)，注册账号，选择 **Free** 免费方案，完成邮箱验证。
2. 在 Buffer 的 **Channels** 添加需要发布的社媒，登录对应平台并授权。本站已对接 LinkedIn、Facebook、Instagram、YouTube、TikTok；免费版先选三个账号。不同平台的账号类型、授权和自动发布条件按 Buffer 的连接提示完成。
3. 打开 [API 设置](https://publish.buffer.com/settings/api)，依次选择 **Personal Access → Keys → New Key**。名称填 `SHOWKI`，权限勾选 `accountRead`、`postsRead`、`postsWrite`，选择有效期（长期使用可选 1 年）。生成后点击 **Copy key**。
4. 回到本站“媒体排期”，将密钥粘贴到 **Buffer API Key**，点击 **连接 Buffer**。工作区与社媒账号出现即表示连接成功。后续在 Buffer 添加账号后，点击 **刷新绑定账号**。
5. 选择已保存的营销内容、平台、图片或视频，设置北京时间，或者加入 Buffer 已设置好的队列。点击 **保存排期草稿**，在记录中选发布账号，点击 **确认并提交排期**。

视频需先在“视频与发布”完成合成。一个账号对应一条排期；多平台可分别安排时间。记录会保留发布时的文案与素材副本。刷新或退出页面不会取消已提交排期。

排期记录支持按日期、状态筛选；可以同步发布结果、取消未发布排期。需要修改时间时，先确认旧排期已取消，再创建新排期。“结果待核查”请先到 Buffer 查看，避免重复发布。平台需要手机确认或审核时，后台会显示相应状态。

**免费额度**：最多 3 个社媒账号，每个账号同时最多 10 条待发布内容；提供 1 个 API Key、每 30 天 3,000 次 API 请求。超过账号数或额度，再按实际需要选择付费方案。[Buffer 价格](https://buffer.com/pricing)、[API 说明](https://support.buffer.com/en-us/articles/what-is-buffers-api-GtIYIQilz5)。

**密钥管理**：只有工作区所有者可创建 Key，需先验证邮箱。过期、重新生成或撤销后，要在本站更新连接。密钥直接填后台，不要发到聊天中。[官方创建指引](https://support.buffer.com/en-us/articles/how-to-create-your-buffer-api-key-ShIgYVwM6j)。

公众号、小红书、抖音不经过这次 Buffer 接入，继续使用各自的发布通道。

## 交付边界

已实现：服务器持久化排期草稿、连接验证、固定北京时间 / Buffer 队列、图片和视频副本、提交防重、明确失败后的手动重试、未知回执保护、取消、发布状态同步、私有素材的限权访问链接。后台定时查询有退避及次数上限；实际定时发布由 Buffer 执行。

账号尚未创建和授权。自动化检查与本地模拟流程不代表真实平台已发布；正式账号连接后，仍需用一条客户确认的内容完成首条发布验收。
