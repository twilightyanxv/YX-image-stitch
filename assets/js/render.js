/* ============================================================
   render.js —— Canvas 绘制（画布内容 / 选中框 / 导出共用）
   ============================================================ */
(function () {
  'use strict';
  var App = (window.App = window.App || {});
  /* elements.js 必须先于本文件加载；此处做惰性引用以避免顺序耦合 */
  function els() { return App.elements; }

  var MAX_BACKING = 16000; /* 单边最大像素，防止超大画布超出浏览器限制 */

  function roundRectPath(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  /* ---------- 单个元素 ---------- */
  function drawImageEl(ctx, el) {
    var img = el.img;
    if (!img || !img.complete || !img.naturalWidth) {
      /* 图片未就绪时画一个占位框 */
      ctx.save();
      ctx.fillStyle = 'rgba(99,102,241,.12)';
      ctx.strokeStyle = 'rgba(99,102,241,.45)';
      ctx.lineWidth = 2;
      roundRectPath(ctx, 0, 0, el.w, el.h, Math.min(el.radius, Math.min(el.w, el.h) / 2));
      ctx.fill(); ctx.stroke();
      ctx.restore();
      return;
    }
    var nw = img.naturalWidth, nh = img.naturalHeight;
    ctx.save();
    /* 始终裁剪到元素矩形内，避免 cover 模式溢出 */
    roundRectPath(ctx, 0, 0, el.w, el.h, Math.min(el.radius || 0, Math.min(el.w, el.h) / 2));
    ctx.clip();
    if (el.fit === 'fill') {
      ctx.drawImage(img, 0, 0, el.w, el.h);
    } else if (el.fit === 'contain') {
      var s = Math.min(el.w / nw, el.h / nh);
      var w = nw * s, h = nh * s;
      ctx.drawImage(img, (el.w - w) / 2, (el.h - h) / 2, w, h);
    } else {
      var s2 = Math.max(el.w / nw, el.h / nh);
      var w2 = nw * s2, h2 = nh * s2;
      ctx.drawImage(img, (el.w - w2) / 2, (el.h - h2) / 2, w2, h2);
    }
    ctx.restore();
  }

  function drawTextEl(ctx, el) {
    var lines = el._lines;
    if (!lines) {
      var l = els().layoutText(el);
      lines = l.lines;
    }
    var lh = (el.fontSize || 48) * (el.lineHeight || 1.3);
    ctx.save();
    ctx.font = els().fontString(el);
    ctx.textBaseline = 'middle';
    ctx.textAlign = el.align || 'left';
    if (el.shadow === 'soft') {
      ctx.shadowColor = 'rgba(0,0,0,.35)';
      ctx.shadowBlur = 10; ctx.shadowOffsetY = 2;
    } else if (el.shadow === 'strong') {
      ctx.shadowColor = 'rgba(0,0,0,.7)';
      ctx.shadowBlur = 16; ctx.shadowOffsetY = 3;
    }
    ctx.fillStyle = el.color || '#ffffff';
    var x = el.align === 'center' ? el.w / 2 : el.align === 'right' ? el.w : 0;
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, i * lh + lh / 2);
    }
    ctx.restore();
  }

  function drawElement(ctx, el) {
    if (el.visible === false) return;
    ctx.save();
    ctx.globalAlpha = el.opacity == null ? 1 : el.opacity;
    var c = els().center(el);
    ctx.translate(c.x, c.y);
    if (el.rotation) ctx.rotate(el.rotation * Math.PI / 180);
    ctx.translate(-el.w / 2, -el.h / 2);
    if (el.type === 'image') drawImageEl(ctx, el);
    else drawTextEl(ctx, el);
    ctx.restore();
  }

  /* ---------- 文档（内容，不含选中框） ---------- */
  function drawDocument(ctx, scale) {
    var s = App.store.get();
    ctx.save();
    ctx.scale(scale, scale);
    ctx.fillStyle = s.canvas.bg || '#ffffff';
    ctx.fillRect(0, 0, s.canvas.width, s.canvas.height);
    for (var i = 0; i < s.elements.length; i++) {
      drawElement(ctx, s.elements[i]);
    }
    ctx.restore();
  }

  /* ---------- 选中框与控制点 ---------- */
  function drawSelection(ctx, el, zoom) {
    var hs = 9 / zoom;          /* 控制点屏幕尺寸 */
    var lw = 1.6 / zoom;
    var gap = 26 / zoom;
    ctx.save();
    ctx.lineWidth = lw;
    ctx.strokeStyle = '#6366f1';
    ctx.setLineDash([]);
    var pts = els().corners(el);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.stroke();

    var hp = els().handlePoints(el);
    for (var j = 0; j < hp.length; j++) {
      var p = hp[j];
      ctx.beginPath();
      ctx.rect(p.x - hs / 2, p.y - hs / 2, hs, hs);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = lw;
      ctx.stroke();
    }

    /* 旋转手柄 */
    var rp = els().rotateHandle(el, gap);
    var top = els().localToDocCentered(el, 0, -el.h / 2);
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(rp.x, rp.y);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = lw;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rp.x, rp.y, hs * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- 主绘制 ---------- */
  var render = (App.render = {
    /* 自定义叠加层：main.js 可注入（吸附参考线、框选矩形等） */
    overlay: null,

    draw: function () {
      var s = App.store.get();
      var dom = App.dom;
      if (!dom || !dom.canvas) return;
      var ctx = App.ctx;
      if (!ctx) return;

      var zoom = s.view.zoom;
      var dpr = window.devicePixelRatio || 1;

      /* 背景板尺寸（CSS 像素） */
      var cssW = Math.max(1, Math.round(s.canvas.width * zoom));
      var cssH = Math.max(1, Math.round(s.canvas.height * zoom));
      dom.canvas.style.width = cssW + 'px';
      dom.canvas.style.height = cssH + 'px';

      /* 后备存储尺寸，受 MAX_BACKING 限制 */
      var px = Math.min(zoom * dpr, MAX_BACKING / s.canvas.width, MAX_BACKING / s.canvas.height);
      var bw = Math.max(1, Math.round(s.canvas.width * px));
      var bh = Math.max(1, Math.round(s.canvas.height * px));
      if (dom.canvas.width !== bw || dom.canvas.height !== bh) {
        dom.canvas.width = bw;
        dom.canvas.height = bh;
      }

      dom.canvasStage.style.transform = 'translate(' + s.view.x + 'px,' + s.view.y + 'px)';

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);
      ctx.setTransform(px, 0, 0, px, 0, 0);

      drawDocument(ctx, 1);

      /* 选中元素 */
      var sel = s.selectedIds.map(function (id) { return App.store.getById(id); })
        .filter(Boolean);
      for (var i = 0; i < sel.length; i++) {
        drawSelection(ctx, sel[i], zoom);
      }

      /* 自定义叠加层 */
      if (render.overlay) {
        ctx.save();
        render.overlay(ctx, zoom);
        ctx.restore();
      }
    }
  });

  App.render.drawDocument = drawDocument;
  App.render.drawElement = drawElement;
  App.render.roundRectPath = roundRectPath;
})();
