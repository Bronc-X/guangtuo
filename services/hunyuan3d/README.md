# 3D Studio 服务

## 面向客户的两条路径

1. **现有包装**：浏览器直接加载已审核、已压缩的 3D 预览，改颜色、材质和标识时不运行生成模型。
2. **新造型**：当前仅提供管理员受控生成接口，由 CMS 调用私有网关。公共访客付费生成尚未开放，不能把私有网关地址或令牌填到公开前端。

客户电脑不安装 CUDA、模型权重或生成服务，也不依赖项目开发机的显卡。RTX 5070 Ti 只是一台可用于开发验证的私有 worker；生产环境应把同一 worker 部署到受控 GPU 主机，并通过 `STUDIO_MODEL_WORKER_URL` 连接。

方案图示例 `public/assets/studio/new-shape-four-view-v1.png` 由 `image-2` skill 生成。网站运行时不会调用 Codex skill；动态方案图由 Studio API 使用服务端 `OPENAI_API_KEY` 调用图片接口。

## 生成与交付

- 内部 3D 配置锁定在服务端，浏览器不能修改引擎、步数或显存相关参数。
- 同一方案图和规格只运行一个任务；已完成结果可在网关重启后从磁盘缓存恢复。
- 对外方案图编号和任务编号均为随机 ID，内部缓存键不暴露给浏览器。
- 原始高精度模型作为母版保留在服务端；浏览器默认只下载约 10 万三角面的预览版。
- `/health` 只返回“方案图是否可用、3D 是否可用、是否繁忙和预计等待”，不返回硬件、模型或供应商信息。

当前结果仍是外观方向预览，不会自动得到准确尺寸、壁厚、公差、螺纹、泵头行程、密封结构、零件拆分、UV、材质贴图或可生产的 Logo 工艺区。正式产品仍需人工校形、工程确认、拆件、材质制作和网页性能验收。

## 本地启动

在项目根目录准备 `.env.local`：

```dotenv
OPENAI_API_KEY=
STUDIO_MODEL_WORKER_URL=http://127.0.0.1:8080
STUDIO_ALLOWED_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
STUDIO_GATEWAY_TOKEN=
STUDIO_GENERATION_ENABLED=false
STUDIO_LICENSE_ACCEPTED=false
```

分别启动私有 3D worker、Studio API 和网站：

```powershell
pnpm 3d:hunyuan:preflight
pnpm 3d:hunyuan:start
pnpm 3d:gateway:start
pnpm dev
```

访问 `http://127.0.0.1:3000/zh/studio/` 可查看现有包装。令牌未配置或未确认费用与许可时，私有生成接口明确报错。CMS 另需配置 STUDIO_GATEWAY_URL 与相同令牌，通过 `/api/cms/studio/*` 调用，详见项目 `docs/knowledge-mail-studio-api.md`。

## 生产部署

```text
客户浏览器 → 现有包装静态预览
管理员会话 → CMS /api/cms/studio → 私有鉴权网关 → 图片服务 / GPU worker
                                          → 母版 + 轻量预览缓存
```

保持 `NEXT_PUBLIC_STUDIO_API_URL` 为空。API 设置 `OPENAI_API_KEY`、`STUDIO_MODEL_WORKER_URL` 和 `STUDIO_GATEWAY_TOKEN`；健康检查也需要 Bearer 令牌。两侧都需要显式启用 STUDIO_GENERATION_ENABLED 与 STUDIO_LICENSE_ACCEPTED 后才可生成。网关只绑定回环地址，跨主机使用受控 HTTPS 通道和防火墙。

Studio API 不应部署成短时、无持久磁盘的函数。单实例使用当前磁盘缓存；多实例还需共享队列、数据库与对象存储，这部分基础设施尚未创建。Web 运行包只带网关源码，不带 Python 环境、模型权重或 GPU 运行时；需依照已验证的 GPU 环境单独部署。

输出目录：

- `studio-output/concepts/`：对外随机编号的方案图。
- `studio-output/concept-cache/`：内部方案图缓存索引。
- `studio-output/model-cache/<cache-key>/`：高精度母版与网页预览。

## 许可门禁

公开发布前必须重新核对所用 3D 模型及权重的地域、展示和商业使用边界，并保存书面结论；许可未通过时只能在授权范围内内部使用。
