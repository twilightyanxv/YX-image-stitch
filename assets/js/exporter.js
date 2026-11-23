/* ============================================================
   exporter.js —— 导出图片
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
    }
  });
})();
