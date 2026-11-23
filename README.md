# YX拼图 · 图片拼接工具

一个**纯前端、零依赖**的在线图片拼接工具：设置画布尺寸 → 选择排列方式 → 自由拖拽缩放 → 插入文字 → 导出高清长图。
所有图片处理都在浏览器本地完成，**图片不上传服务器、不存储、不打水印**。

![YX拼图界面](screenshot-home.png)

---

## 快速开始

```bash
# 启动本地服务器（Node 18+，无任何 npm 依赖）
node serve.js          # 默认 http://localhost:5173
node serve.js 8080     # 指定端口
```

也可以直接用任意静态服务器（Nginx / Vercel / Netlify / GitHub Pages 均可）。
> 注意：项目内使用了 `/assets/...` 绝对路径，请把站点根目录指向本目录。

---

## 功能一览

| 需求 | 实现 |
| --- | --- |
| 快捷设置画布大小 | 8 个比例按钮：16:9、9:16、4:3、3:4、1:1、3:2、2:3、5:4；也可手填任意宽高（64–8000 px） |
| 横向 / 纵向排列 | 「排列方式」分段控件 + 一键「应用到图片」，等比缩放不裁切、不变形 |
| 自由拖拽图片位置 | 鼠标拖动 + 边缘/中心吸附参考线；支持多选、框选、方向键微调 |
| 自由放大 | 八向控制点等比缩放（角点默认锁定比例，Shift 解除），顶部圆点旋转 |
| 自由添加图片 | 文件选择、拖拽文件到画布、批量导入；支持 JPG/PNG/GIF/WebP/AVIF/BMP |
| 任意位置插入文字 | 独立文字图层，可设置字号、颜色、字体、字重、对齐、行高、阴影 |
| 良好的 SEO 支持 | 静态 HTML 内容 + JSON-LD 结构化数据 + OG/Twitter 卡片 + sitemap/robots + 语义化标签 |

### 附加能力

- **撤销 / 重做**：Ctrl+Z / Ctrl+Y（最多 100 步）
- **导出**：PNG / JPEG / WebP，1× / 2× / 3× 倍率（2× 即 4K）
- **工程存取**：保存为 JSON，随时打开继续编辑
- **图层面板**：显示 / 隐藏、点击选中
- **快捷键**：`Delete` 删除 · `Ctrl+D` 复制 · `Ctrl+A` 全选 · `Ctrl+S` 保存工程 · 滚轮缩放 · `空格 + 拖拽` 平移

---

## 目录结构

```
.
├── index.html              主页面（工具 + SEO 内容区）
├── about.html              关于工具
├── guide.html              使用教程
├── faq.html                常见问题
├── privacy.html            隐私政策
├── 404.html                404 页（noindex）
├── robots.txt  sitemap.xml  manifest.webmanifest
├── serve.js                零依赖静态服务器
├── assets/
│   ├── css/style.css       设计系统 + 应用界面 + 内容区样式
│   ├── js/
│   │   ├── store.js        状态、撤销/重做、图片缓存
│   │   ├── elements.js     元素模型、文本排版、几何与命中检测
│   │   ├── render.js       Canvas 绘制（画布 / 选中框 / 导出共用）
│   │   ├── arrange.js      横向 / 纵向 / 网格自动排列
│   │   ├── exporter.js     导出图片、保存与打开工程
│   │   ├── ui.js           面板绑定、属性检视器、图层列表、导出弹窗
│   │   └── main.js         指针交互、缩放平移、快捷键、文件拖入
│   └── img/                favicon / logo / og 图（由脚本生成）
└── tools/
    ├── gen-images.js       无依赖生成 PNG 资源
    └── selftest.js         端到端自测（Chrome DevTools Protocol）
```

---

## 开发脚本

```bash
node tools/gen-images.js   # 重新生成 og-home.png / logo-512.png / apple-touch-icon.png / favicon.svg
node tools/selftest.js     # 启动无头 Chrome 跑 43 项端到端断言（无需任何 npm 依赖）
```

`selftest.js` 覆盖：初始化、比例预设、三种排列的数学正确性（等宽/等高/不裁切/不出画布）、
文字换行与高度计算、旋转后的命中检测、撤销重做、导出像素、真实鼠标拖拽与角点缩放、
导出弹窗、窄屏无横向溢出，以及 SEO 元信息与 JSON-LD 校验。

---

## 上线前必做

站点域名已设为 **https://stitch.yanxv.com** （canonical / OG / Twitter / JSON-LD / sitemap / robots 已全部同步）。

1. **配置域名解析与 HTTPS**：把 `stitch.yanxv.com` 指向部署环境，并签发证书（Let's Encrypt 即可）。
2. **替换社交卡片图**：`assets/img/og-home.png`（1200×630）为自动生成的示意图，建议换成带文案的真实产品图。
3. **核对 JSON-LD**：结构化数据中未包含 `aggregateRating`（虚构评价会违反 Google 指南）。如后续接入真实用户评价，再按实际数据添加。
4. **更新 `sitemap.xml` 的 `lastmod`** 与 `manifest.webmanifest` 中的站点信息。
5. 给静态资源加长缓存（`Cache-Control: public, max-age=31536000, immutable`），HTML 设 `no-cache`。
6. 上线后到 [Google Search Console](https://search.google.com/search-console) 与 [Bing Webmaster](https://www.bing.com/webmasters) 提交 `https://stitch.yanxv.com/sitemap.xml`。

---

## 浏览器支持

Chrome / Edge / Firefox / Safari 近两年版本。移动端为单指拖动、双指缩放（画布区域已关闭浏览器默认手势）。

---

## 许可

代码可自由用于个人与商业项目。
