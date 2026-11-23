/* ============================================================
   store.js —— 全局状态、撤销/重做、图片缓存
   ============================================================ */
(function () {
  'use strict';

  var App = (window.App = window.App || {});

  /* ---------- 工具函数 ---------- */
  var util = (App.util = {
    uid: function (prefix) {
      App.store._n++;
      return (prefix || 'el') + '_' + Date.now().toString(36) + '_' + App.store._n;
    },
    clamp: function (v, min, max) { return v < min ? min : v > max ? max : v; },
    round: function (v, p) { var m = Math.pow(10, p || 0); return Math.round(v * m) / m; },
    /* 深拷贝（只针对纯数据） */
    clone: function (o) { return JSON.parse(JSON.stringify(o)); },
    /* 触发下载 */
    download: function (blob, filename) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    },
    /* 读取文件为 dataURL */
    readAsDataURL: function (file) {
      return new Promise(function (res, rej) {
        var fr = new FileReader();
        fr.onload = function () { res(fr.result); };
        fr.onerror = function () { rej(fr.error); };
        fr.readAsDataURL(file);
      });
    },
    /* 文本转 Blob */
    toBlob: function (text, type) {
      return new Blob([text], { type: type || 'application/json' });
    },
    /* 简易节流 */
    throttleRAF: function (fn) {
      var queued = false;
      return function () {
        if (queued) return;
        queued = true;
        var args = arguments, self = this;
        requestAnimationFrame(function () { queued = false; fn.apply(self, args); });
      };
    }
  });

  /* ---------- 状态 ---------- */
  var listeners = [];

  var state = {
    canvas: { width: 1920, height: 1080, bg: '#ffffff' },
    arrangement: 'horizontal',
    elements: [],
    selectedIds: [],
    view: { zoom: 1, x: 0, y: 0 },
    history: { stack: [], index: -1, limit: 100 }
  };

  /* src -> HTMLImageElement */
  var imageCache = new Map();

  var store = (App.store = {
    _n: 0,
    get: function () { return state; },

    /* 事件订阅 */
    subscribe: function (fn) {
      listeners.push(fn);
      return function () {
        var i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
    emit: function (reason) {
      for (var i = 0; i < listeners.length; i++) {
        try { listeners[i](reason || 'update'); } catch (e) { console.error(e); }
      }
    },

    /* ---------- 选择 ---------- */
    selected: function () {
      return state.elements.filter(function (el) {
        return state.selectedIds.indexOf(el.id) >= 0;
      });
    },
    getById: function (id) {
      for (var i = 0; i < state.elements.length; i++) {
        if (state.elements[i].id === id) return state.elements[i];
      }
      return null;
    },
    select: function (ids) {
      state.selectedIds = Array.isArray(ids) ? ids.slice() : (ids ? [ids] : []);
      store.emit('selection');
    },
    toggleSelect: function (id) {
      var i = state.selectedIds.indexOf(id);
      if (i >= 0) state.selectedIds.splice(i, 1);
      else state.selectedIds.push(id);
      store.emit('selection');
    },
    isSelected: function (id) { return state.selectedIds.indexOf(id) >= 0; },

    /* ---------- 元素增删 ---------- */
    add: function (el) {
      state.elements.push(el);
      store.commit();
      store.emit('elements');
      return el;
    },
    remove: function (id) {
      state.elements = state.elements.filter(function (e) { return e.id !== id; });
      state.selectedIds = state.selectedIds.filter(function (i) { return i !== id; });
      store.commit();
      store.emit('elements');
    },
    removeSelected: function () {
      if (!state.selectedIds.length) return;
      state.elements = state.elements.filter(function (e) {
        return state.selectedIds.indexOf(e.id) < 0;
      });
      state.selectedIds = [];
      store.commit();
      store.emit('elements');
    },
    /* 按 id 调整层级；dir: 'front' | 'back' | 'forward' | 'backward' */
    reorder: function (id, dir) {
      var idx = state.elements.findIndex(function (e) { return e.id === id; });
      if (idx < 0) return;
      var el = state.elements.splice(idx, 1)[0];
      var target;
      if (dir === 'front') target = state.elements.length;
      else if (dir === 'back') target = 0;
      else if (dir === 'forward') target = Math.min(state.elements.length, idx + 1);
      else target = Math.max(0, idx - 1);
      state.elements.splice(target, 0, el);
      store.commit();
      store.emit('elements');
    },
    moveLayer: function (fromId, toIndex) {
      var idx = state.elements.findIndex(function (e) { return e.id === fromId; });
      if (idx < 0) return;
      var el = state.elements.splice(idx, 1)[0];
      state.elements.splice(Math.max(0, Math.min(state.elements.length, toIndex)), 0, el);
      store.commit();
      store.emit('elements');
    },

    /* ---------- 图片缓存 ---------- */
    cacheImage: function (src, img) {
      imageCache.set(src, img);
    },
    getCachedImage: function (src) {
      return imageCache.get(src) || null;
    },

    /* ---------- 历史 ---------- */
    serialize: function () {
      return JSON.stringify({
        canvas: state.canvas,
        arrangement: state.arrangement,
        selectedIds: state.selectedIds,
        elements: state.elements.map(function (el) {
          var o = {};
          for (var k in el) { if (k !== 'img') o[k] = el[k]; }
          return o;
        })
      });
    },
    restore: function (snap) {
      var data = JSON.parse(snap);
      state.canvas = data.canvas;
      state.arrangement = data.arrangement || 'horizontal';
      state.selectedIds = data.selectedIds || [];
      state.elements = (data.elements || []).map(function (el) {
        if (el.type === 'image') {
          var img = imageCache.get(el.src);
          if (!img) {
            img = new Image();
            img.src = el.src;
            imageCache.set(el.src, img);
          }
          el.img = img;
        }
        return el;
      });
    },
    /* 在一次可撤销的操作完成后调用 */
    commit: function () {
      var h = state.history;
      var snap = store.serialize();
      if (h.index < h.stack.length - 1) h.stack = h.stack.slice(0, h.index + 1);
      h.stack.push(snap);
      if (h.stack.length > h.limit) h.stack.shift();
      h.index = h.stack.length - 1;
      store.emit('history');
    },
    /* 连续拖拽等场景：先 begin()，结束时 end() 只落一次历史 */
    beginTransaction: function () {
      state.history._pending = store.serialize();
    },
    endTransaction: function () {
      var h = state.history;
      if (!h._pending) return;
      var before = h._pending;
      h._pending = null;
      if (before === store.serialize()) return;
      store.commit();
    },
    canUndo: function () { return state.history.index > 0; },
    canRedo: function () { return state.history.index < state.history.stack.length - 1; },
    undo: function () {
      var h = state.history;
      if (!store.canUndo()) return false;
      h.index--;
      store.restore(h.stack[h.index]);
      store.emit('elements');
      return true;
    },
    redo: function () {
      var h = state.history;
      if (!store.canRedo()) return false;
      h.index++;
      store.restore(h.stack[h.index]);
      store.emit('elements');
      return true;
    },

    /* ---------- 画布 ---------- */
    setCanvas: function (w, h, bg) {
      state.canvas.width = Math.max(64, Math.round(w) || state.canvas.width);
      state.canvas.height = Math.max(64, Math.round(h) || state.canvas.height);
      if (bg) state.canvas.bg = bg;
      store.commit();
      store.emit('canvas');
    }
  });

  /* 初始化历史栈 */
  state.history.stack = [store.serialize()];
  state.history.index = 0;
})();
