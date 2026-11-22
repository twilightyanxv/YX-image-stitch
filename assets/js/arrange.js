/* ============================================================
   arrange.js —— 自动排列（横向 / 纵向 / 网格）
   ============================================================ */
(function () {
  'use strict';
  var App = (window.App = window.App || {});

  function images(state) {
    return state.elements.filter(function (e) { return e.type === 'image'; });
  }

  function aspect(el) {
    var w = el.naturalW || el.w || 1;
    var h = el.naturalH || el.h || 1;
    return w / h;
  }

  var arrange = (App.arrange = {
    /* 对图片元素执行排列；文字元素保持原位 */
    apply: function (mode, opts) {
      var state = App.store.get();
      opts = opts || {};
      var gap = Math.max(0, opts.gap || 0);
      var cols = Math.max(1, opts.cols || 3);
      var list = images(state);
      if (!list.length) return false;

      var W = state.canvas.width;
      var H = state.canvas.height;

      if (mode === 'horizontal') arrange.horizontal(list, W, H, gap);
      else if (mode === 'vertical') arrange.vertical(list, W, H, gap);
      else if (mode === 'grid') arrange.grid(list, W, H, gap, cols);
      else return false;

      App.store.commit();
      App.store.emit('elements');
      return true;
    },

    horizontal: function (list, W, H, gap) {
      var n = list.length;
      var sumA = 0;
      list.forEach(function (el) { sumA += aspect(el); });
      if (!sumA) return;

      var availW = W - gap * (n - 1);
      var targetH = availW / sumA;
      if (targetH > H) targetH = H;
      if (targetH <= 0) return;

      var totalW = 0;
      list.forEach(function (el) { totalW += targetH * aspect(el); });
      var x = (W - totalW) / 2;

      list.forEach(function (el) {
        var a = aspect(el);
        el.h = targetH;
        el.w = targetH * a;
        el.x = x;
        el.y = (H - targetH) / 2;
        el.rotation = 0;
        x += el.w + gap;
      });
    },

    vertical: function (list, W, H, gap) {
      var n = list.length;
      /* 纵向排列时每张图等宽，总高度 = width * sum(1/aspect) */
      var sumInvA = 0;
      list.forEach(function (el) { sumInvA += 1 / aspect(el); });
      if (!sumInvA) return;

      var availH = H - gap * (n - 1);
      var targetW = availH / sumInvA;
      if (targetW > W) targetW = W;
      if (targetW <= 0) return;

      var totalH = 0;
      list.forEach(function (el) { totalH += targetW / aspect(el); });
      var y = (H - totalH) / 2;

      list.forEach(function (el) {
        var a = aspect(el);
        el.w = targetW;
        el.h = targetW / a;
        el.x = (W - targetW) / 2;
        el.y = y;
        el.rotation = 0;
        y += el.h + gap;
      });
    },

    grid: function (list, W, H, gap, cols) {
      var n = list.length;
      if (cols > n) cols = n;
      var rows = Math.ceil(n / cols);

      /* 统一单元比例：取所有图片宽高比的平均值 */
      var sumA = 0;
      list.forEach(function (el) { sumA += aspect(el); });
      var avgA = sumA / n;

      var cellW = (W - gap * (cols - 1)) / cols;
      var cellH = cellW / avgA;
      var totalH = rows * cellH + gap * (rows - 1);
      if (totalH > H) {
        cellH = (H - gap * (rows - 1)) / rows;
        cellW = cellH * avgA;
      }

      var gridW = cols * cellW + gap * (cols - 1);
      var gridH = rows * cellH + gap * (rows - 1);
      var offX = (W - gridW) / 2;
      var offY = (H - gridH) / 2;

      list.forEach(function (el, i) {
        var r = Math.floor(i / cols);
        var c = i % cols;
        var cellX = offX + c * (cellW + gap);
        var cellY = offY + r * (cellH + gap);

        var a = aspect(el);
        var iw = cellW, ih = cellW / a;
        if (ih > cellH) { ih = cellH; iw = cellH * a; }

        el.w = iw;
        el.h = ih;
        el.x = cellX + (cellW - iw) / 2;
        el.y = cellY + (cellH - ih) / 2;
        el.rotation = 0;
      });
    }
  });
})();
