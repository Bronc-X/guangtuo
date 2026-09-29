# 网站内容后台：本地运行与验收

当前后台由两个进程组成：Next.js 提供公开网站和 `/admin/` 界面，后台服务在本机 `localhost:3100` 提供登录、SQLite、草稿、图片和发布接口。可维护首页、固定页面、产品、膜型、专利资质和文章。

## 已配置的本机测试账号

- 登录地址：`http://localhost:3000/admin/`
- 用户名：`admin@guangtuo.local`
- 密码由本次交付单独提供，不写入仓库。
- 本机数据库：`%USERPROFILE%\.guangtuo-cms\content-admin.sqlite`

## 启动

```powershell
pnpm dev:all
```

如果网站已经在运行，只启动内容服务：

```powershell
pnpm dev:cms
```

## 首次创建其他环境的账号

没有默认密码。新环境必须显式提供管理员邮箱和至少 12 位密码：

```powershell
$env:CMS_ADMIN_USERNAME = 'owner@example.com'
$env:CMS_ADMIN_PASSWORD = 'replace-with-a-strong-password'
$env:CMS_ADMIN_NAME = '网站维护人'
pnpm cms:setup
Remove-Item Env:CMS_ADMIN_USERNAME,Env:CMS_ADMIN_PASSWORD,Env:CMS_ADMIN_NAME
```

## 建议验收顺序

1. 登录后确认左侧显示网站首页、网站页面、产品、膜型、专利资质、文章、图片与文件和发布记录。
2. 打开“网站首页”，修改标题并保存草稿；在新窗口查看网站，确认线上内容尚未改变。
3. 发布首页，刷新 `/zh/`，确认新标题出现。
4. 分别在“网站页面”“产品”“膜型”“专利资质”中修改一条内容，保存后确认状态为草稿，发布后刷新对应中文页面核对结果。
5. 上传 JPG、PNG 或 WebP 图片，确认能在图片库以及首页、产品、膜型、专利资质和文章编辑器中选择。
6. 新建文章，填写标题、摘要、分类、封面与正文并发布。
7. 打开 `/zh/insights/`，确认文章列表和详情页可访问。
8. 打开“发布记录”，确认上述发布均有时间与结果；退出登录后确认重新显示登录页。

## 交付边界

当前真实接入范围是首页首屏、6 个固定页面、21 款产品、41 种膜型、4 份专利资质、中文文章、图片与发布记录。网站结构、导航、字体、品牌色、产品稳定 ID 和 3D 参数仍由开发人员维护；多语言逐语种编辑、定时发布与历史版本恢复属于下一阶段功能。

SQLite、会话和草稿图片保存在仓库外；只有通过发布校验的 JSON 快照与图片副本进入公开站。正式上线需将 CMS 部署在带 TLS、持久存储、备份和同站域名的私有环境，并用发布任务触发静态站构建与部署。
