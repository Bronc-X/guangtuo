# 广拓生物概念品牌系统

## 状态与边界

本文件及 `public/assets/brand/`、`public/assets/products/` 内图片是为独立站原型生成的概念资产，不等同于客户已注册商标、正式品牌手册、真实产品照片、工程图或量产样品。客户正式资料到位后应按“品牌手册 > Cruip 合法组件 > 本概念系统”的顺序替换。

## 方向：Clinical Atelier / 临床美学工坊

- 核心印象：实验室可信度 + 美容包装精致感。
- 记忆锚点：可旋转包装主体 + 实验室规格轨道 + 材质色板。
- 标识概念：把字母 G / B、包装轮廓、液滴与叶片压缩为一个深生物绿与铜棕的组合图形；在确认商标可用性前只作为原型标识。
- 影像原则：真实摄影感、柔和实验室光线、无人物肖像、无功效宣称、无虚构认证、无第三方品牌。

## 默认 Token

| 用途 | 值 |
| --- | --- |
| 深生物绿 | `#15362E` |
| 暖实验室白 | `#F6F1E8` |
| 石墨黑 | `#1B1D1C` |
| 实验室灰 | `#D9DED9` |
| 铜棕强调 | `#A6532E` |
| 英文标题 | Cormorant Garamond |
| 中文标题 | Source Han Serif SC |
| 英文正文 | Manrope |
| 中文正文 | Source Han Sans SC |

## 已生成资产

- `public/assets/brand/guangtuo-mark-concept.png`：透明背景概念标识。
- `public/assets/brand/clinical-atelier-hero.png`：首页实验室主视觉。
- `public/assets/products/gt-airless-030.png`：真空瓶概念产品图。
- `public/assets/products/gt-dropper-030.png`：滴管瓶概念产品图。
- `public/assets/products/gt-jar-050.png`：面霜罐概念产品图。
- `public/assets/products/gt-mask-full-025.png`：整张单片面膜概念产品图。
- `public/assets/products/gt-mask-split-030.png`：上下分体水凝胶面膜概念产品图。

## 生成方式与提示约束

使用 Image 2 体系生成：统一要求高端化妆品包装编辑摄影、实验室白背景、深生物绿 / 象牙白 / 铜棕、无文字、无 Logo、无认证、无功效宣称，并分别指定真空瓶、滴管瓶、面霜罐、连续单片面膜、上下两个独立裁片面膜。整张与分体图片的裁片结构必须清晰可辨，避免用同一模型换图冒充两个建模范围。
