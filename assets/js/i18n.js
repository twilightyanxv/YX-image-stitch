/* ============================================================
   i18n.js —— 中英文切换（默认跟随浏览器语言）
   ============================================================ */
(function () {
  'use strict';

  var App = (window.App = window.App || {});

  /* 中文原文 → 英文译文 */
  var DICT = {
  "图片拼接工具 - 免费在线多图拼接、排版合成高清长图 | YX拼图": "Image Stitching Tool - Free Online Multi-Image Collage, Layout & HD Long Image Maker | YX Stitch",
  "免费在线图片拼接工具：横向、纵向、网格自由排版，自由拖拽缩放图片，任意位置插入文字并设置字号颜色，支持 1920×1080、1080×1920、4:3、3:4 等常用画布比例，一键导出高清 PNG/JPEG，全部在浏览器本地完成，图片不上传不泄露。": "Free online image stitching tool: arrange images horizontally, vertically or in a grid, drag and resize freely, insert text anywhere with full font and color control, supports common canvas ratios such as 1920x1080, 1080x1920, 4:3 and 3:4, and exports high-resolution PNG/JPEG in one click. Everything runs locally in your browser - images are never uploaded.",
  "图片拼接,多图拼接,图片拼接工具,长图拼接,九宫格拼图,拼图软件,在线拼图,图片排版,图片合成,图片加文字,免费拼图工具": "image stitching,multi image collage,image stitcher,long image maker,nine grid collage,collage software,online collage,image layout,image composition,add text to image,free collage tool",
  "YX拼图": "YX Stitch",
  "图片拼接工具 - 免费在线多图拼接、排版合成高清长图": "Image Stitching Tool - Free Online Multi-Image Collage, Layout & HD Long Image",
  "横向、纵向、网格自由排版，拖拽缩放图片，任意位置插入文字，一键导出高清大图。全部本地处理，图片不上传。": "Arrange images horizontally, vertically or in a grid, drag and resize freely, insert text anywhere, and export high-resolution images in one click. Everything is processed locally - images are never uploaded.",
  "YX拼图图片拼接工具界面预览": "Preview of the YX Stitch image stitching tool interface",
  "横向、纵向、网格自由排版，拖拽缩放图片，任意位置插入文字，一键导出高清大图。": "Arrange images horizontally, vertically or in a grid, drag and resize freely, insert text anywhere, and export high-resolution images in one click.",
  "跳转到拼接工具": "Skip to the stitching tool",
  "YX拼图 首页": "YX Stitch - Home",
  "完全免费，自由排版，纯本地处理": "Free forever, free layout, 100% local processing",
  "主导航": "Main navigation",
  "使用教程": "User Guide",
  "常见问题": "FAQ",
  "关于工具": "About",
  "开始使用": "Get Started",
  "图片拼接工具": "Image stitching tool",
  "免费在线图片拼接工具": "Free online image stitching tool",
  "工具面板": "Tool panel",
  "添加内容": "Add content",
  "添加图片": "Add images",
  "添加文字": "Add text",
  "画布尺寸": "Canvas size",
  "宽度 (px)": "Width (px)",
  "高度 (px)": "Height (px)",
  "画布背景色": "Canvas background",
  "排列方式": "Arrangement",
  "横向": "Horizontal",
  "纵向": "Vertical",
  "网格": "Grid",
  "自由": "Free",
  "间距": "Gap",
  "列数": "Columns",
  "应用到图片": "Apply to images",
  "提示：也可以直接用鼠标把图片拖到任意位置。": "Tip: you can also drag images anywhere with the mouse.",
  "图层": "Layers",
  "画布编辑区": "Canvas editing area",
  "0 个元素": "0 elements",
  "撤销 (Ctrl+Z)": "Undo (Ctrl+Z)",
  "撤销": "Undo",
  "重做 (Ctrl+Y)": "Redo (Ctrl+Y)",
  "重做": "Redo",
  "适应窗口": "Fit to window",
  "导出图片": "Export image",
  "松开鼠标即可添加图片": "Release the mouse to add images",
  "缩小": "Zoom out",
  "重置为 100%": "Reset to 100%",
  "放大": "Zoom in",
  "滚轮缩放 · 空格 + 拖拽平移 · Delete 删除 · Ctrl+Z 撤销": "Scroll to zoom · Space + drag to pan · Delete to remove · Ctrl+Z to undo",
  "属性面板": "Properties panel",
  "属性": "Properties",
  "收起属性面板": "Collapse properties panel",
  "未选中元素": "No element selected",
  "点击画布上的图片或文字即可编辑属性": "Click an image or text on the canvas to edit its properties",
  "点击「添加图片」批量导入本地图片，也可直接拖入画布": "Click 'Add images' to import local images in batches, or drag them straight onto the canvas",
  "左侧选择横向 / 纵向 / 网格，一键自动排版": "Pick horizontal / vertical / grid on the left to lay out images in one click",
  "拖动图片自由摆放，拖角缩放、拖圆点旋转": "Drag images to place them, drag corners to resize, drag the dot to rotate",
  "「添加文字」可在任意位置插入说明文字": "'Add text' inserts a caption at any position",
  "位置与尺寸": "Position and size",
  "宽": "W",
  "高": "H",
  "旋转 (°)": "Rotation (°)",
  "不透明度": "Opacity",
  "图片": "Image",
  "圆角": "Corner radius",
  "填充方式": "Fill mode",
  "裁剪填充": "Crop to fill",
  "完整显示": "Fit entirely",
  "拉伸铺满": "Stretch to fill",
  "替换图片": "Replace image",
  "重置尺寸": "Reset size",
  "文字": "Text",
  "内容": "Content",
  "输入文字内容": "Enter your text",
  "字号": "Font size",
  "颜色": "Color",
  "字体": "Font",
  "系统默认（黑体）": "System default (sans-serif)",
  "微软雅黑": "Microsoft YaHei",
  "苹方": "PingFang SC",
  "宋体": "SimSun",
  "黑体": "SimHei",
  "楷体": "KaiTi",
  "仿宋": "FangSong",
  "隶书": "LiSu",
  "等宽": "Monospace",
  "字重": "Font weight",
  "纤细": "Light",
  "常规": "Regular",
  "中等": "Medium",
  "加粗": "Bold",
  "特粗": "Extra bold",
  "对齐": "Alignment",
  "左对齐": "Left",
  "居中": "Center",
  "右对齐": "Right",
  "行高": "Line height",
  "文字阴影": "Text shadow",
  "无": "None",
  "柔和": "Soft",
  "强烈": "Strong",
  "操作": "Actions",
  "复制": "Duplicate",
  "置顶": "Bring to front",
  "置底": "Send to back",
  "删除元素": "Delete element",
  "图片拼接工具需要启用 JavaScript 才能使用。请在浏览器设置中开启 JavaScript 后刷新页面。": "The image stitching tool needs JavaScript. Please enable JavaScript in your browser settings and refresh the page.",
  "本工具仅可用于个人项目，不可用于商业项目；如需商业使用，请发送邮件至": "This tool is for personal projects only and must not be used for commercial projects; for commercial use, please email",
  "取得授权。": "to request authorization.",
  "页脚导航": "Footer navigation",
  "关于": "About",
  "文档": "Document",
  "关闭": "Close",
  "文件格式": "File format",
  "PNG（无损，支持透明）": "PNG (lossless, supports transparency)",
  "JPEG（有损，体积小）": "JPEG (lossy, small file size)",
  "WebP（高压缩比）": "WebP (high compression)",
  "画质": "Quality",
  "导出倍率": "Export scale",
  "1× 原始尺寸": "1x original size",
  "2× 高清（推荐）": "2x high definition (recommended)",
  "3× 超高清": "3x ultra high definition",
  "文件名": "File name",
  "拼图导出": "Stitched image",
  "取消": "Cancel",
  "导出并下载": "Export and download",
  "图片拼接工具使用教程 - 横向纵向网格排版、加字与高清导出方法": "Image Stitching Tool User Guide - Horizontal, Vertical & Grid Layouts, Text and HD Export",
  "完整讲解免费图片拼接工具的使用教程：如何设置 16:9、9:16、4:3、3:4 等画布比例与背景色，如何添加图片并套用横向、纵向、网格与自由四种排列方式，如何拖拽缩放旋转、插入并设置文字、调整图层顺序，最后导出 1×/2×/3× 倍率的 PNG/JPEG/WebP 高清图片，另附快捷键对照表与常见问题排错建议。": "A complete walkthrough of the free image stitching tool: how to set canvas ratios such as 16:9, 9:16, 4:3 and 3:4 plus a background color, how to add images and apply horizontal, vertical, grid or free arrangement, how to drag, resize, rotate, insert and style text and reorder layers, and finally export high-resolution PNG/JPEG/WebP images at 1x, 2x or 3x. Includes a keyboard shortcut table and troubleshooting tips.",
  "图片拼接教程,图片拼接工具怎么用,长图拼接教程,九宫格拼图方法,图片排版教程,图片加文字教程,高清图片导出,图片拼接快捷键": "image stitching tutorial,how to stitch images,long image tutorial,nine grid collage guide,image layout tutorial,add text to image tutorial,high resolution export,image stitching shortcuts",
  "从设置画布比例到排版、加字、调整图层，再到 1×/2×/3× 高清导出，一篇讲清图片拼接的完整操作流程与快捷键。": "From picking a canvas ratio to layout, text, layer order and 1x/2x/3x high-resolution export - the complete image stitching workflow and shortcuts in one guide.",
  "YX拼图图片拼接工具使用界面预览": "Preview of the YX Stitch image stitching tool interface",
  "跳转到主要内容": "Skip to main content",
  "图片拼接工具使用教程：从选画布到导出高清成品": "Image Stitching Tool User Guide: From Canvas Ratio to HD Export",
  "按真实操作顺序讲解YX拼图的用法：定画布比例、导入图片、套用排列、拖拽微调、加字、调图层、导出成品。": "How YX Stitch works, in real operation order: set the canvas ratio, import images, apply an arrangement, fine-tune with the mouse, add text, reorder layers and export.",
  "完整操作流程（七步）": "The complete workflow (seven steps)",
  "界面分为左侧设置面板、中间画布、右侧属性面板。下面七步构成一个完整闭环，走完即掌握全部核心操作。": "The interface has a settings panel on the left, the canvas in the middle and the properties panel on the right. These seven steps form a complete loop - finish them and you know every core operation.",
  "设置画布尺寸与背景": "Set canvas size and background",
  "在左侧「画布尺寸」点击比例快捷按钮（16:9、9:16、4:3、3:4），或直接填写宽高像素，再用取色器设定背景色。": "In 'Canvas size' on the left, click a ratio shortcut (16:9, 9:16, 4:3, 3:4) or type the width and height in pixels, then pick a background color.",
  "添加本地图片": "Add local images",
  "点击「添加图片」一次选中多张，或把文件直接拖到画布上松手。图片从本地读取，不会上传。": "Click 'Add images' and select several files at once, or drag files straight onto the canvas and release. Images are read locally and never uploaded.",
  "选择排列方式并应用": "Pick an arrangement and apply it",
  "在「排列方式」中选横向、纵向、网格或自由，点击「应用到图片」，工具会等比缩放并均匀排布。": "Choose horizontal, vertical, grid or free in 'Arrangement', then click 'Apply to images'. The tool scales and spreads everything proportionally.",
  "拖拽微调位置与大小": "Drag to fine-tune position and size",
  "按住拖动改位置，拖边角等比缩放，拖顶部圆点旋转。多选可批量移动，视图太大时按住空格平移画布。": "Drag to move, drag a corner to scale proportionally, drag the top dot to rotate. Multi-select moves them in bulk; hold Space to pan the canvas when the view is too large.",
  "插入并设置文字": "Insert and style text",
  "点击「添加文字」创建文本图层，拖到需要的位置，在右侧设置内容、字号、颜色、字体、字重、对齐与行高。": "Click 'Add text' to create a text layer, drag it where you want it, then set the content, size, color, font, weight, alignment and line height in the panel on the right.",
  "调整图层顺序": "Reorder layers",
  "在图层列表中拖动条目改变上下顺序；不再需要的图层选中后删除，误删可撤销。": "Drag entries in the layer list to change their stacking order; select unwanted layers and delete them - a misclick can be undone.",
  "导出高清成品": "Export the finished image",
  "点击「导出图片」，选择 PNG、JPEG 或 WebP 与 1×/2×/3× 倍率，确认后浏览器直接生成文件并下载。": "Click 'Export image', choose PNG, JPEG or WebP plus a 1x, 2x or 3x scale, and the browser generates and downloads the file.",
  "各功能详解": "Feature details",
  "画布尺寸：先决定成品要用在哪里": "Canvas size: decide where the result will be used first",
  "画布尺寸决定导出图片的像素总量，比例选错往往意味着返工。横屏展示与视频封面用 16:9，手机竖屏与 Story 用 9:16，图文长内容用 4:3 或 3:4。需要其它比例，直接在宽高输入框键入即可；分辨率优先用导出倍率提升，而不是一开始就建超大画布。": "The canvas size sets the total pixel count of the export, so a wrong ratio means redoing the work. Use 16:9 for landscape displays and video covers, 9:16 for phone screens and Stories, and 4:3 or 3:4 for long illustrated content. For any other ratio, just type the width and height; for extra resolution raise the export scale instead of building an oversized canvas from the start.",
  "添加图片：文件选择与拖拽两种方式": "Add images: file picker or drag and drop",
  "点击「添加图片」打开文件对话框，按住": "Click 'Add images' to open the file dialog - hold",
  "或": "or",
  "可多选；也可以把文件直接拖到画布区域，界面出现高亮提示时松手。浏览器能解码的格式都能读取：JPG / JPEG、PNG、GIF、WebP、AVIF、BMP 等。": "to select several files at once. You can also drag files onto the canvas and release when the highlight appears. Every format the browser can decode works: JPG / JPEG, PNG, GIF, WebP, AVIF, BMP and more.",
  "排列方式：横向、纵向、网格与自由": "Arrangement: horizontal, vertical, grid and free",
  "横向沿宽度铺开得到宽长图，纵向沿高度铺开得到竖版长图，网格自动算出行列，自由模式则不自动排布。网格行列由画布比例与图片数量推算，想要「三行两列」这类固定结构，先切到自由模式再逐张拖到位。自动排布始终保持原始宽高比。": "Horizontal spreads images along the width for a wide long image, vertical spreads them along the height for a tall one, grid works out the rows and columns, and free mode does not arrange anything. Grid rows and columns are derived from the canvas ratio and the number of images; for a fixed layout such as three rows by two columns, switch to free mode and place each image by hand. Automatic arrangement always keeps the original aspect ratio.",
  "拖拽、缩放与旋转": "Dragging, resizing and rotating",
  "按住图片即可拖动；选中后四角出现缩放控制点，拖动可等比缩放；顶部圆点用于旋转。滚轮缩放画布视图，空格加拖拽平移，查看整体时比反复调整图片更省事。": "Press and drag an image to move it; when selected, corner handles appear for proportional scaling, and the dot on top rotates it. Scroll to zoom the canvas view and hold Space while dragging to pan - far quicker than resizing each image when you need to see the whole layout.",
  "文字：内容与样式的完整设置": "Text: full control of content and style",
  "点击「添加文字」会在画布中央生成文本框。右侧可设置内容、字号、颜色、字体、字重、对齐方式与行高；行高决定多行文字的疏密，做标题时调大更透气。文字图层与图片操作完全一致。": "Click 'Add text' to create a text box in the center of the canvas. The panel on the right sets the content, font size, color, font, weight, alignment and line height; line height controls the spacing between lines and a slightly larger value reads better for titles. Text layers behave exactly like images.",
  "图层顺序": "Layer order",
  "图层列表从上到下对应画面堆叠顺序，越靠上越靠前。排版前先把层级理清楚：底图在下，文字与标注在上。需要回到某一步时用撤销 / 重做即可。": "The layer list matches the stacking order on screen - higher entries appear in front. Plan the hierarchy before you start: background images at the bottom, text and labels on top. Use undo / redo whenever you want to step back.",
  "导出：格式与倍率的组合": "Export: format and scale",
  "PNG 无损且支持透明背景，适合叠加素材；JPEG 体积小、兼容性最好；WebP 在画质与体积之间平衡。倍率是画布尺寸的整数倍：1920×1080 的画布，2× 输出 3840×2160。日常发布用 1× 或 2× 足够，印刷再用 3×。": "PNG is lossless and supports transparency, which suits layered assets; JPEG is small and universally compatible; WebP balances quality and file size. The scale is a multiple of the canvas size: a 1920x1080 canvas exported at 2x gives 3840x2160. 1x or 2x is enough for everyday publishing; use 3x for print.",
  "常用键盘快捷键": "Keyboard shortcuts",
  "主要按键如下，便于快速查阅。": "The main shortcuts, listed for quick reference.",
  "图片拼接工具键盘快捷键对照表": "Image stitching tool keyboard shortcuts",
  "快捷键": "Shortcut",
  "作用": "Action",
  "使用场景": "When to use it",
  "撤销上一步操作": "Undo the last action",
  "误删图层、拖错位置后回退": "Undo a deleted layer or a misplaced drag",
  "重做被撤销的操作": "Redo the action you undid",
  "撤销之后又想恢复原样": "When you change your mind after undoing",
  "删除当前选中的图片或文字": "Delete the selected image or text",
  "清理多余元素": "Clean up unwanted elements",
  "滚轮": "Scroll wheel",
  "缩放画布视图": "Zoom the canvas view",
  "在整体与细节之间切换": "Switch between the whole layout and details",
  "空格": "Space",
  "+ 拖拽": "+ drag",
  "平移画布": "Pan the canvas",
  "画布超出窗口范围时移动视野": "Move the view when the canvas is larger than the window",
  "+ 点击多选": "+ click to multi-select",
  "同时选中多个图层": "Select several layers at once",
  "批量移动、统一缩放": "Move or scale a group in bulk",
  "四个常见场景的做法": "Four common scenarios",
  "下面四个配方覆盖了绝大多数日常拼接需求，可直接照做。": "These four recipes cover almost every everyday stitching need - just follow them.",
  "拼接成长图": "Stitch a long image",
  "横图用 16:9、竖图用 9:16，添加图片后选「纵向」并「应用到图片」。顶部加标题就先「添加文字」再把图层提到最上层。": "Use 16:9 for horizontal images and 9:16 for vertical ones, add your images, then choose 'Vertical' and click 'Apply to images'. For a title on top, add the text first and move that layer to the top.",
  "制作九宫格": "Make a nine grid",
  "画布尺寸填成 1200×1200（1:1），添加九张尺寸接近的图片，选「网格」并应用，工具自动算出三行三列。需要留白就切到「自由」逐张微调。": "Set the canvas to 1200x1200 (1:1), add nine images of similar size, pick 'Grid' and apply - the tool works out three rows and three columns. Switch to 'Free' to fine-tune the spacing.",
  "给海报加文字": "Add text to a poster",
  "先按投放位置定比例，再放底图，用字号与颜色和背景形成对比，行高 1.2 左右更易读。多层信息就分别建图层，靠顺序决定压盖关系。": "Choose the ratio for where it will be published, place the background image, then use font size and color to contrast with the background - a line height around 1.2 is easier to read. For multiple layers of information, create one text layer per item and control the overlap by their order.",
  "拼接证件照与资料图": "Stitch ID photos and documents",
  "全程本地处理，敏感内容不会上传。用 1:1 或 3:4 这类接近原图比例的画布，导出选 PNG 避免压缩伪影，文字标注用小字号并对齐基线。": "Everything happens locally, so sensitive content is never uploaded. Use a canvas ratio close to the original, such as 1:1 or 3:4, and export as PNG to avoid compression artifacts; keep annotations small and aligned to a common baseline.",
  "遇到问题怎么排查": "Troubleshooting",
  "常见问题按顺序排查，通常两三分钟就能定位。": "Work through the list below - most problems are found in two or three minutes.",
  "图片被拉伸变形：": "An image looks stretched:",
  "改用边角控制点等比缩放，自动排列本身不会变形。": "Use the corner handles for proportional scaling. Automatic arrangement never distorts images.",
  "点击「应用到图片」没反应：": "'Apply to images' does nothing:",
  "先确认画布里确实已经有图片。": "Check that the canvas actually contains images.",
  "导出文件打不开：": "The exported file will not open:",
  "格式与后缀需一致，JPEG 用 .jpg 后缀；必要时允许本站下载。": "The format and the file extension must match - use .jpg for JPEG - and allow downloads from this site if your browser blocks it.",
  "画面卡顿：": "The canvas feels sluggish:",
  "先用 1× 预览排版，确认无误后再用 2× 或 3× 导出。": "Preview the layout at 1x first, then export at 2x or 3x once everything looks right.",
  "文字被图片盖住：": "Text is hidden behind an image:",
  "在图层列表中把文字条目向上拖动即可置顶。": "Drag the text entry upward in the layer list to bring it to the front.",
  "仍未解决可查看": "Still stuck? Read the",
  "常见问题页面": "FAQ page",
  "图片拼接工具常见问题 - 上传隐私、图片格式与导出清晰度解答": "Image Stitching Tool FAQ - Uploads, Privacy, Formats and Export Sharpness",
  "汇总图片拼接工具的高频疑问：是否免费且需要注册、图片会不会上传服务器或被保存、导出是否带水印、支持哪些图片格式与最大画布尺寸、怎样拼成长图、自动排列会不会变形、如何添加文字、导出清晰度与倍率怎么选、能否保留透明背景、撤销重做与快捷键、批量添加图片、手机与浏览器兼容性，以及成品的个人项目使用许可说明。": "Answers to the most common image stitching questions: is it free and does it need registration, are images uploaded or stored, does the export carry a watermark, which image formats and canvas sizes are supported, how to build a long image, whether automatic arrangement distorts pictures, how to add text, which export scale to pick, transparent PNG exports, undo and redo shortcuts, batch adding images, mobile and desktop browser support, and the personal-use license for exported images.",
  "图片拼接常见问题,拼图工具免费吗,图片会上传吗,图片拼接支持格式,长图拼接,九宫格拼图,透明背景导出,图片拼接撤销,图片拼接快捷键,图片拼接许可": "image stitching FAQ,is the collage tool free,are images uploaded,supported image formats,long image stitching,nine grid collage,transparent background export,undo in image stitching,stitching shortcuts,stitching license",
  "是否免费、会不会上传、导出清晰度、透明背景、撤销重做、手机可用性……十六个高频问题一次讲清。": "Is it free, are images uploaded, how sharp is the export, transparent backgrounds, undo and redo, mobile support - sixteen common questions answered at once.",
  "YX拼图图片拼接工具常见问题页面预览": "Preview of the YX Stitch image stitching tool FAQ page",
  "图片拼接工具常见问题": "Image stitching tool FAQ",
  "关于费用、隐私、格式、尺寸、导出、快捷键与兼容性的高频疑问，都在这里逐条回答。如果你想先看操作步骤，可以直接前往": "Answers to the most common questions about cost, privacy, formats, sizes, export, shortcuts and compatibility. If you want the step-by-step version first, go straight to the",
  "关于费用、隐私与授权": "About cost, privacy and licensing",
  "YX拼图是免费的吗？需要注册或付费吗？": "Is YX Stitch free? Do I need to register or pay?",
  "完全免费且无需注册。打开网页即可使用全部功能，包括横向、纵向、网格与自由排列、添加文字与高清导出，不设付费墙，也不需要绑定邮箱或手机号。": "Completely free, with no registration. Every feature is available as soon as the page opens: horizontal, vertical, grid and free arrangement, adding text, high-resolution export and undo history - no paywall, and no email address or phone number required.",
  "图片会上传到服务器吗？会不会被保存？": "Are images uploaded to a server? Are they stored?",
  "不会。图片的读取、解码、排版和导出全部在浏览器本地完成，站点没有接收图片的接口，因此不存在上传或留存图片的可能。关闭页面后，画布数据随页面一起释放。": "No. Reading, decoding, arranging and exporting all happen locally in your browser, and the site has no endpoint that accepts images, so uploading or keeping them is impossible. Close the page and the canvas data goes with it.",
  "导出的图片会带水印吗？": "Does the exported image carry a watermark?",
  "不会。导出结果就是你排版后的画面，没有品牌角标、平台标识或任何隐藏图层，可以直接用于发布、印刷或二次编辑。": "No. The export is exactly what you laid out - no brand badge, no platform mark and no hidden layers - so you can publish, print or edit it freely.",
  "生成的图片可以商用吗？": "Can the generated images be used commercially?",
  "不可以。本工具仅可用于个人项目，不可用于商业项目。个人学习、个人作品与非商业分享不受限制；用于企业宣传、商品主图、商业活动海报等商业场景前，请先通过": "No. This tool is for personal projects only and must not be used for commercial projects. Personal study, personal work and non-commercial sharing are fine; before using it for company promotion, product images or commercial posters, please email",
  "联系作者取得授权。另外，你使用的原始素材也需要自行确认权利，第三方图片、字体与商标仍需自行取得授权。": "to request authorization. You are also responsible for the rights of the source material - third-party images, fonts and trademarks need your own permission.",
  "关于图片、画布与格式": "About images, canvas and formats",
  "支持哪些图片格式？": "Which image formats are supported?",
  "支持浏览器可解码的常见格式，包括 JPG / JPEG、PNG、GIF、WebP、AVIF、BMP 等。浏览器会自动把它们解码为位图再参与排版。": "All common formats the browser can decode: JPG / JPEG, PNG, GIF, WebP, AVIF, BMP and more. The browser decodes them to bitmaps before they are placed.",
  "单张图片和画布的最大尺寸是多少？": "What is the maximum size of a single image and of the canvas?",
  "画布宽高均可在 64 到 8000 像素之间自由设置，内置 1920×1080（16:9）、1080×1920（9:16）、1440×1080（4:3）、1080×1440（3:4）四个常用比例快捷按钮。单张图片的大小受浏览器内存限制，实际能处理的数量取决于你设备性能。": "Canvas width and height can be set freely between 64 and 8000 pixels, with four built-in ratio shortcuts: 1920x1080 (16:9), 1080x1920 (9:16), 1440x1080 (4:3) and 1080x1440 (3:4). The size of a single image depends on browser memory, and how many you can handle depends on your device.",
  "关于排版与文字": "About layout and text",
  "怎样把多张图片排成一条长图？": "How do I arrange several images into one long image?",
  "添加图片后，在「排列方式」里选择「纵向」并点击「应用到图片」，工具会按画布高度自动等比缩放并依次排布，得到竖版长图；要横版长图就把画布设为 16:9 并选「横向」。": "Add your images, choose 'Vertical' in 'Arrangement' and click 'Apply to images'. The tool scales everything proportionally to the canvas height and stacks it, giving you a tall long image; for a wide one, set the canvas to 16:9 and pick 'Horizontal'.",
  "自动排列会把图片拉伸变形吗？": "Does automatic arrangement stretch the images?",
  "不会。自动排列始终按原始宽高比缩放，只改变尺寸不改变形状。若最终看到图片被拉宽拉高，多半是手动拖拽了图片边缘而非角上的等比控制点。": "No. Automatic arrangement always scales by the original aspect ratio, so only the size changes, never the shape. If an image looks stretched, you most likely dragged its edge instead of the corner handle.",
  "可以添加文字吗？能设置哪些文字属性？": "Can I add text? Which text properties can I set?",
  "可以。点击「添加文字」会创建一个可拖动的文本图层，右侧面板可设置文字内容、字号、颜色、字体、字重、对齐方式与行高，文字同样支持拖拽、缩放、旋转和调整图层顺序。": "Yes. Click 'Add text' to create a draggable text layer. The panel on the right sets the content, font size, color, font, weight, alignment and line height, and text layers can be dragged, resized, rotated and reordered just like images.",
  "关于导出与效果": "About export and results",
  "导出的图片清晰度如何？倍率应该怎么选？": "How sharp is the export, and which scale should I choose?",
  "导出提供 1×、2×、3× 三档倍率，对应画布尺寸的整数倍。1920×1080 的画布用 2× 导出就是 3840×2160，满足 4K 分发；日常发布用 1× 或 2× 即可，倍率越高文件越大、渲染越慢。": "Three scales are available - 1x, 2x and 3x - each a multiple of the canvas size. A 1920x1080 canvas exported at 2x gives 3840x2160, enough for 4K distribution. 1x or 2x is fine for everyday publishing; higher scales mean bigger files and slower rendering.",
  "能导出透明背景的 PNG 吗？": "Can I export a PNG with a transparent background?",
  "可以。选择 PNG 格式并把画布背景色设为透明，导出的图片会保留透明通道，适合做素材叠加、贴纸或网页图片；JPEG 不支持透明背景，请勿用它承载透明需求。": "Yes. Choose PNG and set the canvas background to transparent - the exported image keeps its alpha channel, which suits overlays, stickers and web images. JPEG has no transparency, so do not use it when you need it.",
  "关于操作效率": "About efficiency",
  "操作出错可以撤销吗？支持重做吗？": "Can I undo a mistake? Is redo supported?",
  "支持。Ctrl+Z 撤销上一步操作，Ctrl+Y 重做被撤销的操作，Delete 删除当前选中的图层。多选、复制、删除、拖动、缩放、旋转与文字属性修改都可以逐步回退。": "Yes. Ctrl+Z undoes the last action, Ctrl+Y redoes it, and Delete removes the selected layer. Multi-select, duplicate, delete, drag, resize, rotate and text edits can all be undone step by step.",
  "可以一次添加多张图片批量处理吗？": "Can I add many images at once?",
  "可以。在文件选择框中按住 Ctrl 或 Shift 多选，一次可以导入十几张图片；拖拽方式同样支持批量导入。添加后用「应用到图片」即可一次性完成排列。": "Yes. Hold Ctrl or Shift in the file dialog to select a dozen images at once; dragging works in bulk too. Once they are in, 'Apply to images' arranges everything in one go.",
  "有哪些键盘快捷键？": "Which keyboard shortcuts are available?",
  "常用快捷键包括：Ctrl+Z 撤销、Ctrl+Y 重做、Delete 删除选中元素、滚轮缩放画布视图、空格加拖拽平移画布，Ctrl 加点击可多选图层。完整对照表见": "The common ones: Ctrl+Z to undo, Ctrl+Y to redo, Delete to remove the selected element, the scroll wheel to zoom the canvas view, Space plus drag to pan, and Ctrl plus click to multi-select layers. The full table is in the",
  "关于浏览器兼容性": "About browser compatibility",
  "手机和电脑浏览器都支持吗？": "Does it work on phones and desktops?",
  "支持。工具在主流的 Chrome、Edge、Firefox、Safari 等浏览器上都能运行，移动端已适配触控操作与窄屏布局，画板在小屏幕上会切换为上下排列。": "Yes. The tool runs in mainstream browsers such as Chrome, Edge, Firefox and Safari. Touch controls and the narrow-screen layout are supported, and the canvas switches to a stacked layout on small screens.",
  "还有其它疑问？可以先翻阅": "Other questions? Start with the",
  "完整使用教程": "complete user guide",
  "，里面按操作顺序讲解了每个面板的用法；想了解工具的设计思路与适用场景，可以看看": ", which explains every panel in operation order; to understand the design thinking and target scenarios, see",
  "；涉及隐私的具体条款写在": "; the detailed privacy terms are written in the",
  "隐私政策": "privacy policy",
  "中。仍有无法解决的问题时，可以发送邮件至": ". If a problem is still unresolved, email",
  "，我们会尽快回复。": "and we will reply as soon as possible.",
  "关于YX拼图 - 免费在线图片拼接工具的定位、特性与隐私承诺": "About YX Stitch - A free online image stitching tool: what it is, what it does and how it protects your privacy",
  "YX拼图是一个完全在浏览器本地运行的免费图片拼接工具，提供横向、纵向、网格与自由排版，支持拖拽缩放、插入文字与 PNG/JPEG/WebP 高清导出。本文说明工具定位、核心特性、适用人群、隐私承诺与使用许可。": "YX Stitch is a free image stitching tool that runs entirely in your browser. It offers horizontal, vertical, grid and free layouts, drag-to-resize, text insertion and PNG/JPEG/WebP export in high resolution. This page explains the positioning of the tool, its core features, who uses it, its privacy promise and its license.",
  "关于YX拼图,图片拼接工具介绍,免费拼图工具,在线图片拼接,图片排版工具,本地图片处理,隐私友好工具": "about YX Stitch,image stitching tool introduction,free collage tool,online image stitching,image layout tool,local image processing,privacy friendly tool",
  "了解YX拼图为何诞生、它与修图软件和传统在线拼图站有什么不同、谁在用，以及本地处理带来的隐私承诺。": "Why YX Stitch exists, who uses it and what the local-processing approach means for your privacy.",
  "关于YX拼图：一个把「排版」做到极简的免费图片拼接工具": "About YX Stitch: a free image stitching tool that reduces layout to the essentials",
  "多图排版、加字、导出，压缩进一个网页：无需安装、无需注册，图片全程不离开你的设备。": "Multi-image layout, text and export in a single web page: nothing to install, no account needed, and your images never leave your device.",
  "我们在解决什么问题": "The problem we are solving",
  "把几张照片排成一张长图、把商品图拼成九宫格、给海报加一句标题——这些需求不值得为它学一套专业软件，更不值得把照片交给陌生的在线网站。": "Turning a few photos into one long image, building a nine grid from product shots, adding a headline to a poster - these tasks are not worth learning a full design suite for, and not worth handing your photos to an unknown website.",
  "所以YX拼图只做排版：画布比例、排列方式、拖拽缩放旋转、文字、图层顺序、导出倍率，每一步都对应明确结果，不需要学习成本。": "So YX Stitch does one thing: layout. Canvas ratio, arrangement, dragging, resizing, rotating, text, layer order and export scale - every step gives an obvious result, with nothing to learn.",
  "所有处理都在浏览器本地完成，站点没有上传接口，也没有存储空间：图片不离开设备，弱网环境下照样能用。": "All of it runs locally in the browser: the site has no upload endpoint and no storage, so images never leave your device and the tool still works on a weak connection.",
  "上手看": "To get going, read the",
  "，隐私问题看": ", for privacy questions see the",
  "，完整规则见": ", and the full rules are in the",
  "核心特性": "Core features",
  "这些能力构成了YX拼图的全部功能，没有隐藏开关，也没有付费模块。": "These capabilities are the whole of YX Stitch - no hidden switches and no paid modules.",
  "常用画布比例一键设置": "One-click canvas ratios",
  "内置 16:9、9:16、4:3、3:4 四个快捷按钮，点一下即切换画布，也能手动填写任意宽高像素并设置背景色。": "Four shortcuts - 16:9, 9:16, 4:3 and 3:4 - switch the canvas instantly, and you can still type any width and height in pixels and pick a background color.",
  "横向 / 纵向 / 网格 / 自由": "Horizontal / vertical / grid / free",
  "横向出宽长图，纵向出竖版长图，网格自动算行列，「自由」完全交给你；切换后仍可逐张微调。": "Horizontal gives a wide long image, vertical a tall one, grid works out the rows and columns, and free mode hands the stage over to you - and you can still fine-tune every image afterwards.",
  "按住拖动改位置，拖边角等比缩放，拖顶部圆点旋转；多选、复制、删除、调层级都在侧边面板完成。": "Drag to move, drag a corner to scale proportionally, drag the top dot to rotate; multi-select, duplicate, delete and reordering all live in the side panel.",
  "任意位置插入文字": "Text anywhere",
  "文字是可拖动的图层，字号、颜色、字体、字重、对齐与行高都能逐项调整，加标题或做水印都很快。": "Text is a draggable layer: size, color, font, weight, alignment and line height are all adjustable, so adding a title or a watermark takes seconds.",
  "高清导出三种格式": "High-resolution export in three formats",
  "支持 PNG、JPEG、WebP 与 1×/2×/3× 倍率，1920×1080 的画布用 2× 即得 3840×2160。": "PNG, JPEG and WebP with 1x, 2x and 3x scales - a 1920x1080 canvas exported at 2x gives 3840x2160.",
  "本地处理更安心": "Local processing, peace of mind",
  "图片不上传、不存储、不带水印，工具完全免费且无需登录，关掉页面即释放全部临时数据。": "Images are not uploaded, not stored and carry no watermark; the tool is free and needs no login, and closing the page releases all temporary data.",
  "谁在用它": "Who uses it",
  "日常需要拼图的人比想象中更多。": "Far more people need to stitch images every day than you would think.",
  "电商运营": "E-commerce operators",
  "把商品细节图、尺码说明拼成主图或详情长图，同一套素材换比例即可再出一版。": "Stitch product details, size charts and material shots into one main image or a long detail page, then switch the ratio to produce a second version.",
  "自媒体创作者": "Content creators",
  "截图拼成长图做图文，给封面加标题文字，9:16 素材适配多平台后直接发布。": "Combine screenshots into a long image for a post, add a headline to the cover and adapt 9:16 material for each platform before publishing.",
  "教师与学生": "Teachers and students",
  "课件照片、错题截图拼成可打印讲义，作业与图表排成一张提交图。": "Turn lesson photos and screenshots of mistakes into a printable handout, or lay out homework and charts as one clear submission image.",
  "设计师与团队协作": "Designers and teams",
  "快速产出多版排版方案供评审，导出成品直接交付，不依赖任何在线协作服务。": "Produce several layout options for review and hand over the exported result directly - no online collaboration service involved.",
  "行政与市场人员": "Admin and marketing staff",
  "活动照片、签到表拼成内部展示页或外发简报，敏感材料不经过第三方服务器。": "Combine event photos, sign-in sheets and flowcharts into an internal display page or an outgoing brief, with sensitive material never touching a third-party server.",
  "普通用户": "Everyone else",
  "旅行照片拼长图、证件照排版、朋友圈九宫格，打开网页就能完成。": "Travel photos as a long image, ID photos and document screenshots arranged neatly, a nine grid for social posts - open the page and you are done.",
  "隐私与安全承诺": "Privacy and security",
  "「图片不上传」来自架构本身：处理逻辑跑在浏览器里，站点没有接收图片的通道。": "'Your images are never uploaded' is a consequence of the architecture: the processing runs in the browser, and the site has no channel to receive images.",
  "不上传：": "No uploads:",
  "读取、解码与像素运算都在浏览器进程中完成，网络面板里看不到图片请求。": "Reading, decoding and pixel operations all happen in your browser process - the network panel shows no image requests.",
  "不存储：": "No storage:",
  "没有图片存储桶与素材库，关闭页面后画布数据随之释放。": "There is no image bucket and no asset library, and canvas data is released when you close the page.",
  "不加水印：": "No watermark:",
  "导出结果就是你排版的结果，没有角标与隐藏图层。": "The export is exactly what you laid out, with no corner badge and no hidden layer.",
  "不要求登录：": "No sign-in required:",
  "无需注册，也没有账号信息可以泄露。": "No registration, so there is no account information that could leak.",
  "不使用 Cookie：": "No cookies:",
  "站点不投放追踪标记，不记录浏览轨迹。": "The site sets no tracking markers and does not record browsing behaviour.",
  "证件、合同、内部文档等不宜外传的材料，可以放心在这里处理。详细条款见": "IDs, contracts and internal documents that should not leave your device can be handled here with confidence. The detailed terms are in the",
  "使用许可": "license",
  "本工具仅可用于个人项目，": "This tool is for personal projects only,",
  "不可用于商业项目": "and must not be used for commercial projects",
  "。个人学习、作品与非商业分享不受限；用于企业宣传、商品主图、商业活动等场景前，请先取得作者授权。素材本身的版权与授权也需要你自己确认。": ". Personal study, personal work and non-commercial sharing are unrestricted; before using it for company promotion, product images or commercial events, please get the author's permission. The copyright and licensing of your source material remain your own responsibility.",
  "联系我们": "Contact us",
  "遇到问题或有建议，发邮件到": "If something does not work or you have an idea, email",
  "，附上浏览器版本、操作步骤与预期结果，能更快定位。": "and include your browser version, the steps you took and what you expected - that makes it much faster to pin down.",
  "功能建议与使用问题：": "Feature requests and usage questions:",
  "隐私与合规相关：同一邮箱": "Privacy and compliance: the same address",
  "失效链接：可在": "Broken links: you can check every page address in the",
  "网站地图": "sitemap",
  "核对全部页面地址": "to find all page addresses",
  "YX拼图隐私政策 - 图片拼接工具的本地处理与信息收集说明": "YX Stitch Privacy Policy - Local Processing and Information Collection",
  "YX拼图图片拼接工具的隐私政策全文：说明图片全部在浏览器本地处理，不上传服务器、不做存储、不加水印；站点不使用 Cookie，也不使用本地存储进行追踪，不接入第三方统计、广告与社交插件；文中同时列出服务器访问日志等有限收集范围、用户访问、更正、删除与反对处理等权利，以及 HTTPS 加密等隐私保护措施和反馈方式。": "The full privacy policy for the YX Stitch image stitching tool: images are processed entirely in your browser, never uploaded to a server, never stored and never watermarked; the site sets no cookies and uses no local storage for tracking, and loads no third-party analytics, ads or social plugins. The policy also lists the limited data we do collect (such as server access logs), your rights to access, correct, delete and object to processing, the privacy safeguards in place (such as HTTPS), and how to reach us.",
  "图片拼接工具隐私政策,拼图工具隐私保护,本地处理图片不上传,网站隐私政策,Cookie说明,数据收集说明,用户权利": "image stitching tool privacy policy,privacy for free collage tools,local processing images never uploaded,website privacy policy,cookie notice,data collection notice,user rights",
  "图片不上传、不存储、不加水印，站点不使用 Cookie、不接入第三方统计与广告服务。本政策说明我们收集什么、我们不收集什么，以及你可以如何行使权利。": "Images are never uploaded or stored and carry no watermark; the site sets no cookies and loads no third-party analytics or ad services. This policy explains what we collect, what we do not, and how you can exercise your rights.",
  "YX拼图隐私政策页面预览": "Preview of the YX Stitch privacy policy page",
  "YX拼图隐私政策": "YX Stitch privacy policy",
  "这份政策说明我们收集哪些信息、我们不收集哪些信息，以及你的图片在拼接过程中去了哪里。最后更新日期：2026 年 11 月 22 日。": "This policy explains which information we collect, which we do not, and where your images go while you are stitching. Last updated: 22 November 2026.",
  "一、我们收集哪些信息": "1. What we collect",
  "为了保持服务的简洁与可靠，我们": "To keep the service simple and reliable, we",
  "不收集你的图片": "do not collect your images",
  "。这是本政策最重要的一条：你在YX拼图中打开的任何图片、照片、截图、扫描件与设计稿，都只在你的浏览器与设备之间流动，不会到达我们的服务器。": ". This is the most important line in the policy: every image, photo, screenshot, scan or design file you open in YX Stitch moves only between your browser and your device, and never reaches our servers.",
  "除此之外，我们主动收集的信息也非常有限，主要限于以下几类，且都与工具的运行维护直接相关：": "Beyond that, the information we actively collect is very limited and limited to the following, all of which relate directly to running and maintaining the tool:",
  "服务器访问日志：": "Server access logs:",
  "当有人访问站点时，托管环境会记录请求时间、页面地址、HTTP 状态码、浏览器与操作系统标识、来源页等基础技术信息，用于排查故障与防范恶意请求。这些日志通常包含 IP 地址，并由服务器按固定周期自动清理。": "When someone visits the site, the hosting environment records the request time, page address, HTTP status code, browser and operating system identifiers and the referrer page. These logs usually contain an IP address and are cleaned up on a fixed schedule.",
  "我们主动收到的联系信息：": "Contact details you send us:",
  "如果你通过邮件或其他方式向我们反馈问题、提出建议，我们会保留你主动提供的联系方式（如邮箱），以便回复沟通。除非你要求删除，否则这些信息仅用于处理你的请求。": "If you email us or otherwise get in touch with a question or a suggestion, we keep the contact details you provide (such as your email address) so that we can reply. Unless you ask us to delete them, they are used only to handle your request.",
  "我们不要求注册账号，因此不存在用户名、密码、手机号、邮箱验证等账户信息需要收集；我们也不会出售、出租或交换任何个人信息。": "We do not require an account, so there are no usernames, passwords, phone numbers or email verifications to collect, and we never sell, rent or exchange personal information.",
  "二、图片在本地如何处理": "2. How images are handled locally",
  "YX拼图的全部核心功能都运行在浏览器本地环境。点击「添加图片」时，浏览器通过本地文件接口读取你选中的文件，交给页面内的绘图上下文完成解码与像素运算；排版、缩放、旋转、加字这些操作同样在本地完成；点击导出时，成品由浏览器在本地渲染成 PNG、JPEG 或 WebP 并直接下载给你。": "All of the core features of YX Stitch run in the local browser environment. When you click 'Add images', the browser reads the files you selected through the local file interface and hands them to the in-page drawing context for decoding and pixel work; arranging, scaling, rotating and adding text happen locally as well, and when you export, the browser renders the result locally as PNG, JPEG or WebP and downloads it to you.",
  "这意味着在整个流程中：": "This means that throughout the process:",
  "图片文件": "image files",
  "不会上传": "are never uploaded",
  "到任何服务器，站点也没有接收图片的接口；": "to any server, and the site has no interface that accepts images;",
  "不会被存储": "are never stored",
  "在你的浏览器缓存、本地存储或任何远程存储中；": "in your browser cache, local storage or any remote storage;",
  "导出成品": "the exported result",
  "不会加水印": "never carries a watermark",
  "，画面内容完全由你决定；": ", and the content is entirely up to you;",
  "关闭或刷新页面后，画布中的临时数据会随页面进程一起释放。": "when you close or refresh the page, the temporary canvas data is released with the page process.",
  "换句话说，除了你自己主动下载的成品，其余一切都不会离开你的设备。更多相关说明可以查看": "In other words, apart from the finished files you download yourself, nothing leaves your device. For more, see the",
  "中的相关条目，以及": "for related entries, and the",
  "中的隐私承诺。": "page for our privacy promise.",
  "三、Cookie 与本地存储说明": "3. Cookies and local storage",
  "YX拼图目前": "YX Stitch currently",
  "不使用任何 Cookie": "uses no cookies at all",
  "，也不使用 localStorage、sessionStorage、IndexedDB 等浏览器本地存储机制来追踪你。这意味着：": "and does not track you through localStorage, sessionStorage, IndexedDB or any other browser storage mechanism. That means:",
  "我们不会在你的设备上写入追踪标记；": "we never write tracking markers on your device;",
  "不会通过 Cookie 建立会话、不要求你保持「已登录」状态；": "we do not set sessions through cookies and never ask you to stay 'signed in';",
  "不会进行跨站跟踪，也不会把你的浏览记录与其他网站的用户画像关联；": "we do not track you across sites and never link your browsing history to profiles on other websites;",
  "你在站点上的活动不会被用来投放精准广告。": "your activity on the site is never used to target advertising.",
  "工具的界面状态（例如当前选中的画布比例）仅存在于当前页面的内存中，页面关闭即消失，不会被持久化保存。这一设计让「隐私模式」浏览与常规浏览的行为保持一致。": "Interface state (such as the currently selected canvas ratio) exists only in the memory of the current page and disappears when you close it, so it is never persisted. That keeps private browsing and regular browsing behave the same way.",
  "四、第三方服务": "4. Third-party services",
  "截至本政策最后更新日期，YX拼图": "As of the last update of this policy, YX Stitch",
  "没有接入任何第三方统计、广告、社交插件或第三方字体服务": "does not load any third-party analytics, ads, social plugins or third-party font services",
  "。页面不加载外部脚本，不向第三方域名发起数据请求，也不嵌入第三方 iframe 内容。": ". The page loads no external scripts, makes no requests to third-party domains and embeds no third-party iframes.",
  "站点图标、样式表与社交分享配图均从本站域名直接提供，因此访问页面本身不会把你的信息转发给任何外部服务商。如果未来我们引入新的第三方服务，会先更新本政策，明确说明服务提供方、收集的信息类型与用途，并在页面上给出提示。": "The site icon, stylesheet and social sharing images are all served from our own domain, so simply visiting the page never forwards your information to an outside service. If we ever add a third-party service, we will update this policy first, stating the provider, the type of information collected and its purpose, and we will point it out on the page.",
  "五、你的权利": "5. Your rights",
  "由于我们收集的信息极少，你的权利行使方式也很直接：": "Because we collect so little information, exercising your rights is straightforward:",
  "访问与更正：": "Access and correction:",
  "你主动发送给我们的邮件或反馈内容，可以随时要求我们提供副本、纠正或删除。": "for any email or feedback you send us, you can ask for a copy, a correction or deletion at any time.",
  "删除：": "Deletion:",
  "你可以在任何时候要求删除我们持有的与你有关的联系信息与沟通记录，我们会在合理期限内处理。": "you can ask us at any time to delete the contact details and correspondence we hold about you, and we will handle it within a reasonable period.",
  "撤回同意：": "Withdrawing consent:",
  "对于需要你许可才能处理的信息，撤回许可同样随时有效。": "where we need your permission to process information, withdrawing it takes effect just as immediately.",
  "反对处理：": "Objecting:",
  "你可以要求我们对涉及你的信息处理作出说明或停止。": "you can ask us to explain the processing of your information or to stop it.",
  "投诉与申诉：": "Complaints and appeals:",
  "如果你认为我们的处理方式侵害了你的权益，可以通过上述邮箱提出异议，我们会认真核实并回复。": "if you think our handling affects your rights, raise it through the email address above and we will look into it carefully and reply.",
  "需要特别说明的是，由于工具不设账户体系，": "One point deserves special mention: because the tool has no account system,",
  "你无需为「注销账号」执行任何操作": "you do not need to do anything to 'close an account'",
  "——没有账户，也就没有需要清理的账户数据。": "- without an account there is no account data to clean up either.",
  "六、隐私保护措施": "6. Privacy safeguards",
  "我们为站点设置了如下保护措施，以降低访问过程中的风险：": "We have put the following safeguards in place to reduce the risks of visiting the site:",
  "全站使用 HTTPS 加密传输，页面内容在传输过程中不被篡改或窃听；": "the whole site is served over HTTPS, so page content cannot be tampered with or eavesdropped on in transit;",
  "服务端开启常见的防护响应头，限制页面被嵌入到第三方站点的可能性；": "the server sends common protective response headers that limit the page being embedded on third-party sites;",
  "访问日志按固定周期滚动清理，不做长期保存，也不与用户身份关联；": "access logs are cleaned up on a fixed rolling schedule, are not kept long term and are not linked to your identity;",
  "站点只提供静态页面与前端脚本，不存在接收用户上传内容的接口，从架构上排除图片外泄的可能；": "the site only serves static pages and front-end scripts and has no interface that accepts uploaded content, which rules out image leaks by design;",
  "不使用行为分析脚本，不进行用户画像与跨站追踪。": "no behavioural analytics scripts are used, and no profiling or cross-site tracking takes place.",
  "需要提醒的是，你的设备安全同样重要。建议使用系统与浏览器的最新版本，不要在公共不可信设备上处理高度敏感的素材，导出成品后及时清理本地临时文件。": "A reminder that your own device security matters too. Keep your system and browser up to date, avoid highly sensitive material on shared or untrusted devices, and clean up local temporary files after exporting.",
  "七、未成年人保护": "7. Protection of minors",
  "YX拼图是面向所有用户的通用工具，我们不会主动收集未成年人的个人信息，也不设年龄门槛。若未成年人需要使用，请在监护人指导下进行，并由监护人协助保管好本地文件与导出成品。": "YX Stitch is a general tool for all users. We do not actively collect personal information from minors and set no age limit. Younger users should work with a guardian's guidance, and the guardian should help keep the local files and exported results safe.",
  "八、适用范围与变更": "8. Scope and changes",
  "本政策适用于访问": "This policy applies to every visitor of",
  "的所有访客。若站点域名或服务形态发生变化，我们会同步更新本政策中的表述并重新标注最后更新日期。本政策不适用于你自行跳转的第三方网站，它们的数据处理规则由各自的服务方制定。": ". If the domain or the shape of the service changes, we will update the wording here and re-stamp the last updated date. It does not apply to third-party sites you navigate to yourself, whose data handling rules are set by their own operators.",
  "九、联系我们": "9. Contact us",
  "如果你对本政策有任何疑问、发现描述与实际情况不一致，或希望行使上述权利，可以发送邮件至": "If you have any question about this policy, notice a mismatch with reality, or want to exercise the rights above, you can write to us at",
  "与我们联系，或直接前往": "or go straight to the",
  "在线拼接工具": "image stitching tool",
  "体验功能。涉及隐私与合规的问题，我们会由专人阅读并回复。": "and try it out. Privacy and compliance questions are read and answered by a real person.",
  "最后更新：2026-11-22": "Last updated: 2026-11-22",
  "本政策描述的是当前版本的实际情况。如果工具后续新增了需要联网的功能（例如云端工程同步），我们会第一时间更新这份说明，而不会在功能上线后补写。": "This policy describes the current version. If the tool later gains a feature that needs a network connection (cloud sync, for example), we will update this notice as soon as that happens rather than after the fact.",
  "放心用，数据不离开你的设备": "Use it with confidence - your data stays on your device",
  "免费、无需登录、图片不上传，打开就能拼。": "Free, no sign-up, images never uploaded - open the page and start stitching.",
  "打开工具": "Open the tool",
  "页面走丢了 404 - YX拼图免费在线图片拼接工具快捷导航与找回入口": "Page not found (404) - YX Stitch free online image stitching tool: quick navigation and ways back",
  "你访问的页面不存在或已被移动，可能是链接拼写错误、地址多了一个字符，或收藏的还是旧地址。返回YX拼图免费在线图片拼接工具首页，或前往使用教程、常见问题与关于工具页面继续操作；图片拼接无需登录，全部在浏览器本地完成，不上传、不存储、不打水印。": "The page you asked for does not exist or has been moved - maybe the link is misspelled, has one character too many, or you saved an old address. Return to the YX Stitch home page, or continue with the user guide, FAQ and about pages; stitching needs no sign-in, runs entirely in your browser, and never uploads, stores or watermarks your images.",
  "404,页面不存在,YX拼图,免费图片拼接工具,图片拼接工具首页,使用教程,常见问题": "404,page not found,YX Stitch,free image stitching tool,image stitching home,user guide,FAQ",
  "你访问的页面不存在或已被移动。返回免费图片拼接工具首页，或前往使用教程与常见问题页面继续操作。": "The page you asked for does not exist or has been moved. Return to the free image stitching tool home page, or continue with the user guide and FAQ pages.",
  "页面走丢了": "Page not found",
  "你访问的这个地址不存在，或者已经被我们挪到了别处。别担心，工具本身一切正常。": "This address does not exist, or we have moved it somewhere else. No worries - the tool itself is working fine.",
  "常见原因有三种：链接里少了一个字符或多了空格、页面地址有拼写错误、收藏的还是旧版本地址。点击下面的入口可以直接回到能用的地方。": "There are three usual reasons: a link is missing a character or has an extra space, the page address is mistyped, or the address you bookmarked belongs to an older version. The links below take you back to something useful.",
  "为什么会走到这里": "How you ended up here",
  "YX拼图的公开页面数量不多，地址都很短，一般不会拼错。如果你在搜索结果或别人的分享里点进了不存在的地址，最常见的是链接末尾多了一个符号，或者页面曾经被重新组织过、旧地址没有同步更新。也有访客会把浏览器地址栏里带参数的临时地址原样保存下来，这类地址换一次会话就可能失效。": "YX Stitch does not have many public pages and the addresses are short, so mistakes are rare. If you clicked a dead link from search results or a shared post, the most common cause is an extra symbol at the end, or the site was reorganized and the old address was never updated. Some visitors also save the temporary URL straight from the address bar, and such an address can stop working in the next session.",
  "无论哪种情况，都不需要你做任何修复工作。YX拼图的全部功能都在": "Whichever it is, there is nothing for you to repair. Every feature of YX Stitch lives on",
  "这一个页面里，工具本身是完整的：设置画布比例、添加图片、横向纵向网格与自由排列、拖拽缩放旋转、添加文字、调整图层顺序、导出 PNG / JPEG / WebP 高清成品，全部无需登录、图片不上传、不存储、不打水印。页面地址出错不会影响工具状态的完整性，重新打开首页就能接着做。": "page, and the tool itself is complete: set the canvas ratio, add images, arrange them horizontally, vertically, in a grid or freely, drag, resize, rotate, add text, reorder layers and export high-resolution PNG / JPEG / WebP files - all without sign-in, and with images never uploaded, stored or watermarked. A wrong page address does not damage the tool state; reopen the home page and carry on.",
  "如果你是通过站内导航过来的，那么可以对照": "If you arrived through the site navigation, you can check the",
  "核对全部有效页面地址；如果是第一次使用，建议先看一遍": "for every valid page address; and if this is your first visit, start with the",
  "，七步流程能把工具的所有功能一次性走完。": "- its seven steps cover every feature of the tool in one pass.",
  "你可以去这几个地方": "Places you can go",
  "回到工具本体，设置画布比例、添加图片、拖拽排版并导出 PNG / JPEG / WebP 高清成品，无需登录，全部在浏览器本地完成。": "Back to the tool itself: set the canvas ratio, add images, arrange them by dragging and export high-resolution PNG / JPEG / WebP files - no sign-in, all processed locally in your browser.",
  "七步完整操作流程，配有功能详解、快捷键对照表和长图、九宫格、海报加字等常见场景的做法。": "The complete seven-step workflow, with feature details, a keyboard shortcut table and recipes for long images, nine grids and posters with text.",
  "查看教程": "Read the guide",
  "是否免费、会不会上传图片、支持哪些格式、导出清晰度怎么选、手机能不能用……高频疑问逐条解答。": "Is it free, are images uploaded, which formats are supported, how sharp is the export, does it work on a phone - the most common questions answered one by one.",
  "查看常见问题": "See the FAQ",
  "了解YX拼图的设计思路、核心特性、适用人群，以及图片不上传、不存储、不加水印的隐私承诺。": "The design thinking behind YX Stitch, its core features, who uses it, and the privacy promise that your images are never uploaded, stored or watermarked.",
  "了解工具": "About the tool",
  "直接开始拼一张": "Start stitching right now",
  "免费使用，无需登录，图片不上传、不存储、不打水印。": "Free to use, no sign-in, images never uploaded, stored or watermarked.",
  "免费开始拼接": "Start stitching for free",
  };

  /* 动态文案（带变量） */
  var RULES = [
    { re: /^已添加 (\d+) 张图片$/, en: 'Added $1 image(s)' },
    { re: /^已复制 (\d+) 个元素$/, en: 'Duplicated $1 element(s)' },
    { re: /^已导出 (\d+)×(\d+) 图片$/, en: 'Exported $1x$2 image' },
    { re: /^(\d+) 个元素$/, en: '$1 element(s)' },
    { re: /^(\d+) 项$/, en: '$1' },
    { re: /^输出尺寸：(\d+) × (\d+) px/, en: 'Output size: $1 x $2 px' },
    { re: /^导出失败：/, en: 'Export failed: ' },
    { re: /^初始化失败：/, en: 'Initialization failed: ' },
    { re: /^「(.+)」无法读取$/, en: '"$1" could not be read' },
    { re: /^文件$/, en: 'file' },
    { re: /^导出中…$/, en: 'Exporting...' },
    { re: /^还没有内容，点击「添加图片」或「添加文字」。$/, en: 'Nothing here yet - click "Add images" or "Add text".' }
  ];

  var lang = 'zh';
  var records = [];   /* 记录原始文案，便于切换语言时还原 */
  var ATTRS = ['title', 'placeholder', 'aria-label', 'alt', 'content', 'value'];

  function detectLang() {
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (q === 'zh' || q === 'en') return q;
    } catch (e) { /* ignore */ }
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'zh';
    return /^zh/i.test(nav) ? 'zh' : 'en';
  }

  /* 该字符串是否有可用译文 */
  function hasTranslation(src) {
    if (!src) return false;
    if (Object.prototype.hasOwnProperty.call(DICT, src)) return true;
    for (var i = 0; i < RULES.length; i++) {
      if (src.match(RULES[i].re)) return true;
    }
    return false;
  }

  /* 翻译单个字符串 */
  function translate(src) {
    if (!src) return src;
    if (lang === 'zh') return src;
    if (Object.prototype.hasOwnProperty.call(DICT, src)) return DICT[src];
    for (var i = 0; i < RULES.length; i++) {
      var m = src.match(RULES[i].re);
      if (m) return RULES[i].en.replace(/\$(\d)/g, function (_, n) { return m[Number(n)]; });
    }
    return src;
  }

  /* 收集并翻译某个根节点下的文本与属性 */
  function applyTo(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      var p = node.parentNode;
      if (!p || /^(SCRIPT|STYLE|TEXTAREA)$/.test(p.nodeName)) continue;
      var raw = node.nodeValue;
      var trimmed = raw.trim();
      if (!trimmed || !hasTranslation(trimmed)) continue;
      var lead = raw.slice(0, raw.length - raw.trimLeft().length);
      var trail = raw.slice(raw.trimRight().length);
      records.push({ node: node, src: trimmed, lead: lead, trail: trail });
      node.nodeValue = lead + translate(trimmed) + trail;
    }

    var els = root.querySelectorAll ? root.querySelectorAll('*') : [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      for (var a = 0; a < ATTRS.length; a++) {
        var name = ATTRS[a];
        if (!el.hasAttribute(name)) continue;
        var val = el.getAttribute(name);
        if (!hasTranslation(val)) continue;
        records.push({ el: el, attr: name, src: val });
        el.setAttribute(name, translate(val));
      }
    }
  }

  /* 还原并按当前语言重新渲染 */
  function render() {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var t = translate(r.src);
      if (r.node) r.node.nodeValue = r.lead + t + r.trail;
      else if (r.el) r.el.setAttribute(r.attr, t);
    }
    updateSwitch();
  }

  function setLang(next, pushUrl) {
    if (next !== 'zh' && next !== 'en') return;
    lang = next;
    render();
    if (pushUrl) {
      try {
        var url = new URL(location.href);
        url.searchParams.set('lang', lang);
        history.replaceState(null, '', url.toString());
      } catch (e) { /* ignore */ }
    }
    document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang: lang } }));
  }

  /* 语言切换按钮：放在「使用教程」左侧 */
  function buildSwitch() {
    var btn = document.getElementById('langSwitch');
    if (!btn) {
      var nav = document.querySelector('.site-nav');
      if (!nav) return;
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-switch';
      btn.id = 'langSwitch';
      nav.insertBefore(btn, nav.firstChild);
    }
    if (btn.__bound) return;
    btn.__bound = true;
    btn.addEventListener('click', function () {
      setLang(lang === 'zh' ? 'en' : 'zh', true);
    });
    updateSwitch();
  }

  function updateSwitch() {
    var btn = document.getElementById('langSwitch');
    if (!btn) return;
    btn.textContent = lang === 'zh' ? 'EN' : '中文';
    btn.title = lang === 'zh' ? 'Switch to English' : '切换到中文';
    btn.setAttribute('aria-label', btn.title);
  }

  function init() {
    lang = detectLang();
    applyTo(document.documentElement);
    buildSwitch();
    render();
  }

  App.i18n = {
    init: init,
    t: translate,
    applyTo: applyTo,
    setLang: setLang,
    get lang() { return lang; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
