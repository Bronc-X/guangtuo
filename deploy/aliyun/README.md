# 阿里云香港完整站点部署

目标域名：`showkibiotech.com`、`www.showkibiotech.com`

正式交付必须同时部署 static 与 runtime 两个包。只上传静态包可以浏览页面，但不能保存询盘、登录后台、发送邮件或发布更新。不需要 AWS。

## 后台与询盘服务

1. 将 `*-runtime.tar.gz` 解压至 `/opt/showkibiotech/app`。不要把 runtime 包放在 Nginx 网站根目录。
2. 运行 `/opt/showkibiotech/app/deploy/aliyun/bootstrap-runtime.sh`。脚本安装 Node 24.19.0（官方下载并校验 SHA256）、pnpm 11.19.0、Nginx、证书工具和完整构建依赖。2 GB 实例无 swap 时会创建 2 GB swap，已有文件不覆盖。
3. 检查 `/etc/showkibiotech/runtime.env`，保持权限 `root:showkibiotech 0640`。服务数据放在 `/var/lib/showkibiotech/cms`，不能被 Nginx 直接访问。
4. 在服务器终端创建唯一管理员。密码不要写入命令历史或截图：

```bash
cd /opt/showkibiotech/app
read -r -p 'Admin username: ' CMS_ADMIN_USERNAME
read -r -s -p 'Admin password (at least 16 characters): ' CMS_ADMIN_PASSWORD
export CMS_ADMIN_USERNAME CMS_ADMIN_PASSWORD
export CMS_DATA_DIR=/var/lib/showkibiotech/cms
export CMS_PUBLISHED_CONTENT_PATH=/var/lib/showkibiotech/cms/published-content.json
sudo --preserve-env=CMS_ADMIN_USERNAME,CMS_ADMIN_PASSWORD,CMS_DATA_DIR,CMS_PUBLISHED_CONTENT_PATH -u showkibiotech /usr/local/bin/node --import tsx scripts/cms-setup.ts
unset CMS_ADMIN_PASSWORD CMS_ADMIN_USERNAME
sudo systemctl enable --now showkibiotech-cms
```

5. 按下文部署初始 static 包、设置 DNS 和 HTTPS。后台入口为 `https://showkibiotech.com/admin/`，后台端口 3111 只绑定回环地址，不在阿里云防火墙开放。
6. 验证 `/api/health` 返回 `status: ok`，未登录访问 `/api/cms/inquiries` 返回 401；浏览器提交测试询盘后应出现在后台。只使用获准的测试邮箱。

### 发布与回退

后台点击发布后，接口立即返回发布编号，页面轮询发布记录直至成功或失败。服务将草稿写入独立构建目录，运行静态构建、检查产物，成功后切换 `/var/www/showkibiotech/current`。Linux 的软链接切换是原子的；构建失败时旧网站继续服务。失败记录和草稿保留，核对发布记录后可重试。`release.json` 提供可核对的发布编号。构建日志在私有数据目录的 `builds/<releaseId>/build.log`。

小内存主机使用单工作进程、Webpack 内存优化及服务内存上限。构建单独采用 `CMS_BUILD_NODE_OPTIONS=--max-old-space-size=1280`，并运行在启用 linger 的 `showkibiotech` 用户 scope 内，以低 CPU/I/O 优先级和读写限速隔离后台 API。服务设置 `ProtectHome=read-only` 并单独屏蔽 `/home`、`/root`，保留访问 `/run/user` 总线的能力。服务的 `MemoryHigh` 为 1400 MB、`MemoryMax` 为 1550 MB。2 GB swap 与 `vm.swappiness=60` 允许冷内存页及时换出；不能只创建 swap 而保留 `swappiness=0`。服务中断后，未完成的发布会显示失败提示，草稿保留；重试前核对线上版本。

不要并行运行手工部署和后台发布。发布期间不要修改 runtime 源码。每次代码更新须重新上传配套 runtime 与 static 包，先备份数据，再重启服务。内容发布不需要重新安装依赖。

仅更新代码并沿用现网已发布内容时，打包前设置 `CMS_PACKAGE_SNAPSHOT_PATH` 指向备份的现网内容快照，并设置 `CMS_PACKAGE_KEEP_CONTENT_RELEASE=1`。这样新静态文件继续标记现有内容发布编号，便于与后台发布记录核对。

旧版本目录保留，可人工将 `current` 切回确认过的版本。回退网站时还需同步该版本的内容快照和数据库发布记录，不应直接编辑 SQLite 文件。若提示“网站已部署，但发布记录同步失败”，不要重复发送或连续发布，先核对 `release.json` 与私有日志。

### 邮件

在私有环境文件中完整设置 `SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD / SMTP_FROM`，然后重启服务。仅支持 TLS 465 或强制 STARTTLS 587，证书校验不能关闭。使用专用发件邮箱，配置 SPF/DKIM/DMARC 后再做真实送达测试。

未配置 SMTP 时询盘仍保存，邮件保持未发送。后台需先核对并确认当前版本，再二次确认发送。编辑会撤销旧确认。最多三次人工发送尝试；超时或进程中断可能已有服务端接收记录，重试前先核对发件服务，避免重复邮件。“发件服务已接收”不等于收件箱送达或客户阅读。

### 数据备份

上线前与每次代码更新前备份 SQLite（使用 SQLite 在线备份或停止 CMS 后复制数据库及 WAL）、`inquiry-access.key`、`draft-media`、`public-media`、内容快照和私有环境文件。备份需加密保存在非网站目录，不要加入交付包。不要只备份网站静态文件。

### AI 新造型

普通 2 核 / 2 GB 主机只运行网站和内容/询盘服务，不运行 GPU 生成。第一版 `NEXT_PUBLIC_STUDIO_API_URL` 留空，五款现有 3D 包装照常工作。只有确认图片服务凭据、独立 GPU worker、模型许可、访问控制与费用上限后才能开放新造型生成；不能把开发机 localhost 地址写入正式构建。

网关代码与部署要求见 `services/hunyuan3d/README.md`。需要运行网关时单独从仓库提供其运行文件，不能将模型权重、虚拟环境或 API 密钥打入网站包。当前 UI 支持失败重查与同一浏览器 24 小时内恢复已有任务，不会在恢复时自动启动付费生成。

## 首次静态版本、DNS 与 HTTPS

1. 在轻量应用服务器防火墙中开放 TCP `80` 和 `443`。
2. 把以下文件上传到服务器同一目录：
   - `showkibiotech-static-YYYYMMDD.tar.gz`
   - `bootstrap.sh`
   - `deploy-static.sh`
   - `nginx-showkibiotech.conf`
3. 执行：

```bash
chmod +x bootstrap.sh deploy-static.sh
./bootstrap.sh ./nginx-showkibiotech.conf
./deploy-static.sh ./showkibiotech-static-YYYYMMDD.tar.gz
```

4. 在阿里云 DNS 中添加两条 A 记录，记录值均为新服务器公网 IPv4：
   - `@`
   - `www`
5. DNS 生效并确认 HTTP 可访问后申请 HTTPS：

```bash
sudo certbot --nginx -d showkibiotech.com -d www.showkibiotech.com --redirect
```

6. 验证首页、语言页、产品页、`robots.txt`、`sitemap.xml` 和 HTTPS 自动续期。

以上 `deploy-static.sh` 仅用于首次版本或人工上传代码版本。日常客户内容更新应使用后台发布。启用 runtime 后，必须让 `showkibiotech` 用户拥有 `/var/www/showkibiotech` 的写权限；不要将整个站点根目录改回只允许 root 写入。
