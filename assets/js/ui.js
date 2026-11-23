/* ============================================================
   ui.js —— 面板绑定、属性检视器、图层列表、导出弹窗
   ============================================================ */
(function () {
  'use strict';
  var App = (window.App = window.App || {});
  var store = App.store;
  var elements = App.elements;
  var util = App.util;

  var PRESETS = [
    { name: '16:9', w: 1920, h: 1080 },
    { name: '9:16', w: 1080, h: 1920 },
    { name: '4:3', w: 1440, h: 1080 },
    { name: '3:4', w: 1080, h: 1440 }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var dom = {};
  var toastTimer = null;

  var ui = (App.ui = {

    init: function () {
      dom = App.dom = App.dom || {};
      [
        'canvas', 'canvasStage', 'viewport', 'canvasPresets', 'canvasW', 'canvasH', 'canvasBg',
        'arrangeSeg', 'arrangeColsField', 'arrangeCols', 'arrangeGap', 'applyArrange',
        'addImages', 'addText', 'fileInput',
        'layerList', 'layerCount', 'canvasSizeLabel', 'elementCount',
        'undoBtn', 'redoBtn', 'fitBtn', 'exportBtn', 'zoomIn', 'zoomOut', 'zoomLevel',
        'inspectorEmpty', 'inspectorBody', 'imageProps', 'textProps',
        'inspectorPanel', 'toggleInspector',
        'propX', 'propY', 'propW', 'propH', 'propRot', 'propOpacity', 'propOpacityVal',
        'propRadius', 'propRadiusVal', 'propFit', 'replaceImage', 'replaceInput', 'resetCrop',
        'propText', 'propFontSize', 'propColor', 'propFontFamily', 'propFontWeight',
        'propTextAlign', 'propLineHeight', 'propLineHeightVal', 'propTextShadow',
        'dupBtn', 'frontBtn', 'backBtn', 'delBtn',
        'exportModal', 'exportFormat', 'exportQuality', 'exportQualityVal', 'exportScale',
        'exportName', 'exportSizeHint', 'exportConfirm', 'exportCancel', 'exportClose',
        'exportQualityField', 'dropHint', 'toast', 'statusHint'
      ].forEach(function (id) { dom[id] = $(id); });

      buildPresets();
      bindCanvasPanel();
      bindArrangePanel();
      bindAddPanel();
      bindInspector();
      bindInspectorToggle();
      bindToolbar();
      bindExportModal();

      var y = $('year');
      if (y) y.textContent = String(new Date().getFullYear());

      store.subscribe(function (reason) {
        if (reason === 'selection' || reason === 'elements' || reason === 'canvas') {
          ui.refreshInspector();
          ui.refreshLayers();
        }
        if (reason === 'canvas' || reason === 'elements') ui.refreshCanvasPanel();
        ui.refreshHistoryButtons();
      });

      ui.refreshCanvasPanel();
      ui.refreshInspector();
      ui.refreshLayers();
      ui.refreshHistoryButtons();
    },

    /* ---------- 画布面板 ---------- */
    refreshCanvasPanel: function () {
      var s = store.get();
      if (!dom.canvasW) return;
      if (document.activeElement !== dom.canvasW) dom.canvasW.value = s.canvas.width;
      if (document.activeElement !== dom.canvasH) dom.canvasH.value = s.canvas.height;
      if (document.activeElement !== dom.canvasBg) dom.canvasBg.value = toHex(s.canvas.bg);
      dom.canvasSizeLabel.textContent = s.canvas.width + ' × ' + s.canvas.height;
      dom.elementCount.textContent = (App.i18n && App.i18n.t) ? App.i18n.t(s.elements.length + ' 个元素') : s.elements.length + ' 个元素';

      var btns = dom.canvasPresets.querySelectorAll('.preset');
      for (var i = 0; i < btns.length; i++) {
        var p = PRESETS[i];
        var on = p.w === s.canvas.width && p.h === s.canvas.height;
        btns[i].classList.toggle('active', on);
      }
    },

    /* ---------- 检视器 ---------- */
    refreshInspector: function () {
      var s = store.get();
      var sel = store.selected();
      if (!sel.length) {
        dom.inspectorEmpty.hidden = false;
        dom.inspectorBody.hidden = true;
        return;
      }
      dom.inspectorEmpty.hidden = true;
      dom.inspectorBody.hidden = false;

      var el = sel[0];
      var multi = sel.length > 1;
      var isText = el.type === 'text';
      dom.imageProps.hidden = isText || multi;
      dom.textProps.hidden = !isText || multi;

      var active = document.activeElement;
      var editing = active && dom.inspectorBody.contains(active);

      function setVal(node, v) {
        if (!node) return;
        if (editing && node === active) return;
        node.value = v;
      }

      setVal(dom.propX, Math.round(el.x));
      setVal(dom.propY, Math.round(el.y));
      setVal(dom.propW, Math.round(el.w));
      setVal(dom.propH, Math.round(el.h));
      setVal(dom.propRot, Math.round(el.rotation || 0));
      setVal(dom.propOpacity, Math.round((el.opacity == null ? 1 : el.opacity) * 100));
      dom.propOpacityVal.textContent = Math.round((el.opacity == null ? 1 : el.opacity) * 100) + '%';

      if (!isText) {
        setVal(dom.propRadius, el.radius || 0);
        dom.propRadiusVal.textContent = Math.round(el.radius || 0);
        setVal(dom.propFit, el.fit || 'cover');
      } else {
        setVal(dom.propText, el.text);
        setVal(dom.propFontSize, el.fontSize);
        setVal(dom.propColor, toHex(el.color));
        setVal(dom.propFontFamily, el.fontFamily);
        setVal(dom.propFontWeight, String(el.fontWeight));
        setVal(dom.propTextAlign, el.align || 'left');
        setVal(dom.propLineHeight, el.lineHeight);
        dom.propLineHeightVal.textContent = Number(el.lineHeight).toFixed(2);
        setVal(dom.propTextShadow, el.shadow || 'none');
      }
    },

    /* ---------- 图层列表 ---------- */
    refreshLayers: function () {
      var s = store.get();
      var list = dom.layerList;
      if (!list) return;
      list.innerHTML = '';
      dom.layerCount.textContent = s.elements.length ? ((App.i18n && App.i18n.t) ? App.i18n.t(s.elements.length + ' 项') : s.elements.length + ' 项') : '';

      if (!s.elements.length) {
        var empty = document.createElement('div');
        empty.className = 'layer-empty';
        empty.textContent = (App.i18n && App.i18n.t) ? App.i18n.t('还没有内容，点击「添加图片」或「添加文字」。') : '还没有内容，点击「添加图片」或「添加文字」。';
        list.appendChild(empty);
        return;
      }

      for (var i = s.elements.length - 1; i >= 0; i--) {
        (function (el) {
          var item = document.createElement('div');
          item.className = 'layer-item' + (store.isSelected(el.id) ? ' active' : '');
          item.setAttribute('role', 'button');
          item.tabIndex = 0;

          var thumb = document.createElement(el.type === 'image' ? 'img' : 'div');
          thumb.className = 'layer-thumb';
          if (el.type === 'image') {
            thumb.src = el.src;
            thumb.alt = el.name || '图片图层';
          } else {
            thumb.textContent = 'T';
          }

          var name = document.createElement('span');
          name.className = 'layer-name';
          name.textContent = el.name || (el.type === 'image' ? '图片' : '文字');

          var eye = document.createElement('button');
          eye.type = 'button';
          eye.className = 'btn btn-sm';
          eye.style.padding = '2px 6px';
          eye.title = el.visible === false ? '显示' : '隐藏';
          eye.textContent = el.visible === false ? '○' : '●';
          eye.addEventListener('click', function (ev) {
            ev.stopPropagation();
            el.visible = el.visible === false;
            store.commit();
            store.emit('elements');
          });

          item.appendChild(thumb);
          item.appendChild(name);
          item.appendChild(eye);

          item.addEventListener('click', function (ev) {
            if (ev.shiftKey || ev.metaKey || ev.ctrlKey) store.toggleSelect(el.id);
            else store.select([el.id]);
          });
          item.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); store.select([el.id]); }
          });

          list.appendChild(item);
        })(s.elements[i]);
      }
    },

    refreshHistoryButtons: function () {
      if (!dom.undoBtn) return;
      dom.undoBtn.disabled = !store.canUndo();
      dom.redoBtn.disabled = !store.canRedo();
    },

    /* ---------- 提示 ---------- */
    toast: function (msg, ms) {
      if (!dom.toast) return;
      dom.toast.textContent = (App.i18n && App.i18n.t) ? App.i18n.t(msg) : msg;
      dom.toast.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { dom.toast.hidden = true; }, ms || 2400);
    },

    setStatus: function (txt) {
      if (dom.statusHint) dom.statusHint.textContent = txt;
    },

    openExport: function () {
      if (!store.get().elements.length) {
        ui.toast('请先添加图片或文字');
        return;
      }
      dom.exportSizeHint.textContent = '';
      ui.updateExportHint();
      dom.exportModal.hidden = false;
    },
    closeExport: function () {
      dom.exportModal.hidden = true;
    },
    updateExportHint: function () {
      var scale = Number(dom.exportScale.value) || 1;
      var size = App.exporter.previewSize(scale);
      var fmt = dom.exportFormat.value;
      dom.exportQualityField.hidden = fmt === 'png';
      dom.exportQualityVal.textContent = dom.exportQuality.value + '%';
      dom.exportSizeHint.textContent = (App.i18n && App.i18n.t ? App.i18n.t('输出尺寸：' + size.w + ' × ' + size.h + ' px') : '输出尺寸：' + size.w + ' × ' + size.h + ' px') +
        (size.clipped ? '（已受浏览器尺寸上限限制）' : '');
    }
  });

  /* ---------- 颜色工具 ---------- */
  function toHex(c) {
    if (!c) return '#ffffff';
    if (/^#[0-9a-f]{6}$/i.test(c)) return c;
    if (/^#[0-9a-f]{3}$/i.test(c)) {
      return '#' + c.charAt(1) + c.charAt(1) + c.charAt(2) + c.charAt(2) + c.charAt(3) + c.charAt(3);
    }
    return '#ffffff';
  }
  ui.toHex = toHex;

  /* ---------- 事件绑定 ---------- */
  function buildPresets() {
    var box = dom.canvasPresets;
    PRESETS.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'preset';
      b.innerHTML = '<span class="p-name">' + p.name + '</span><span class="p-sub">' +
        p.w + '×' + p.h + '</span>';
      b.addEventListener('click', function () {
        store.setCanvas(p.w, p.h);
        App.main.fitToScreen();
      });
      box.appendChild(b);
    });
  }

  function bindCanvasPanel() {
    function applyWH() {
      var w = parseInt(dom.canvasW.value, 10);
      var h = parseInt(dom.canvasH.value, 10);
      if (!w || !h) return;
      if (w === store.get().canvas.width && h === store.get().canvas.height) return;
      store.setCanvas(w, h);
      App.main.fitToScreen();
    }
    dom.canvasW.addEventListener('change', applyWH);
    dom.canvasH.addEventListener('change', applyWH);
    dom.canvasBg.addEventListener('input', function () {
      store.get().canvas.bg = dom.canvasBg.value;
      store.commit();
      store.emit('canvas');
    });
  }

  function bindArrangePanel() {
    dom.arrangeSeg.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-arrange]');
      if (!btn) return;
      var mode = btn.getAttribute('data-arrange');
      store.get().arrangement = mode;
      var btns = dom.arrangeSeg.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        btns[i].classList.toggle('active', btns[i] === btn);
      }
      dom.arrangeColsField.style.display = mode === 'grid' ? '' : 'none';
      if (mode === 'free') {
        ui.toast('自由模式：直接拖拽图片即可自由摆放');
      }
    });
    dom.applyArrange.addEventListener('click', function () {
      var mode = store.get().arrangement;
      if (mode === 'free') { ui.toast('请先选择横向、纵向或网格排列'); return; }
      var ok = App.arrange.apply(mode, {
        gap: parseInt(dom.arrangeGap.value, 10) || 0,
        cols: parseInt(dom.arrangeCols.value, 10) || 3
      });
      if (!ok) ui.toast('请先添加至少一张图片');
    });
  }

  function bindAddPanel() {
    dom.addImages.addEventListener('click', function () { dom.fileInput.click(); });
    dom.fileInput.addEventListener('change', function () {
      if (dom.fileInput.files && dom.fileInput.files.length) {
        App.main.addFiles(dom.fileInput.files);
      }
      dom.fileInput.value = '';
    });
    dom.addText.addEventListener('click', function () { App.main.addTextElement(); });
  }

  /* 属性面板展开 / 收起 */
  function bindInspectorToggle() {
    var btn = dom.toggleInspector;
    var panel = dom.inspectorPanel;
    var app = $('app');
    if (!btn || !panel || !app) return;

    function setCollapsed(on) {
      app.classList.toggle('inspector-collapsed', on);
      btn.setAttribute('aria-expanded', on ? 'false' : 'true');
      btn.title = on ? '展开属性面板' : '收起属性面板';
      btn.textContent = on ? '‹' : '›';
    }

    btn.addEventListener('click', function () {
      setCollapsed(!app.classList.contains('inspector-collapsed'));
    });
  }

  function bindToolbar() {
    dom.undoBtn.addEventListener('click', function () {
      if (store.undo()) ui.toast('已撤销');
    });
    dom.redoBtn.addEventListener('click', function () {
      if (store.redo()) ui.toast('已重做');
    });
    dom.fitBtn.addEventListener('click', function () { App.main.fitToScreen(); });
    dom.exportBtn.addEventListener('click', function () { ui.openExport(); });
    dom.zoomIn.addEventListener('click', function () { App.main.zoomBy(1.25); });
    dom.zoomOut.addEventListener('click', function () { App.main.zoomBy(0.8); });
    dom.zoomLevel.addEventListener('click', function () { App.main.setZoom(1, null); });
  }

  function bindInspector() {
    var body = dom.inspectorBody;

    function num(node, fn) {
      node.addEventListener('input', function () {
        var v = parseFloat(node.value);
        if (isNaN(v)) return;
        fn(v, true);
      });
      node.addEventListener('change', function () {
        var v = parseFloat(node.value);
        if (isNaN(v)) return;
        fn(v, false);
      });
    }

    function each(fn) {
      store.selected().forEach(fn);
    }

    num(dom.propX, function (v, live) {
      each(function (el) { el.x = v; });
      if (!live) store.commit();
    });
    num(dom.propY, function (v, live) {
      each(function (el) { el.y = v; });
      if (!live) store.commit();
    });
    num(dom.propW, function (v, live) {
      each(function (el) {
        el.w = Math.max(1, v);
        if (el.type === 'text') elements.syncTextHeight(el);
      });
      if (!live) store.commit();
    });
    num(dom.propH, function (v, live) {
      each(function (el) {
        if (el.type === 'text') {
          el.fontSize = Math.max(8, Math.round(el.fontSize * (v / Math.max(1, el.h))));
          elements.syncTextHeight(el);
        } else {
          el.h = Math.max(1, v);
        }
      });
      if (!live) store.commit();
    });
    num(dom.propRot, function (v, live) {
      each(function (el) { el.rotation = v; });
      if (!live) store.commit();
    });
    num(dom.propFontSize, function (v, live) {
      each(function (el) {
        if (el.type !== 'text') return;
        el.fontSize = Math.max(8, v);
        elements.syncTextHeight(el);
      });
      if (!live) store.commit();
    });
    dom.propOpacity.addEventListener('input', function () {
      var v = parseInt(dom.propOpacity.value, 10) / 100;
      dom.propOpacityVal.textContent = dom.propOpacity.value + '%';
      each(function (el) { el.opacity = v; });
      store.emit('elements');
    });
    dom.propOpacity.addEventListener('change', function () { store.commit(); });

    /* 图片属性 */
    dom.propRadius.addEventListener('input', function () {
      var v = parseInt(dom.propRadius.value, 10);
      dom.propRadiusVal.textContent = v;
      each(function (el) { el.radius = v; });
      store.emit('elements');
    });
    dom.propRadius.addEventListener('change', function () { store.commit(); });
    dom.propFit.addEventListener('change', function () {
      var v = dom.propFit.value;
      each(function (el) { el.fit = v; });
      store.commit();
      store.emit('elements');
    });
    dom.replaceImage.addEventListener('click', function () { dom.replaceInput.click(); });
    dom.replaceInput.addEventListener('change', function () {
      var f = dom.replaceInput.files && dom.replaceInput.files[0];
      dom.replaceInput.value = '';
      if (!f) return;
      var sel = store.selected()[0];
      if (!sel || sel.type !== 'image') return;
      App.main.replaceImage(sel, f);
    });
    dom.resetCrop.addEventListener('click', function () {
      each(function (el) {
        if (el.type !== 'image') return;
        var a = (el.naturalW || el.w) / (el.naturalH || el.h);
        el.h = Math.round(el.w / a);
      });
      store.commit();
      store.emit('elements');
    });

    /* 文字属性 */
    function textChanged(live) {
      each(function (el) {
        if (el.type !== 'text') return;
        el.text = dom.propText.value;
        elements.syncTextHeight(el);
      });
      if (!live) store.commit();
      store.emit('elements');
    }
    dom.propText.addEventListener('input', function () { textChanged(true); });
    dom.propText.addEventListener('change', function () { textChanged(false); });

    dom.propColor.addEventListener('input', function () {
      each(function (el) { if (el.type === 'text') el.color = dom.propColor.value; });
      store.emit('elements');
    });
    dom.propColor.addEventListener('change', function () { store.commit(); });
    dom.propFontFamily.addEventListener('change', function () {
      each(function (el) { if (el.type === 'text') el.fontFamily = dom.propFontFamily.value; });
      store.commit();
      store.emit('elements');
    });
    dom.propFontWeight.addEventListener('change', function () {
      each(function (el) { if (el.type === 'text') el.fontWeight = parseInt(dom.propFontWeight.value, 10); });
      store.commit();
      store.emit('elements');
    });
    dom.propTextAlign.addEventListener('change', function () {
      each(function (el) { if (el.type === 'text') el.align = dom.propTextAlign.value; });
      store.commit();
      store.emit('elements');
    });
    dom.propLineHeight.addEventListener('input', function () {
      var v = parseFloat(dom.propLineHeight.value);
      dom.propLineHeightVal.textContent = v.toFixed(2);
      each(function (el) {
        if (el.type !== 'text') return;
        el.lineHeight = v;
        elements.syncTextHeight(el);
      });
      store.emit('elements');
    });
    dom.propLineHeight.addEventListener('change', function () { store.commit(); });
    dom.propTextShadow.addEventListener('change', function () {
      each(function (el) { if (el.type === 'text') el.shadow = dom.propTextShadow.value; });
      store.commit();
      store.emit('elements');
    });

    /* 操作按钮 */
    dom.dupBtn.addEventListener('click', function () { App.main.duplicateSelected(); });
    dom.frontBtn.addEventListener('click', function () {
      var s = store.selected();
      for (var i = 0; i < s.length; i++) store.reorder(s[i].id, 'front');
    });
    dom.backBtn.addEventListener('click', function () {
      var s = store.selected();
      for (var i = s.length - 1; i >= 0; i--) store.reorder(s[i].id, 'back');
    });
    dom.delBtn.addEventListener('click', function () { App.main.deleteSelected(); });

    /* 双击文本框进入编辑（右侧面板） */
    body.addEventListener('focusin', function () { /* 保持输入时不刷新 */ });
  }

  function bindExportModal() {
    dom.exportFormat.addEventListener('change', ui.updateExportHint);
    dom.exportScale.addEventListener('change', ui.updateExportHint);
    dom.exportQuality.addEventListener('input', function () {
      dom.exportQualityVal.textContent = dom.exportQuality.value + '%';
    });
    dom.exportClose.addEventListener('click', ui.closeExport);
    dom.exportCancel.addEventListener('click', ui.closeExport);
    dom.exportModal.addEventListener('click', function (e) {
      if (e.target === dom.exportModal) ui.closeExport();
    });
    dom.exportConfirm.addEventListener('click', function () {
      var format = dom.exportFormat.value;
      var btn = dom.exportConfirm;
      btn.disabled = true;
      btn.textContent = '导出中…';
      App.exporter.exportImage({
        format: format,
        quality: parseInt(dom.exportQuality.value, 10),
        scale: Number(dom.exportScale.value),
        filename: dom.exportName.value
      }).then(function (res) {
        ui.toast('已导出 ' + res.w + '×' + res.h + ' 图片');
        ui.closeExport();
      }).catch(function (e) {
        ui.toast('导出失败：' + e.message);
      }).then(function () {
        btn.disabled = false;
        btn.textContent = '导出并下载';
      });
    });
  }
})();
