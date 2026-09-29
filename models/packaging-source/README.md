# 红点包材 Blender 源文件

每个 `.blend` 文件对应手册中的一个“型号 × 容量”记录。完整清单、手册页码、型号、容量和材质见 [`docs/packaging-brochure-variants.json`](../../docs/packaging-brochure-variants.json)。同一型号有多个容量时，文件名附带容量，例如 `HD-998-300ML.blend`；网页仍显示手册型号 `HD-998`。

模型按手册照片制作，用于网页旋转预览和外观选型。瓶身、盖子、泵头等可见部件分别建模，用户可在 Studio 中调整颜色、表面效果和印字。手册没有提供完整尺寸、壁厚、螺纹或公差；这些源文件不能代替厂家工程图或实样。所有新款目前处于外观复核阶段。

网站使用的 GLB 位于 `public/models/packaging/`，正面预览图位于 `public/assets/packaging/`。修改源文件后，使用 `scripts/blender/` 下相应的生成脚本重新导出网页资源。
