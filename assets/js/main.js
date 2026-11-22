/* ============================================================
   main.js —— 画布交互：拖拽、缩放、旋转、框选、平移、快捷键
   ============================================================ */
(function () {
  'use strict';
  var App = (window.App = window.App || {});
  var store = App.store;
  var elements = App.elements;
  var util = App.util;

  var dom = {};
  var drag = null;          /* 当前拖拽状态 */
  var spaceDown = false;    /* 空格平移 */
  var guides = [];          /* 吸附参考线 */
  var drawPending = false;
  var fitMode = true;       /* 是否处于「适应窗口」状态（窗口尺寸变化时自动重新适配） */

  var main = (App.main = {

    init: function () {
      /* 先初始化 UI（会建立 App.dom），再取用 */
      App.ui.init();
      dom = App.dom;
      App.ctx = dom.canvas.getContext('2d');

      /* 任何状态变化都触发重绘 */
      store.subscribe(function () { main.invalidate(); });

      /* 初始排列方式 */
      var seg = document.getElementById('arrangeSeg');
      var btns = seg.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        btns[i].classList.toggle('active', btns[i].getAttribute('data-arrange') === 'horizontal');
      }
      document.getElementById('arrangeColsField').style.display = 'none';

      /* 选中态：仅单选时显示控制点 */
      App.render.overlay = function (ctx, zoom) { drawGuides(ctx, zoom); };

      bindPointer();
      bindWheel();
      bindKeyboard();
      bindDrop();

      window.addEventListener('resize', function () {
        if (fitMode) main.fitToScreen();
        else main.invalidate();
      });

      /* 首屏放一张示例图，便于理解用法 */
      main.fitToScreen();
      main.invalidate();
    },

    /* ---------- 渲染调度 ---------- */
    invalidate: function () {
      if (drawPending) return;
      drawPending = true;
      requestAnimationFrame(function () {
        drawPending = false;
        App.render.draw();
        updateZoomLabel();
      });
    },

    /* ---------- 视图 ---------- */
    setZoom: function (z, center) {
      fitMode = false;
      var v = store.get().view;
      var vp = dom.viewport.getBoundingClientRect();
      var cx = center ? center.x - vp.left : vp.width / 2;
      var cy = center ? center.y - vp.top : vp.height / 2;
      var dx = (cx - v.x) / v.zoom;
      var dy = (cy - v.y) / v.zoom;
      v.zoom = util.clamp(z, 0.02, 16);
      v.x = cx - dx * v.zoom;
      v.y = cy - dy * v.zoom;
      main.invalidate();
    },

    zoomBy: function (factor) {
      main.setZoom(store.get().view.zoom * factor, null);
    },

    fitToScreen: function () {
      var s = store.get();
      var vp = dom.viewport.getBoundingClientRect();
      var pad = 40;
      var zoom = Math.min((vp.width - pad) / s.canvas.width, (vp.height - pad) / s.canvas.height);
      zoom = util.clamp(zoom, 0.02, 1);
      s.view.zoom = zoom;
      s.view.x = (vp.width - s.canvas.width * zoom) / 2;
      s.view.y = (vp.height - s.canvas.height * zoom) / 2;
      fitMode = true;
      main.invalidate();
    },

    /* ---------- 添加内容 ---------- */
    addFiles: function (fileList) {
      var files = Array.prototype.slice.call(fileList).filter(function (f) {
        return /^image\//.test(f.type) || /\.(png|jpe?g|gif|webp|bmp|avif|svg)$/i.test(f.name);
      });
      if (!files.length) {
        App.ui.toast('未识别到图片文件');
        return;
      }
      var s = store.get();
      var loaded = [];
      var settled = 0;
      var offset = 0;

      files.forEach(function (file, i) {
        var url = URL.createObjectURL(file);
        var img = new Image();
        img.onload = function () {
          store.cacheImage(url, img);
          var maxW = s.canvas.width * 0.6;
          var maxH = s.canvas.height * 0.6;
          var scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
          var w = Math.max(20, img.naturalWidth * scale);
          var h = Math.max(20, img.naturalHeight * scale);
          var x = (s.canvas.width - w) / 2 + offset;
          var y = (s.canvas.height - h) / 2 + offset;
          offset += 24;
          var el = elements.createImage({
            src: url, img: img, x: x, y: y, w: w, h: h,
            naturalW: img.naturalWidth, naturalH: img.naturalHeight,
            name: file.name || ('图片 ' + (i + 1))
          });
          s.elements.push(el);
          loaded.push(el);
          if (++settled === files.length) finishAdd(loaded);
        };
        img.onerror = function () {
          App.ui.toast('「' + (file.name || '文件') + '」无法读取');
          URL.revokeObjectURL(url);
          if (++settled === files.length) {
            if (loaded.length) finishAdd(loaded);
            else App.ui.toast('没有可用的图片');
          }
        };
        img.src = url;
      });
    },

    addTextElement: function () {
      var s = store.get();
      var v = s.view;
      var vp = dom.viewport.getBoundingClientRect();
      var dx = (vp.width / 2 - v.x) / v.zoom;
      var dy = (vp.height / 2 - v.y) / v.zoom;
      var el = elements.createText({
        x: Math.round(dx - 210),
        y: Math.round(dy - 30),
        w: 420
      });
      store.add(el);
      store.select([el.id]);
      App.ui.toast('已添加文字，可在右侧编辑内容与样式');
      var ta = document.getElementById('propText');
      if (ta) { ta.focus(); ta.select(); }
    },

    replaceImage: function (el, file) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        store.cacheImage(url, img);
        el.src = url;
        el.img = img;
        el.naturalW = img.naturalWidth;
        el.naturalH = img.naturalHeight;
        el.name = file.name || el.name;
        store.commit();
        store.emit('elements');
        App.ui.toast('图片已替换');
      };
      img.onerror = function () { App.ui.toast('图片读取失败'); };
      img.src = url;
    },

    deleteSelected: function () {
      if (!store.get().selectedIds.length) return;
      store.removeSelected();
      App.ui.toast('已删除');
    },

    duplicateSelected: function () {
      var sel = store.selected();
      if (!sel.length) return;
      var copies = sel.map(function (el) { return elements.duplicate(el); });
      var state = store.get();
      state.elements = state.elements.concat(copies);
      store.commit();
      store.select(copies.map(function (c) { return c.id; }));
      store.emit('elements');
      App.ui.toast('已复制 ' + copies.length + ' 个元素');
    }
  });

  /* ---------- 添加完成后的统一处理 ---------- */
  function finishAdd(loaded) {
    var state = store.get();
    var ids = loaded.map(function (e) { return e.id; });
    store.commit();
    if (state.arrangement && state.arrangement !== 'free') {
      App.arrange.apply(state.arrangement, {
        gap: parseInt(document.getElementById('arrangeGap').value, 10) || 0,
        cols: parseInt(document.getElementById('arrangeCols').value, 10) || 3
      });
    }
    store.select(ids);
    store.emit('elements');
    App.ui.toast('已添加 ' + loaded.length + ' 张图片');
  }

  /* ---------- 坐标转换 ---------- */
  function docPoint(ev) {
    var rect = dom.canvas.getBoundingClientRect();
    var zoom = store.get().view.zoom;
    return { x: (ev.clientX - rect.left) / zoom, y: (ev.clientY - rect.top) / zoom };
  }

  function insideCanvas(p) {
    var s = store.get();
    return p.x >= 0 && p.y >= 0 && p.x <= s.canvas.width && p.y <= s.canvas.height;
  }

  /* ---------- 指针交互 ---------- */
  function bindPointer() {
    var vp = dom.viewport;

    vp.addEventListener('pointerdown', function (ev) {
      if (ev.button === 1 || spaceDown) { startPan(ev); return; }
      if (ev.button !== 0) return;
      vp.setPointerCapture(ev.pointerId);
      var p = docPoint(ev);
      var s = store.get();

      /* 1. 命中已选中元素的控制点
         控制点优先于画布边界判断：元素被拖到画布边缘外时，
         控制点可能落在画布之外，此时仍应可以抓取调整。 */
      var sel = store.selected();
      if (sel.length === 1 && !sel[0].locked) {
        var el = sel[0];
        var zoom = s.view.zoom;
        var rotP = elements.rotateHandle(el, 26 / zoom);
        if (Math.hypot(p.x - rotP.x, p.y - rotP.y) <= 9 / zoom) {
          startRotate(ev, el);
          return;
        }
        var hps = elements.handlePoints(el);
        for (var i = 0; i < hps.length; i++) {
          var h = hps[i];
          if (Math.abs(p.x - h.x) <= 6 / zoom && Math.abs(p.y - h.y) <= 6 / zoom) {
            startResize(ev, el, elements.handles[i]);
            return;
          }
        }
      }

      /* 2. 画布外：视为取消选择 */
      if (!insideCanvas(p)) {
        if (!ev.shiftKey) store.select([]);
        return;
      }

      /* 2. 命中元素 */
      var hit = elements.pick(p.x, p.y);
      if (hit) {
        if (ev.shiftKey) {
          store.toggleSelect(hit.id);
          startMove(ev);
        } else {
          if (!store.isSelected(hit.id)) store.select([hit.id]);
          startMove(ev);
        }
      } else {
        if (!ev.shiftKey) store.select([]);
        startMarquee(ev);
      }
    });

    vp.addEventListener('pointermove', function (ev) {
      if (!drag) { updateCursor(ev); return; }
      drag.moved = drag.moved || movedEnough(ev, drag);
      if (drag.mode === 'pan') {
        var v = store.get().view;
        v.x = drag.panX + (ev.clientX - drag.startClientX);
        v.y = drag.panY + (ev.clientY - drag.startClientY);
        main.invalidate();
      } else if (drag.mode === 'move') {
        doMove(ev);
      } else if (drag.mode === 'resize') {
        doResize(ev);
      } else if (drag.mode === 'rotate') {
        doRotate(ev);
      } else if (drag.mode === 'marquee') {
        doMarquee(ev);
      }
    });

    function endDrag(ev) {
      if (!drag) return;
      if (drag.mode === 'move' || drag.mode === 'resize' || drag.mode === 'rotate') {
        store.commit();
      } else if (drag.mode === 'marquee' && drag.moved) {
        applyMarquee();
      }
      if (drag.mode === 'marquee') {
        App.render.overlay = function (ctx, zoom) { drawGuides(ctx, zoom); };
      }
      guides = [];
      drag = null;
      main.invalidate();
      if (ev && vp.hasPointerCapture && vp.hasPointerCapture(ev.pointerId)) {
        vp.releasePointerCapture(ev.pointerId);
      }
    }
    vp.addEventListener('pointerup', endDrag);
    vp.addEventListener('pointercancel', endDrag);

    vp.addEventListener('dblclick', function (ev) {
      var p = docPoint(ev);
      var hit = elements.pick(p.x, p.y);
      if (!hit) return;
      store.select([hit.id]);
      if (hit.type === 'text') {
        var ta = document.getElementById('propText');
        if (ta) { ta.focus(); ta.select(); }
      } else {
        document.getElementById('replaceInput').click();
      }
    });
  }

  function movedEnough(ev, d) {
    return Math.abs(ev.clientX - d.startClientX) > 2 || Math.abs(ev.clientY - d.startClientY) > 2;
  }

  function startPan(ev) {
    fitMode = false;
    var v = store.get().view;
    drag = { mode: 'pan', startClientX: ev.clientX, startClientY: ev.clientY, panX: v.x, panY: v.y };
    dom.viewport.classList.add('panning');
    ev.preventDefault();
  }

  function startMove(ev) {
    var p = docPoint(ev);
    var sel = store.selected().filter(function (e) { return !e.locked; });
    if (!sel.length) return;
    drag = {
      mode: 'move',
      startClientX: ev.clientX, startClientY: ev.clientY,
      start: p,
      orig: sel.map(function (e) {
        return { el: e, x: e.x, y: e.y };
      })
    };
  }

  function startResize(ev, el, handle) {
    drag = {
      mode: 'resize',
      el: el,
      handle: handle,
      startClientX: ev.clientX, startClientY: ev.clientY,
      orig: { x: el.x, y: el.y, w: el.w, h: el.h, rotation: el.rotation, fontSize: el.fontSize }
    };
  }

  function startRotate(ev, el) {
    var c = elements.center(el);
    var p = docPoint(ev);
    drag = {
      mode: 'rotate',
      el: el,
      startAngle: Math.atan2(p.y - c.y, p.x - c.x),
      origRotation: el.rotation || 0,
      center: c,
      startClientX: ev.clientX, startClientY: ev.clientY
    };
  }

  function startMarquee(ev) {
    var p = docPoint(ev);
    drag = { mode: 'marquee', start: p, cur: p, startClientX: ev.clientX, startClientY: ev.clientY };
    App.render.overlay = function (ctx, zoom) {
      drawGuides(ctx, zoom);
      var r = marqueeRect(drag);
      ctx.save();
      ctx.strokeStyle = '#6366f1';
      ctx.fillStyle = 'rgba(99,102,241,.12)';
      ctx.lineWidth = 1 / zoom;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.restore();
    };
  }

  function marqueeRect(d) {
    return {
      x: Math.min(d.start.x, d.cur.x),
      y: Math.min(d.start.y, d.cur.y),
      w: Math.abs(d.cur.x - d.start.x),
      h: Math.abs(d.cur.y - d.start.y)
    };
  }

  function applyMarquee() {
    var r = marqueeRect(drag);
    if (r.w < 2 && r.h < 2) return;
    var hits = store.get().elements.filter(function (el) {
      if (!el.visible) return false;
      var b = elements.bbox(el);
      return b.x < r.x + r.w && b.x + b.w > r.x && b.y < r.y + r.h && b.y + b.h > r.y;
    });
    store.select(hits.map(function (h) { return h.id; }));
  }

  /* ---------- 移动 + 吸附 ---------- */
  function doMove(ev) {
    var p = docPoint(ev);
    var dx = p.x - drag.start.x;
    var dy = p.y - drag.start.y;
    var snap = snapDelta(dx, dy);
    drag.orig.forEach(function (o) {
      o.el.x = o.x + snap.dx;
      o.el.y = o.y + snap.dy;
    });
    guides = snap.guides;
    main.invalidate();
  }

  function snapDelta(dx, dy) {
    var s = store.get();
    var zoom = s.view.zoom;
    var thresh = 6 / zoom;
    var primary = drag.orig[0];
    if (!primary) return { dx: dx, dy: dy, guides: [] };

    var gx = [0, s.canvas.width / 2, s.canvas.width];
    var gy = [0, s.canvas.height / 2, s.canvas.height];
    var movingIds = drag.orig.map(function (o) { return o.el.id; });

    s.elements.forEach(function (o) {
      if (movingIds.indexOf(o.id) >= 0) return;
      gx.push(o.x, o.x + o.w / 2, o.x + o.w);
      gy.push(o.y, o.y + o.h / 2, o.y + o.h);
    });

    var px = primary.x + dx, py = primary.y + dy;
    var linesX = [px, px + primary.el.w / 2, px + primary.el.w];
    var linesY = [py, py + primary.el.h / 2, py + primary.el.h];

    var bestX = null, bestY = null;
    for (var i = 0; i < linesX.length; i++) {
      for (var j = 0; j < gx.length; j++) {
        var diff = gx[j] - linesX[i];
        if (Math.abs(diff) <= thresh && (!bestX || Math.abs(diff) < Math.abs(bestX.diff))) {
          bestX = { diff: diff, at: gx[j] };
        }
      }
    }
    for (var k = 0; k < linesY.length; k++) {
      for (var m = 0; m < gy.length; m++) {
        var diff2 = gy[m] - linesY[k];
        if (Math.abs(diff2) <= thresh && (!bestY || Math.abs(diff2) < Math.abs(bestY.diff))) {
          bestY = { diff: diff2, at: gy[m] };
        }
      }
    }

    var out = [];
    if (bestX) { dx += bestX.diff; out.push({ type: 'v', at: bestX.at }); }
    if (bestY) { dy += bestY.diff; out.push({ type: 'h', at: bestY.at }); }
    return { dx: dx, dy: dy, guides: out };
  }

  function drawGuides(ctx, zoom) {
    if (!guides.length) return;
    ctx.save();
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([6 / zoom, 4 / zoom]);
    guides.forEach(function (g) {
      ctx.beginPath();
      if (g.type === 'v') { ctx.moveTo(g.at, 0); ctx.lineTo(g.at, store.get().canvas.height); }
      else { ctx.moveTo(0, g.at); ctx.lineTo(store.get().canvas.width, g.at); }
      ctx.stroke();
    });
    ctx.restore();
  }

  /* ---------- 缩放（尺寸调整） ---------- */
  function doResize(ev) {
    var el = drag.el;
    if (!el) return;
    var h = drag.handle;
    var o = drag.orig;
    var p = docPoint(ev);
    var a = elements.rad(el);
    var c = { x: o.x + o.w / 2, y: o.y + o.h / 2 };
    var dx = p.x - c.x, dy = p.y - c.y;
    var pxLocal = dx * Math.cos(a) + dy * Math.sin(a);
    var pyLocal = -dx * Math.sin(a) + dy * Math.cos(a);

    var newW = h.nx === 0 ? o.w : Math.max(1, Math.abs(pxLocal - (-h.nx * o.w / 2)));
    var newH = h.ny === 0 ? o.h : Math.max(1, Math.abs(pyLocal - (-h.ny * o.h / 2)));

    var isCorner = (h.nx !== 0 && h.ny !== 0);
    if (isCorner && !ev.shiftKey && el.type === 'image') {
      var ratio = o.w / Math.max(1, o.h);
      if (newW / o.w >= newH / o.h) newH = newW / ratio;
      else newW = newH * ratio;
    }

    if (el.type === 'text') {
      var tw = h.nx !== 0 ? Math.max(20, newW) : o.w;
      var fs = o.fontSize;
      if (h.ny !== 0) fs = Math.max(8, Math.round(o.fontSize * (newH / Math.max(1, o.h))));
      el.w = tw;
      el.fontSize = fs;
      elements.syncTextHeight(el);
      placeAfterResize(el, h, o, el.w, el.h);
    } else {
      el.w = newW;
      el.h = newH;
      placeAfterResize(el, h, o, newW, newH);
    }
    main.invalidate();
  }

  /* 保持锚点（对角控制点）固定 */
  function placeAfterResize(el, h, o, finalW, finalH) {
    var anchorX = h.nx === 0 ? 0 : -h.nx * o.w / 2;
    var anchorY = h.ny === 0 ? 0 : -h.ny * o.h / 2;
    var centerLocalX = h.nx === 0 ? 0 : anchorX + h.nx * finalW / 2;
    var centerLocalY = h.ny === 0 ? 0 : anchorY + h.ny * finalH / 2;
    var a = elements.rad(el);
    var cos = Math.cos(a), sin = Math.sin(a);
    var oc = { x: o.x + o.w / 2, y: o.y + o.h / 2 };
    var nc = {
      x: oc.x + centerLocalX * cos - centerLocalY * sin,
      y: oc.y + centerLocalX * sin + centerLocalY * cos
    };
    el.x = nc.x - finalW / 2;
    el.y = nc.y - finalH / 2;
  }

  /* ---------- 旋转 ---------- */
  function doRotate(ev) {
    var el = drag.el;
    var p = docPoint(ev);
    var c = elements.center(el);
    var ang = Math.atan2(p.y - c.y, p.x - c.x);
    var deg = drag.origRotation + (ang - drag.startAngle) * 180 / Math.PI;
    if (ev.shiftKey) deg = Math.round(deg / 15) * 15;
    el.rotation = Math.round(deg * 10) / 10;
    main.invalidate();
  }

  /* ---------- 光标 ---------- */
  function updateCursor(ev) {
    var p = docPoint(ev);
    var zoom = store.get().view.zoom;
    var sel = store.selected();
    if (sel.length === 1 && !sel[0].locked) {
      var el = sel[0];
      var rotP = elements.rotateHandle(el, 26 / zoom);
      if (Math.hypot(p.x - rotP.x, p.y - rotP.y) <= 9 / zoom) {
        dom.viewport.style.cursor = 'grab';
        return;
      }
      var hps = elements.handlePoints(el);
      for (var i = 0; i < hps.length; i++) {
        if (Math.abs(p.x - hps[i].x) <= 6 / zoom && Math.abs(p.y - hps[i].y) <= 6 / zoom) {
          dom.viewport.style.cursor = hps[i].cursor;
          return;
        }
      }
    }
    var hit = elements.pick(p.x, p.y);
    dom.viewport.style.cursor = hit ? 'move' : (spaceDown ? 'grab' : 'default');
  }

  /* ---------- 滚轮缩放 ---------- */
  function bindWheel() {
    dom.viewport.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      var v = store.get().view;
      if (ev.ctrlKey) {
        /* 触控板捏合 */
        main.setZoom(v.zoom * (ev.deltaY < 0 ? 1.1 : 0.9), { x: ev.clientX, y: ev.clientY });
      } else if (ev.shiftKey) {
        v.x -= ev.deltaY;
        main.invalidate();
      } else {
        var factor = ev.deltaY < 0 ? 1.12 : 1 / 1.12;
        main.setZoom(v.zoom * factor, { x: ev.clientX, y: ev.clientY });
      }
    }, { passive: false });
  }

  /* ---------- 键盘 ---------- */
  function bindKeyboard() {
    document.addEventListener('keydown', function (ev) {
      var tag = (ev.target.tagName || '').toLowerCase();
      var typing = tag === 'input' || tag === 'textarea' || tag === 'select' || ev.target.isContentEditable;

      if (ev.code === 'Space' && !typing) {
        spaceDown = true;
        dom.viewport.style.cursor = 'grab';
        if (drag && drag.mode === 'move') { /* 空格+拖拽平移在移动中切换 */ }
        ev.preventDefault();
        return;
      }

      if (typing) {
        if (ev.key === 'Escape') ev.target.blur();
        return;
      }

      var mod = ev.ctrlKey || ev.metaKey;

      if (mod && ev.key.toLowerCase() === 'z') {
        ev.preventDefault();
        if (ev.shiftKey) { if (store.redo()) App.ui.toast('已重做'); }
        else if (store.undo()) App.ui.toast('已撤销');
        return;
      }
      if (mod && ev.key.toLowerCase() === 'y') {
        ev.preventDefault();
        if (store.redo()) App.ui.toast('已重做');
        return;
      }
      if (mod && ev.key.toLowerCase() === 'd') {
        ev.preventDefault();
        main.duplicateSelected();
        return;
      }
      if (mod && ev.key.toLowerCase() === 'a') {
        ev.preventDefault();
        store.select(store.get().elements.map(function (e) { return e.id; }));
        return;
      }
      if (mod && ev.key.toLowerCase() === 's') {
        ev.preventDefault();
        App.exporter.saveProject().then(function () { App.ui.toast('工程已保存'); });
        return;
      }
      if (mod) return;

      if (ev.key === 'Delete' || ev.key === 'Backspace') {
        ev.preventDefault();
        main.deleteSelected();
        return;
      }
      if (ev.key === 'Escape') {
        store.select([]);
        App.ui.closeExport();
        return;
      }
      if (ev.key.indexOf('Arrow') === 0) {
        var step = ev.shiftKey ? 10 : 1;
        var dx = ev.key === 'ArrowLeft' ? -step : ev.key === 'ArrowRight' ? step : 0;
        var dy = ev.key === 'ArrowUp' ? -step : ev.key === 'ArrowDown' ? step : 0;
        var sel = store.selected();
        if (sel.length) {
          ev.preventDefault();
          sel.forEach(function (el) { if (!el.locked) { el.x += dx; el.y += dy; } });
          store.commit();
          store.emit('elements');
        }
      }
    });

    document.addEventListener('keyup', function (ev) {
      if (ev.code === 'Space') {
        spaceDown = false;
        dom.viewport.style.cursor = 'default';
      }
    });
  }

  /* ---------- 拖拽文件到画布 ---------- */
  function bindDrop() {
    var hint = document.getElementById('dropHint');
    var vp = dom.viewport;
    var depth = 0;

    vp.addEventListener('dragenter', function (ev) {
      ev.preventDefault();
      depth++;
      if (hint) hint.hidden = false;
    });
    vp.addEventListener('dragover', function (ev) { ev.preventDefault(); });
    vp.addEventListener('dragleave', function () {
      depth = Math.max(0, depth - 1);
      if (depth === 0 && hint) hint.hidden = true;
    });
    vp.addEventListener('drop', function (ev) {
      ev.preventDefault();
      depth = 0;
      if (hint) hint.hidden = true;
      var dt = ev.dataTransfer;
      if (!dt) return;
      var files = [];
      if (dt.files && dt.files.length) files = Array.prototype.slice.call(dt.files);
      else if (dt.items) {
        for (var i = 0; i < dt.items.length; i++) {
          if (dt.items[i].kind === 'file') {
            var f = dt.items[i].getAsFile();
            if (f) files.push(f);
          }
        }
      }
      if (files.length) main.addFiles(files);
    });
  }

  /* ---------- 缩放比例显示 ---------- */
  function updateZoomLabel() {
    var z = Math.round(store.get().view.zoom * 100);
    var el = document.getElementById('zoomLevel');
    if (el) el.textContent = z + '%';
  }

  /* ---------- 启动 ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    try {
      main.init();
    } catch (e) {
      console.error(e);
      App.ui && App.ui.toast('初始化失败：' + e.message);
    }
  });
})();
