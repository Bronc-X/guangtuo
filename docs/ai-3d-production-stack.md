# AI 3D 生产技术栈决策

## 已生效结论

广拓项目第一阶段主 3D 生成引擎确定为 **Hunyuan3D-2mini**，由私有 GPU worker 执行。开发阶段可使用本机显卡验证；生产客户只连接托管的 HTTPS Studio API，不连接开发机，也不承担任何生成计算。TripoSG 暂停，不进入默认启动、网站 Studio 或部署链路；其代码、权重记录和评测结果仅作为历史证据与回滚材料保留。

正式生成契约固定为：

```text
provider: Hunyuan3D-2mini
steps: 50
guidance: 5.0
octree_resolution: 384
seed: 1234（可按任务调整）
native_mesh: preserved
web_preview_faces: 100000
TripoSG: disabled
```

模型选择与质量参数只存在于服务端。前端请求只包含产品编号、方案图编号、规格与随机种子，不能切换模型或改变 worker 参数。

## 生产链路

```text
文字需求与规格 → GPT Image 2 方案图 → 用户确认
  → Hunyuan3D-2mini 生成原生高精度几何母版
  → 保存母版与任务参数；同时自动派生约 10 万面的网页预览
  → 几何质检：轮廓、浮片、孔洞、法线、封闭性、部件完整性
  → Blender / CAD 人工校尺寸、拓扑、零件拆分、UV 和 Logo 区域
  → 生成网站性能派生版：glTF-Transform / KTX2
  → Khronos glTF Validator
  → 人工批准的 GLB + Configurator Manifest
  → Three.js / React Three Fiber / Drei 360°展示
```

高精度母版与网站交付版是两个资产层级：母版保存 AI 原始几何证据，不能被较低面数文件覆盖；网站交付版必须从已人工审核的母版或 CAD 资产派生，并独立记录版本与哈希。

## 选型状态

| 方案 | 当前用途 | 状态 | 关键边界 |
| --- | --- | --- | --- |
| Hunyuan3D-2mini | 私有 worker 图片转高精度几何母版 | **主引擎** | 单图结果仍需修模、拆件、尺寸与工程确认；全球公开使用前完成许可证门禁 |
| 参数化建模 / CAD | 正式可配置 SKU 与量产结构依据 | **正式交付层** | 需要客户工程数据或人工建模，不属于“AI 自动生成即可量产” |
| Meshy API | 外部云端备选 | 暂不接入 | 涉及云端处理、成本和数据驻留；只有新决策后才评估 |
| TripoSG | 历史质量对照 | **暂停** | 默认 Compose profile 已禁用，不参与前后端请求和部署 |

技术评测已证明：在三个相同 SKU、相同输入和相同最终三角面预算下，Hunyuan3D-2mini 的包装轮廓与结构恢复明显优于 TripoSG。完整数据见 `artifacts/model-eval/DECISION.zh-CN.md`。

## 网站端实现

- Studio 通过 `NEXT_PUBLIC_STUDIO_API_URL` 连接托管网关；开发环境未配置时才回退到 `127.0.0.1:8091`，生产构建不会连接客户本机。
- Studio API 通过私有的 `STUDIO_MODEL_WORKER_URL` 连接 GPU worker；同一请求合并执行，并可从持久缓存恢复。
- Studio 保存 50 步、octree 384 的原生无纹理母版，同时派生约 10 万面的浏览器预览；浏览器不会下载母版。
- 公开产品页继续加载人工审核的独立零件 GLB；Hunyuan 白模不会自动替换线上 SKU。
- Three.js + React Three Fiber + Drei 负责 360°旋转、材质状态、Logo 预览和相机控制。
- Logo 上传仅接受 PNG / JPEG / WebP、最大 2 MB，在浏览器内预览，不放入 URL、日志或公共对象存储。
- 整张单片与上下分体面膜继续使用不同 `geometryId`，不能互换。
- 首屏显示海报，用户主动打开后加载 WebGL；无 WebGL 时回落到产品效果图和参数表。

## 双层资产门禁

### A. 混元原生母版

1. 保留原生面数，不用网页预览覆盖原始输出。
2. 记录 SKU、输入图哈希、模型版本、steps、guidance、octree、seed、生成时间和 GPU。
3. 检查连通体、浮片、孔洞、法线、封闭性、轮廓与零件缺失。
4. 标记为 `concept-master`，不能直接成为工程图、打样批准或开模依据。

### B. 网站正式 GLB

1. 从经人工批准的母版或 CAD 资产派生；建议单 SKU 不超过 5 MB、约 10 万三角面、1K/2K KTX2 贴图。
2. 坐标、真实比例、法线、UV、透明排序、零件命名和 Logo 区域通过检查。
3. 每款最多 6 组参数、每组最多 6 项、总有效选项不超过 24。
4. 所有预设逐一截图验收，Khronos Validator 无阻断错误后才能发布。

## 法律与业务边界

选择混元是技术路线决定，不代表许可证门禁已经自动通过。全球公开发布前必须保存适用于目标市场、展示 Output 和商业使用的书面核查结论。许可证未通过时，混元只在授权地域和授权用途内作为内部几何草案工具。

无论使用何种 AI 3D 引擎，输出都不自动包含准确尺寸、壁厚、公差、螺纹、泵头行程、密封、材料相容性、印刷工艺或量产可行性，最终必须人工和工程确认。
