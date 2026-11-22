/* ============================================================
   exporter.js —— 导出图片 / 保存与打开工程
   ============================================================ */
(function () {
  'use strict';
  var App = (window.App = window.App || {});
  var util = App.util;

  var MAX_SIDE = 12000; /* 导出单边像素上限 */

  function safeName(name) {
    return (name || '拼图导出').replace(/[\\/:*?"<>|]/g, '_').trim() || '拼图导出';
  }

  /* 等待所有图片解码完成 */
  function waitForImages(elements) {
    var jobs = elements.filter(function (el) {
      return el.type === 'image' && el.img && (!el.img.complete || !el.img.naturalWidth);
    }).map(function (el) {
      return new Promise(function (res) {
        var done = function () { res(); };
        el.img.addEventListener('load', done, { once: true });
        el.img.addEventListener('error', done, { once: true });
        setTimeout(done, 4000);
      });
    });
    return Promise.all(jobs);
  }

  var exporter = (App.exporter = {

    /* 预估导出尺寸 */
    previewSize: function (scale) {
      var s = App.store.get();
      var w = Math.round(s.canvas.width * scale);
      var h = Math.round(s.canvas.height * scale);
      var limit = MAX_SIDE / Math.max(s.canvas.width, s.canvas.height);
      if (scale > limit) {
        w = Math.round(s.canvas.width * limit);
        h = Math.round(s.canvas.height * limit);
      }
      return { w: w, h: h, clipped: scale > limit };
    },

    /* 导出图片 */
    exportImage: function (opts) {
      opts = opts || {};
      var format = opts.format || 'png';
      var scale = opts.scale || 1;
      var quality = (opts.quality || 92) / 100;
      var s = App.store.get();

      return waitForImages(s.elements).then(function () {
        var size = exporter.previewSize(scale);
        var canvas = document.createElement('canvas');
        canvas.width = size.w;
        canvas.height = size.h;
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        var realScale = size.w / s.canvas.width;
        App.render.drawDocument(ctx, realScale);

        var mime = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
        return new Promise(function (resolve, reject) {
          canvas.toBlob(function (blob) {
            if (!blob) { reject(new Error('导出失败')); return; }
            util.download(blob, safeName(opts.filename) + '.' + (format === 'jpeg' ? 'jpg' : format));
            resolve({ w: size.w, h: size.h, size: blob.size });
          }, mime, format === 'png' ? undefined : quality);
        });
      });
    },

    /* 生成 dataURL（用于工程保存） */
    toDataURL: function (src) {
      if (!src) return Promise.resolve('');
      if (src.indexOf('data:') === 0) return Promise.resolve(src);
      return fetch(src).then(function (r) { return r.blob(); }).then(function (b) {
        return new Promise(function (res) {
          var fr = new FileReader();
          fr.onload = function () { res(fr.result); };
          fr.onerror = function () { res(''); };
          fr.readAsDataURL(b);
        });
      }).catch(function () { return ''; });
    },

    /* 保存工程为 JSON */
    saveProject: function () {
      var s = App.store.get();
      var list = s.elements.filter(function (e) { return e.type === 'image'; });
      return Promise.all(list.map(function (el) {
        return exporter.toDataURL(el.src).then(function (d) {
          return { id: el.id, dataUrl: d };
        });
      })).then(function (map) {
        var byId = {};
        map.forEach(function (m) { byId[m.id] = m.dataUrl; });
        var data = {
          version: 1,
          app: 'image-stitcher',
          savedAt: new Date().toISOString(),
          canvas: s.canvas,
          arrangement: s.arrangement,
          elements: s.elements.map(function (el) {
            var o = {};
            for (var k in el) { if (k !== 'img' && k !== 'dataUrl') o[k] = el[k]; }
            if (el.type === 'image' && byId[el.id]) o.src = byId[el.id];
            return o;
          })
        };
        var blob = util.toBlob(JSON.stringify(data, null, 2));
        util.download(blob, safeName('拼图工程') + '.json');
        return true;
      });
    },

    /* 打开工程 */
    loadProject: function (file) {
      return util.readAsDataURL(file).then(function (txt) {
        var data = JSON.parse(txt);
        if (!data || !Array.isArray(data.elements)) throw new Error('文件格式不正确');

        var pending = data.elements.filter(function (el) { return el.type === 'image' && el.src; })
          .map(function (el) {
            return new Promise(function (res) {
              var img = new Image();
              img.onload = function () {
                el.img = img;
                el.naturalW = img.naturalWidth;
                el.naturalH = img.naturalHeight;
                res(el);
              };
              img.onerror = function () { res(el); };
              img.src = el.src;
            });
          });

        return Promise.all(pending).then(function () {
          var elements = data.elements.map(function (el) {
            var o = {};
            for (var k in el) { if (k !== 'img') o[k] = el[k]; }
            return o;
          });
          App.store.replaceAll({
            canvas: data.canvas || { width: 1920, height: 1080, bg: '#ffffff' },
            arrangement: data.arrangement || 'free',
            elements: elements
          });
          return elements.length;
        });
      });
    }
  });
})();
