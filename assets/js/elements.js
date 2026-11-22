/* ============================================================
   elements.js —— 元素模型、文本排版、几何与命中检测
   ============================================================ */
(function () {
  'use strict';
  var App = (window.App = window.App || {});
  var util = App.util;

  /* 用于测量文本的离屏上下文 */
  var measureCtx = document.createElement('canvas').getContext('2d');

  var CJK = /[⺀-鿿豈-﫿　-〿＀-￯]/;

  var elements = (App.elements = {

    /* ---------- 创建 ---------- */
    createImage: function (opts) {
      var el = {
        id: util.uid('img'),
        type: 'image',
        name: opts.name || '图片',
        x: opts.x || 0,
        y: opts.y || 0,
        w: opts.w || 200,
        h: opts.h || 200,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        src: opts.src,
        img: opts.img || null,
        naturalW: opts.naturalW || (opts.img ? opts.img.naturalWidth : 200),
        naturalH: opts.naturalH || (opts.img ? opts.img.naturalHeight : 200),
        fit: 'cover',
        radius: 0
      };
      return el;
    },

    createText: function (opts) {
      opts = opts || {};
      var el = {
        id: util.uid('txt'),
        type: 'text',
        name: opts.name || '文字',
        x: opts.x || 0,
        y: opts.y || 0,
        w: opts.w || 420,
        h: 60,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        text: opts.text != null ? opts.text : '双击或在此输入文字',
        fontSize: opts.fontSize || 48,
        fontFamily: opts.fontFamily || "system-ui, 'Microsoft YaHei', 'PingFang SC', sans-serif",
        fontWeight: opts.fontWeight || 700,
        color: opts.color || '#ffffff',
        align: opts.align || 'left',
        lineHeight: opts.lineHeight || 1.3,
        shadow: opts.shadow || 'none'
      };
      elements.syncTextHeight(el);
      return el;
    },

    duplicate: function (el) {
      var copy = {};
      for (var k in el) { if (k !== 'id' && k !== 'img') copy[k] = el[k]; }
      copy.id = util.uid(el.type === 'text' ? 'txt' : 'img');
      copy.x += 24; copy.y += 24;
      copy.name = el.name + ' 副本';
      return copy;
    },

    /* ---------- 文本 ---------- */
    fontString: function (el, scale) {
      var size = (el.fontSize || 48) * (scale || 1);
      return (el.fontWeight || 400) + ' ' + size + 'px ' + (el.fontFamily || 'sans-serif');
    },

    /* 将文本切分为可换行的最小单元：中文按字，英文按词 */
    tokenize: function (str) {
      var tokens = [], buf = '';
      for (var i = 0; i < str.length; i++) {
        var ch = str.charAt(i);
        if (CJK.test(ch)) {
          if (buf) { tokens.push(buf); buf = ''; }
          tokens.push(ch);
        } else if (ch === ' ' || ch === '\t') {
          if (buf) { tokens.push(buf); buf = ''; }
          tokens.push(' ');
        } else {
          buf += ch;
        }
      }
      if (buf) tokens.push(buf);
      return tokens;
    },

    /* 排版：返回 { lines:[string], height:number } */
    layoutText: function (el) {
      measureCtx.font = elements.fontString(el);
      var measure = function (s) { return measureCtx.measureText(s).width; };
      var maxW = Math.max(20, el.w || 20);
      var lines = [];
      var paragraphs = String(el.text == null ? '' : el.text).split('\n');

      for (var p = 0; p < paragraphs.length; p++) {
        var tokens = elements.tokenize(paragraphs[p]);
        if (!tokens.length) { lines.push(''); continue; }
        var cur = '', curW = 0;
        for (var i = 0; i < tokens.length; i++) {
          var t = tokens[i];
          var w = measure(t);
          if (curW + w > maxW && cur.replace(/\s+$/, '').length > 0) {
            lines.push(cur.replace(/\s+$/, ''));
            cur = (t === ' ') ? '' : t;
            curW = (t === ' ') ? 0 : w;
          } else {
            cur += t; curW += w;
          }
        }
        lines.push(cur.replace(/\s+$/, ''));
      }

      var lh = (el.fontSize || 48) * (el.lineHeight || 1.3);
      return { lines: lines, lineHeight: lh, height: Math.max(lh, lines.length * lh) };
    },

    /* 依据排版结果同步文本高度 */
    syncTextHeight: function (el) {
      if (el.type !== 'text') return;
      var l = elements.layoutText(el);
      el.h = l.height;
      el._lines = l.lines;
      return l;
    },

    textLineWidths: function (el) {
      measureCtx.font = elements.fontString(el);
      return elements.layoutText(el).lines.map(function (s) {
        return measureCtx.measureText(s).width;
      });
    },

    /* ---------- 几何 ---------- */
    /* 元素中心 */
    center: function (el) {
      return { x: el.x + el.w / 2, y: el.y + el.h / 2 };
    },
    rad: function (el) { return (el.rotation || 0) * Math.PI / 180; },

    /* 画布坐标 -> 元素本地坐标（以左上角为原点，未旋转） */
    docToLocal: function (el, px, py) {
      var c = elements.center(el);
      var a = elements.rad(el);
      var dx = px - c.x, dy = py - c.y;
      var cos = Math.cos(a), sin = Math.sin(a);
      return {
        x: dx * cos + dy * sin + el.w / 2,
        y: -dx * sin + dy * cos + el.h / 2
      };
    },

    /* 元素本地坐标 -> 画布坐标 */
    localToDoc: function (el, lx, ly) {
      var c = elements.center(el);
      var a = elements.rad(el);
      var dx = lx - el.w / 2, dy = ly - el.h / 2;
      var cos = Math.cos(a), sin = Math.sin(a);
      return {
        x: c.x + dx * cos - dy * sin,
        y: c.y + dx * sin + dy * cos
      };
    },

    /* 元素本地坐标 -> 画布坐标（相对中心的偏移形式） */
    localToDocCentered: function (el, dx, dy) {
      var c = elements.center(el);
      var a = elements.rad(el);
      var cos = Math.cos(a), sin = Math.sin(a);
      return {
        x: c.x + dx * cos - dy * sin,
        y: c.y + dx * sin + dy * cos
      };
    },

    /* 元素的四个角（画布坐标） */
    corners: function (el) {
      return [
        elements.localToDoc(el, 0, 0),
        elements.localToDoc(el, el.w, 0),
        elements.localToDoc(el, el.w, el.h),
        elements.localToDoc(el, 0, el.h)
      ];
    },

    /* 控制点定义：nx/ny ∈ {-1,0,1} */
    handles: [
      { id: 'nw', nx: -1, ny: -1, cursor: 'nwse-resize' },
      { id: 'n', nx: 0, ny: -1, cursor: 'ns-resize' },
      { id: 'ne', nx: 1, ny: -1, cursor: 'nesw-resize' },
      { id: 'e', nx: 1, ny: 0, cursor: 'ew-resize' },
      { id: 'se', nx: 1, ny: 1, cursor: 'nwse-resize' },
      { id: 's', nx: 0, ny: 1, cursor: 'ns-resize' },
      { id: 'sw', nx: -1, ny: 1, cursor: 'nesw-resize' },
      { id: 'w', nx: -1, ny: 0, cursor: 'ew-resize' }
    ],

    /* 控制点的画布坐标 */
    handlePoints: function (el) {
      return elements.handles.map(function (h) {
        var p = elements.localToDocCentered(el, h.nx * el.w / 2, h.ny * el.h / 2);
        p.id = h.id; p.nx = h.nx; p.ny = h.ny; p.cursor = h.cursor;
        return p;
      });
    },

    /* 旋转手柄位置 */
    rotateHandle: function (el, gap) {
      gap = gap || 28;
      return elements.localToDocCentered(el, 0, -el.h / 2 - gap);
    },

    /* 点是否在元素内（考虑旋转） */
    hitTest: function (el, px, py) {
      var l = elements.docToLocal(el, px, py);
      return l.x >= 0 && l.x <= el.w && l.y >= 0 && l.y <= el.h;
    },

    /* 在给定坐标处找到最上层的元素 */
    pick: function (px, py, list) {
      var arr = list || App.store.get().elements;
      for (var i = arr.length - 1; i >= 0; i--) {
        var el = arr[i];
        if (!el.visible || el.locked) continue;
        if (elements.hitTest(el, px, py)) return el;
      }
      return null;
    },

    /* 包围盒（考虑旋转） */
    bbox: function (el) {
      var cs = elements.corners(el);
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      cs.forEach(function (p) {
        minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
      });
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
  });
})();
