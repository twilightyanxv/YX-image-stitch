/* ============================================================
   docmodal.js —— 在当前页面内以弹窗方式打开文档页
   目的：在首页编辑图片时不跳走，画布状态不会丢失
   ============================================================ */
(function () {
  'use strict';

  var App = (window.App = window.App || {});

  /* 可在弹窗中打开的文档页：路径 → 弹窗标题 */
  var DOCS = {
    '/guide.html': '使用教程',
    '/faq.html': '常见问题',
    '/about.html': '关于工具',
    '/privacy.html': '隐私政策'
  };

  var dom = {};
  var cache = {};
  var loading = null;
  var current = null;

  function init() {
    dom.modal = document.getElementById('docModal');
    dom.title = document.getElementById('docModalTitle');
    dom.body = document.getElementById('docModalBody');
    dom.close = document.getElementById('docModalClose');
    if (!dom.modal || !dom.body) return;

    dom.close.addEventListener('click', close);
    dom.modal.addEventListener('click', function (e) {
      if (e.target === dom.modal) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !dom.modal.hidden) close();
    });
    document.addEventListener('i18n:change', function () {
      updateTitle();
    });
  }

  /* 打开文档 */
  function open(path) {
    if (!dom.modal) { window.location.href = path; return; }
    current = path;
    updateTitle();
    dom.modal.hidden = false;
    document.body.style.overflow = 'hidden';

    if (cache[path]) { render(path, cache[path]); return; }

    dom.body.innerHTML = '<p class="hint">加载中…</p>';
    if (loading) loading = null;

    fetch(path, { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var main = doc.querySelector('main');
        if (!main) throw new Error('页面结构异常');
        var head = main.querySelector('.page-head');
        if (head) head.remove();
        cache[path] = main.innerHTML;
        render(path, cache[path]);
      })
      .catch(function () {
        dom.body.innerHTML = '<p class="hint">文档加载失败，<a href="' + path + '" target="_blank" rel="noopener">在新窗口打开</a>。</p>';
      });
  }

  function updateTitle() {
    if (!dom.title || !current) return;
    var t = DOCS[current] || '文档';
    dom.title.textContent = (App.i18n && App.i18n.t) ? App.i18n.t(t) : t;
  }

  function render(path, html) {
    dom.body.innerHTML = '<div class="doc-view">' + html + '</div>';
    dom.body.scrollTop = 0;
    if (App.i18n && App.i18n.applyTo) App.i18n.applyTo(dom.body);
  }

  function close() {
    if (!dom.modal) return;
    dom.modal.hidden = true;
    document.body.style.overflow = '';
  }

  /* 站内文档链接一律走弹窗 */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    var url;
    try { url = new URL(href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (!DOCS[url.pathname]) return;
    e.preventDefault();
    open(url.pathname);
  });

  App.docModal = { init: init, open: open, close: close };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
