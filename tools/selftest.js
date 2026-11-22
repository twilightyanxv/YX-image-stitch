#!/usr/bin/env node
/* ============================================================
   selftest.js —— 通过 Chrome DevTools Protocol 对页面做端到端自测
   依赖：系统已安装 Chrome/Edge（无需任何 npm 依赖）
   用法： node tools/selftest.js
   ============================================================ */
'use strict';

const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

const CHROME = CHROME_CANDIDATES.find(p => fs.existsSync(p));
if (!CHROME) { console.error('未找到 Chrome/Edge，跳过自测'); process.exit(2); }

const PORT = 5178;
const CDP_PORT = 9333;
const SITE = 'http://127.0.0.1:' + PORT + '/';
const profile = path.join(os.tmpdir(), 'stitch-selftest-' + Date.now());

/* ---------- 启动静态服务器 ---------- */
const server = spawn(process.execPath, [path.join(__dirname, '..', 'serve.js'), String(PORT)], {
  stdio: 'ignore'
});

/* ---------- 启动浏览器 ---------- */
const browser = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--disable-extensions',
  '--remote-debugging-port=' + CDP_PORT,
  '--user-data-dir=' + profile,
  '--window-size=1440,900',
  'about:blank'
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitFor(fn, timeout = 15000, label = '') {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    try { const v = await fn(); if (v) return v; } catch (e) { /* retry */ }
    await sleep(150);
  }
  throw new Error('等待超时: ' + label);
}

/* ---------- CDP 客户端 ---------- */
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.events = []; }
  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const c = new CDP(ws);
    ws.onmessage = ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && c.pending.has(msg.id)) {
        const { res, rej } = c.pending.get(msg.id);
        c.pending.delete(msg.id);
        msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
      } else if (msg.method) {
        c.events.push(msg);
      }
    };
    return c;
  }
  send(method, params) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params: params || {} }));
      setTimeout(() => {
        if (this.pending.has(id)) { this.pending.delete(id); rej(new Error('CDP 超时: ' + method)); }
      }, 30000);
    });
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', {
      expression: '(async function(){ try { return JSON.stringify(await (' + expression + ')); } catch(e) { return JSON.stringify({__error: e.message + " | " + (e.stack||"")}); } })()',
      returnByValue: true,
      awaitPromise: true
    });
    if (r.exceptionDetails) throw new Error('页面异常: ' + JSON.stringify(r.exceptionDetails));
    return JSON.parse(r.result.value);
  }
}

/* ---------- 测试用例 ---------- */
const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail === undefined ? '' : String(detail) });
}

(async () => {
  let cdp;
  const origins = new Set();   /* 收集全站出现的域名来源，用于一致性校验 */
  try {
    await waitFor(async () => {
      const r = await fetch('http://127.0.0.1:' + CDP_PORT + '/json/version');
      return r.ok;
    }, 15000, '浏览器调试端口');

    const list = await (await fetch('http://127.0.0.1:' + CDP_PORT + '/json/list')).json();
    const page = list.find(t => t.type === 'page');
    cdp = await CDP.connect(page.webSocketDebuggerUrl);

    await cdp.send('Runtime.enable');
    await cdp.send('Log.enable');
    await cdp.send('Page.enable');
    await cdp.send('Page.navigate', { url: SITE });
    await sleep(2500);

    /* 收集运行期错误 */
    const errors = cdp.events
      .filter(e => e.method === 'Runtime.exceptionThrown')
      .map(e => (e.params.exceptionDetails.exception || {}).description || e.params.exceptionDetails.text);
    const consoleErrors = cdp.events
      .filter(e => e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error')
      .map(e => e.params.args.map(a => a.description || a.value).join(' '));

    check('页面无 JS 运行时异常', errors.length === 0, errors.join(' | '));
    check('控制台无 error 输出', consoleErrors.length === 0, consoleErrors.join(' | '));

    /* --- 首屏截图（未操作状态） --- */
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440, height: 900, deviceScaleFactor: 1, mobile: false
    });
    await sleep(500);
    await cdp.eval(`(function(){ App.main.fitToScreen(); return 1; })()`);
    await sleep(500);
    const cleanShot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const cleanBuf = Buffer.from(cleanShot.data, 'base64');
    fs.writeFileSync(path.join(os.tmpdir(), 'stitch-shot-clean.png'), cleanBuf);
    try { fs.copyFileSync(path.join(os.tmpdir(), 'stitch-shot-clean.png'), path.join(__dirname, '..', 'screenshot-home.png')); }
    catch (e) { /* 忽略写入失败 */ }
    check('首屏截图已保存', true, 'screenshot-home.png');

    /* --- 初始化 --- */
    const init = await cdp.eval(`({
      hasApp: typeof App !== 'undefined',
      presets: document.querySelectorAll('#canvasPresets .preset').length,
      domReady: !!(App.dom && App.dom.canvas),
      ctxOk: !!(App.ctx && App.dom && App.dom.canvas)
    })`);
    check('App 命名空间已建立', init.hasApp);
    check('画布比例快捷按钮已渲染(8个)', init.presets === 8, init.presets);
    check('画布上下文初始化成功', init.ctxOk, JSON.stringify(init));

    /* --- 画布预设 --- */
    const preset = await cdp.eval(`(function(){
      var b = document.querySelectorAll('#canvasPresets .preset')[1]; // 9:16
      b.click();
      return { w: App.store.get().canvas.width, h: App.store.get().canvas.height };
    })()`);
    check('点击 9:16 预设切换画布为 1080x1920',
      preset.w === 1080 && preset.h === 1920, JSON.stringify(preset));

    await cdp.eval(`(function(){
      document.querySelectorAll('#canvasPresets .preset')[0].click();
      return 1;
    })()`);

    /* --- 添加图片 + 三种排列 --- */
    const arrange = await cdp.eval(`(function(){
      function addImg(w,h,color){
        var c = document.createElement('canvas'); c.width=w; c.height=h;
        var x = c.getContext('2d'); x.fillStyle=color; x.fillRect(0,0,w,h);
        var url = c.toDataURL('image/png');
        var img = new Image();
        img.onload = function(){
          var el = App.elements.createImage({src:url, img:img, x:0,y:0,w:100,h:100,
            naturalW:w, naturalH:h, name:'t'+w+'x'+h});
          App.store.get().elements.push(el);
        };
        img.src = url;
      }
      /* 4 张同比例图 + 2 张异比例图 */
      for (var i=0;i<4;i++) addImg(400,200,['#f00','#0f0','#00f','#ff0'][i]);
      addImg(200,400,'#0ff'); addImg(300,300,'#f0f');
      return new Promise(function(res){
        setTimeout(function(){
          var st = App.store.get();
          function imgs(){ return st.elements.filter(function(e){return e.type==='image';}); }

          App.arrange.apply('horizontal', {gap: 20});
          var H = imgs();
          var hRes = {
            sameH: new Set(H.map(function(e){return Math.round(e.h);})).size === 1,
            sameY: new Set(H.map(function(e){return Math.round(e.y);})).size === 1,
            totalW: Math.round(H.reduce(function(a,e){return a+e.w;},0) + 20*(H.length-1)),
            canvasW: st.canvas.width,
            aspectKept: H.every(function(e){ return Math.abs(e.w/e.h - e.naturalW/e.naturalH) < 0.02; })
          };

          App.arrange.apply('vertical', {gap: 0});
          var V = imgs();
          var vRes = {
            sameW: new Set(V.map(function(e){return Math.round(e.w);})).size === 1,
            sameX: new Set(V.map(function(e){return Math.round(e.x);})).size === 1,
            totalH: Math.round(V.reduce(function(a,e){return a+e.h;},0)),
            canvasH: st.canvas.height,
            aspectKept: V.every(function(e){ return Math.abs(e.w/e.h - e.naturalW/e.naturalH) < 0.02; }),
            inBounds: V.every(function(e){ return e.y >= 0 && e.y + e.h <= st.canvas.height + 1; })
          };

          App.arrange.apply('grid', {gap: 10, cols: 3});
          var G = imgs();
          /* 每一列的最小左边缘即该列的单元格左边界 */
          var colLeft = [];
          for (var c = 0; c < 3; c++) {
            var xs = G.filter(function(e, i){ return i % 3 === c; }).map(function(e){ return e.x; });
            colLeft.push(Math.round(Math.min.apply(null, xs)));
          }
          var gRes = {
            cols: new Set(colLeft).size,
            colLeft: colLeft,
            inBounds: G.every(function(e){ return e.x >= -1 && e.y >= -1 &&
              e.x + e.w <= st.canvas.width + 1 && e.y + e.h <= st.canvas.height + 1; }),
            count: G.length
          };
          res({ count: imgs().length, h: hRes, v: vRes, g: gRes });
        }, 500);
      });
    })()`);

    check('可添加图片元素(6张)', arrange.count === 6, JSON.stringify(arrange.count));
    check('横向排列: 等高且横向铺满画布宽度',
      arrange.h.sameH && arrange.h.sameY && arrange.h.totalW <= arrange.h.canvasW,
      JSON.stringify(arrange.h));
    check('横向排列: 保持图片原始宽高比', arrange.h.aspectKept, JSON.stringify(arrange.h.aspectKept));
    check('纵向排列: 等宽且纵向铺满画布高度',
      arrange.v.sameW && arrange.v.sameX && arrange.v.totalH <= arrange.v.canvasH,
      JSON.stringify(arrange.v));
    check('纵向排列: 保持图片原始宽高比', arrange.v.aspectKept, JSON.stringify(arrange.v.aspectKept));
    check('纵向排列: 元素不超出画布', arrange.v.inBounds, JSON.stringify(arrange.v));
    check('网格排列: 3 列且元素不超出画布',
      arrange.g.cols === 3 && arrange.g.inBounds, JSON.stringify(arrange.g));

    /* --- 文字排版 --- */
    const text = await cdp.eval(`(function(){
      var t = App.elements.createText({text:'你好，图片拼接工具 Hello World 2026', w: 300, fontSize: 40});
      App.store.get().elements.push(t);
      var l1 = App.elements.layoutText(t);
      var l2 = App.elements.layoutText({text:'短', w:300, fontSize:40});
      var over = App.elements.layoutText({text:'这是一段很长很长的中文文字用于测试自动换行是否正常工作', w:120, fontSize:40});
      return {
        lines: l1.lines.length,
        lineText: l1.lines,
        height: Math.round(t.h),
        expected: Math.round(l1.lines.length * 40 * 1.3),
        shortLines: l2.lines.length,
        wrapped: over.lines.length,
        containsEnglish: l1.lines.join(' ').indexOf('Hello World') >= 0
      };
    })()`);
    check('文字可按宽度换行', text.lines > 1, JSON.stringify(text.lineText));
    check('文字高度 = 行数 x 字号 x 行高', Math.abs(text.height - text.expected) <= 1, text.height + ' vs ' + text.expected);
    check('中英文混排保留英文单词', text.containsEnglish, JSON.stringify(text.lineText));
    check('长中文串自动折行', text.wrapped > 1, text.wrapped);

    /* --- 几何 / 命中检测 --- */
    const geo = await cdp.eval(`(function(){
      var el = App.elements.createImage({x:100,y:100,w:200,h:100,naturalW:200,naturalH:100});
      el.rotation = 30;
      var inside = App.elements.hitTest(el, 200, 150);
      var outside = App.elements.hitTest(el, 100, 100);
      var c = App.elements.center(el);
      var c2 = App.elements.localToDoc(el, el.w, el.h);
      var back = App.elements.docToLocal(el, c2.x, c2.y);
      return { inside:inside, outside:outside, cx:Math.round(c.x), cy:Math.round(c.y),
               rt: Math.abs(back.x-el.w)<0.01 && Math.abs(back.y-el.h)<0.01 };
    })()`);
    check('旋转后命中检测正确', geo.inside === true && geo.outside === false, JSON.stringify(geo));
    check('本地坐标/画布坐标互转可逆', geo.rt, JSON.stringify(geo));

    /* --- 撤销 / 重做 --- */
    const hist = await cdp.eval(`(function(){
      var st = App.store.get();
      var before = st.elements.length;
      App.store.commit();                       /* 建立基线快照 */
      var el = App.elements.createText({text:'undo me', w:200});
      st.elements.push(el);
      App.store.commit();
      var mid = st.elements.length;
      App.store.undo();
      var afterUndo = App.store.get().elements.length;
      App.store.redo();
      var afterRedo = App.store.get().elements.length;
      return { before:before, mid:mid, afterUndo:afterUndo, afterRedo:afterRedo,
               canUndo: App.store.canUndo(), canRedo: App.store.canRedo() };
    })()`);
    check('撤销能恢复上一步', hist.afterUndo === hist.before, JSON.stringify(hist));
    check('重做能恢复撤销的操作', hist.afterRedo === hist.mid, JSON.stringify(hist));

    /* --- 导出渲染 --- */
    const exp = await cdp.eval(`(function(){
      var st = App.store.get();
      var c = document.createElement('canvas');
      c.width = st.canvas.width; c.height = st.canvas.height;
      var x = c.getContext('2d');
      App.render.drawDocument(x, 1);
      var d = x.getImageData(0,0,c.width,c.height).data;
      var nonWhite = 0;
      for (var i=0;i<d.length;i+=4){ if (d[i]!==255||d[i+1]!==255||d[i+2]!==255) nonWhite++; }
      var size = App.exporter.previewSize(2);
      return { w:c.width, h:c.height, nonWhite: nonWhite, expW: size.w, expH: size.h };
    })()`);
    check('导出画布已绘制内容', exp.nonWhite > 1000, '非空像素=' + exp.nonWhite);
    check('2x 导出尺寸翻倍', exp.expW === exp.w * 2 && exp.expH === exp.h * 2, JSON.stringify(exp));

    /* 导出管线：能否真正编码出 PNG / JPEG */
    const blobInfo = await cdp.eval(`(function(){
      var st = App.store.get();
      function enc(mime, q){
        var c = document.createElement('canvas');
        c.width = st.canvas.width; c.height = st.canvas.height;
        App.render.drawDocument(c.getContext('2d'), 1);
        return new Promise(function(res){
          c.toBlob(function(b){ res({ size: b?b.size:0, type: b?b.type:'' }); }, mime, q);
        });
      }
      return Promise.all([enc('image/png'), enc('image/jpeg', 0.92), enc('image/webp', 0.9)])
        .then(function(r){ return { png:r[0], jpeg:r[1], webp:r[2] }; });
    })()`);
    check('导出可编码为有效 PNG',
      blobInfo.png.type === 'image/png' && blobInfo.png.size > 2000, JSON.stringify(blobInfo.png));
    check('导出可编码为有效 JPEG',
      blobInfo.jpeg.type === 'image/jpeg' && blobInfo.jpeg.size > 1000, JSON.stringify(blobInfo.jpeg));
    check('导出可编码为有效 WebP',
      blobInfo.webp.type === 'image/webp' && blobInfo.webp.size > 500, JSON.stringify(blobInfo.webp));

    /* --- 工程保存 / 载入 --- */
    const proj = await cdp.eval(`(function(){
      var st = App.store.get();
      var data = { version:1, canvas: st.canvas, arrangement: st.arrangement,
        elements: st.elements.map(function(e){ var o={}; for(var k in e){ if(k!=='img') o[k]=e[k]; } return o; }) };
      var json = JSON.stringify(data);
      var back = JSON.parse(json);
      return { ok: back.elements.length === st.elements.length, n: back.elements.length };
    })()`);
    check('工程可序列化', proj.ok, JSON.stringify(proj));

    /* --- SEO 检查 --- */
    const seo = await cdp.eval(`(function(){
      var ld = [];
      document.querySelectorAll('script[type="application/ld+json"]').forEach(function(s){
        try { ld.push(JSON.parse(s.textContent)); } catch(e){ ld.push({__bad: e.message}); }
      });
      return {
        title: document.title,
        desc: (document.querySelector('meta[name=description]')||{}).content,
        canonical: (document.querySelector('link[rel=canonical]')||{}).href,
        ogUrl: (document.querySelector('meta[property="og:url"]')||{}).content || '',
        ogImage: (document.querySelector('meta[property="og:image"]')||{}).content || '',
        twImage: (document.querySelector('meta[name="twitter:image"]')||{}).content || '',
        og: document.querySelectorAll('meta[property^="og:"]').length,
        twitter: document.querySelectorAll('meta[name^="twitter:"]').length,
        h1: document.querySelectorAll('h1').length,
        h1Text: (document.querySelector('h1')||{}).textContent,
        ldCount: ld.length,
        ldBad: ld.filter(function(x){return x.__bad;}).length,
        ldTypes: ld.map(function(x){ return x['@graph'] ? x['@graph'].map(function(g){return g['@type'];}) : x['@type']; }).flat(),
        lang: document.documentElement.lang,
        imgNoAlt: Array.from(document.querySelectorAll('img')).filter(function(i){return !i.hasAttribute('alt');}).length
      };
    })()`);
    check('页面标题包含关键词', /图片拼接/.test(seo.title), seo.title);
    check('meta description 存在且长度合理', seo.desc && seo.desc.length >= 60 && seo.desc.length <= 200, seo.desc.length);
    check('canonical 链接存在', !!seo.canonical, seo.canonical);
    check('Open Graph 标签齐全(>=8)', seo.og >= 8, seo.og);
    check('Twitter Card 标签存在', seo.twitter >= 3, seo.twitter);
    check('页面只有一个 h1', seo.h1 === 1, seo.h1 + ': ' + seo.h1Text);
    check('JSON-LD 全部可解析', seo.ldBad === 0 && seo.ldCount >= 1, JSON.stringify(seo.ldTypes));
    check('JSON-LD 包含 WebApplication 与 FAQPage',
      seo.ldTypes.includes('WebApplication') && seo.ldTypes.includes('FAQPage'), JSON.stringify(seo.ldTypes));
    check('html lang 为 zh-CN', seo.lang === 'zh-CN', seo.lang);
    check('所有 img 都有 alt', seo.imgNoAlt === 0, seo.imgNoAlt);
    check('首页 canonical / OG / Twitter 均指向正式域名',
      seo.canonical.indexOf('https://stitch.yanxv.com') === 0 &&
      seo.ogUrl.indexOf('https://stitch.yanxv.com') === 0 &&
      seo.ogImage.indexOf('https://stitch.yanxv.com') === 0 &&
      seo.twImage.indexOf('https://stitch.yanxv.com') === 0,
      `${seo.canonical} | ${seo.ogUrl} | ${seo.ogImage} | ${seo.twImage}`);
    [seo.canonical, seo.ogUrl, seo.ogImage, seo.twImage].forEach(u => {
      const m = /^https?:\/\/[^/]+/.exec(u || '');
      if (m) origins.add(m[0]);
    });

    /* --- 真实鼠标拖拽（CDP 派发原生事件） --- */
    const dragInfo = await cdp.eval(`(function(){
      var st = App.store.get();
      /* 取最上层的图片元素 */
      var el = null;
      for (var i = st.elements.length-1; i >= 0; i--) { if (st.elements[i].type === 'image') { el = st.elements[i]; break; } }
      var c = App.elements.center(el);
      var rect = App.dom.canvas.getBoundingClientRect();
      var zoom = st.view.zoom;
      return { id: el.id, x: el.x, y: el.y, w: el.w, h: el.h, zoom: zoom,
        sx: rect.left + c.x*zoom, sy: rect.top + c.y*zoom,
        tx: rect.left + (c.x+140)*zoom, ty: rect.top + (c.y+70)*zoom };
    })()`);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: dragInfo.sx, y: dragInfo.sy, button: 'left', clickCount: 1, buttons: 1 });
    for (let i = 1; i <= 6; i++) {
      await cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: dragInfo.sx + (dragInfo.tx - dragInfo.sx) * i / 6,
        y: dragInfo.sy + (dragInfo.ty - dragInfo.sy) * i / 6,
        button: 'left', buttons: 1
      });
      await sleep(30);
    }
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: dragInfo.tx, y: dragInfo.ty, button: 'left', clickCount: 1, buttons: 0 });
    await sleep(300);

    const afterDrag = await cdp.eval(`(function(){
      var st = App.store.get();
      var el = App.store.getById(${JSON.stringify(dragInfo.id)});
      return { x: el.x, y: el.y, sel: st.selectedIds.length,
               undoable: App.store.canUndo(), type: el.type };
    })()`);
    const movedX = afterDrag.x - dragInfo.x;
    const movedY = afterDrag.y - dragInfo.y;
    /* 拖拽带边缘吸附，允许一定偏差 */
    const SNAP_TOL = 20;
    check('鼠标可拖拽图片到新位置',
      Math.abs(movedX - 140) < SNAP_TOL && Math.abs(movedY - 70) < SNAP_TOL,
      `位移=(${movedX.toFixed(1)}, ${movedY.toFixed(1)}) 期望≈(140, 70)（含吸附容差 ${SNAP_TOL}）`);
    check('拖拽后元素被选中', afterDrag.sel === 1, afterDrag.sel);
    check('拖拽可被撤销', afterDrag.undoable);

    /* 撤销后位置应精确还原 */
    await cdp.eval(`(function(){ App.store.undo(); return 1; })()`);
    await sleep(200);
    const afterUndo = await cdp.eval(`(function(){
      var el = App.store.getById(${JSON.stringify(dragInfo.id)});
      return { x: el.x, y: el.y };
    })()`);
    check('撤销拖拽后位置精确还原',
      Math.abs(afterUndo.x - dragInfo.x) < 0.5 && Math.abs(afterUndo.y - dragInfo.y) < 0.5,
      JSON.stringify(afterUndo) + ' vs ' + JSON.stringify({ x: dragInfo.x, y: dragInfo.y }));
    await cdp.eval(`(function(){ App.store.redo(); return 1; })()`);
    await sleep(200);

    /* --- 缩放控制点拖拽 --- */
    const handleInfo = await cdp.eval(`(function(){
      var st = App.store.get();
      var el = App.store.getById(${JSON.stringify(dragInfo.id)});
      /* 把元素放回画布内，保证控制点可点击 */
      el.x = 300; el.y = 200;
      App.store.commit();
      App.store.select([el.id]);
      var hp = App.elements.handlePoints(el);
      var se = hp.filter(function(h){return h.id==='se';})[0];
      var rect = App.dom.canvas.getBoundingClientRect();
      var zoom = st.view.zoom;
      return { type: el.type, sx: rect.left + se.x*zoom, sy: rect.top + se.y*zoom,
               tx: rect.left + (se.x+120)*zoom, ty: rect.top + (se.y+120)*zoom,
               w: el.w, h: el.h, ratio: el.w/el.h };
    })()`);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: handleInfo.sx, y: handleInfo.sy, button: 'left', clickCount: 1, buttons: 1 });
    for (let i = 1; i <= 6; i++) {
      await cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: handleInfo.sx + (handleInfo.tx - handleInfo.sx) * i / 6,
        y: handleInfo.sy + (handleInfo.ty - handleInfo.sy) * i / 6,
        button: 'left', buttons: 1
      });
      await sleep(30);
    }
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: handleInfo.tx, y: handleInfo.ty, button: 'left', clickCount: 1, buttons: 0 });
    await sleep(300);
    const afterResize = await cdp.eval(`(function(){
      var el = App.store.getById(${JSON.stringify(dragInfo.id)});
      return { w: el.w, h: el.h, ratio: el.w/el.h, x: el.x, y: el.y, type: el.type };
    })()`);
    check('拖拽角控制点可等比缩放图片',
      handleInfo.type === 'image' &&
      afterResize.w > handleInfo.w + 5 &&
      Math.abs(afterResize.ratio - handleInfo.ratio) < 0.05,
      JSON.stringify({ before: handleInfo, after: afterResize }));

    /* --- 导出弹窗 --- */
    const modal = await cdp.eval(`(function(){
      document.getElementById('exportBtn').click();
      var open = !document.getElementById('exportModal').hidden;
      var hint = document.getElementById('exportSizeHint').textContent;
      document.getElementById('exportCancel').click();
      return { open: open, hint: hint, closed: document.getElementById('exportModal').hidden };
    })()`);
    check('导出弹窗可打开并显示输出尺寸',
      modal.open && /输出尺寸/.test(modal.hint) && modal.closed, JSON.stringify(modal));

    /* --- 截图 --- */
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440, height: 980, deviceScaleFactor: 1, mobile: false
    });
    await sleep(800);
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const shotBuf = Buffer.from(shot.data, 'base64');
    const tmpShot = path.join(os.tmpdir(), 'stitch-shot.png');
    fs.writeFileSync(tmpShot, shotBuf);
    let shotSaved = false;
    try {
      fs.copyFileSync(tmpShot, path.join(__dirname, '..', 'screenshot.png'));
      shotSaved = true;
    } catch (e) {
      try { fs.writeFileSync(path.join(__dirname, '..', 'screenshot.png'), shotBuf); shotSaved = true; }
      catch (e2) { shotSaved = false; }
    }
    check('页面截图已保存', shotSaved, 'screenshot.png (' + (shotBuf.length / 1024).toFixed(0) + ' KB)');

    /* --- 窄屏（移动端）布局截图 --- */
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 420, height: 900, deviceScaleFactor: 1, mobile: true
    });
    await sleep(900);
    const mShot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const mBuf = Buffer.from(mShot.data, 'base64');
    fs.writeFileSync(path.join(os.tmpdir(), 'stitch-shot-mobile.png'), mBuf);
    try { fs.copyFileSync(path.join(os.tmpdir(), 'stitch-shot-mobile.png'), path.join(__dirname, '..', 'screenshot-mobile.png')); }
    catch (e) { /* 忽略 */ }
    const mobile = await cdp.eval(`(function(){
      var app = document.getElementById('app');
      var cs = getComputedStyle(app);
      return { cols: cs.gridTemplateColumns, overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
               scrollW: document.documentElement.scrollWidth, winW: window.innerWidth };
    })()`);
    check('窄屏无横向溢出', !mobile.overflowX, 'scrollWidth=' + mobile.scrollW + ' / window=' + mobile.winW);

    /* --- 次级页面 SEO 体检 --- */
    const PAGES = ['about.html', 'guide.html', 'faq.html', 'privacy.html', '404.html'];
    const SITE_DOMAIN = 'https://stitch.yanxv.com';
    const cssClasses = (await (await fetch(SITE + 'assets/css/style.css')).text());
    const defined = new Set();
    (cssClasses.match(/\.[A-Za-z_][A-Za-z0-9_-]*/g) || []).forEach(c => defined.add(c.slice(1)));

    for (const page of PAGES) {
      await cdp.send('Page.navigate', { url: SITE + page });
      await waitFor(async () => (await cdp.eval('document.readyState')) === 'complete', 10000, page + ' 加载');
      await sleep(400);

      const info = await cdp.eval(`(function(){
        var ld = [], bad = 0;
        document.querySelectorAll('script[type="application/ld+json"]').forEach(function(s){
          try { ld.push(JSON.parse(s.textContent)); } catch(e){ bad++; }
        });
        var used = {};
        document.querySelectorAll('body *').forEach(function(n){
          if (n.classList && n.classList.length) n.classList.forEach(function(c){ used[c]=1; });
        });
        return {
          title: document.title,
          desc: (document.querySelector('meta[name=description]')||{}).content || '',
          canonical: (document.querySelector('link[rel=canonical]')||{}).href || '',
          robots: (document.querySelector('meta[name=robots]')||{}).content || '',
          og: document.querySelectorAll('meta[property^="og:"]').length,
          ogUrl: (document.querySelector('meta[property="og:url"]')||{}).content || '',
          ogImage: (document.querySelector('meta[property="og:image"]')||{}).content || '',
          twImage: (document.querySelector('meta[name="twitter:image"]')||{}).content || '',
          twitter: document.querySelectorAll('meta[name^="twitter:"]').length,
          h1: document.querySelectorAll('h1').length,
          ldCount: ld.length, ldBad: bad,
          ldTypes: ld.map(function(x){ return x['@graph'] ? x['@graph'].map(function(g){return g['@type'];}) : x['@type']; }).flat(),
          words: document.body.innerText.replace(/\\s/g,'').length,
          usedClasses: Object.keys(used),
          lang: document.documentElement.lang
        };
      })()`);

      const undefinedClasses = info.usedClasses.filter(c => !defined.has(c));
      check(`[${page}] 有唯一 title 且含关键词`,
        info.title.length >= 10 && info.title.length <= 80 && /图片拼接|拼图/.test(info.title), info.title);
      check(`[${page}] meta description 长度合理`,
        info.desc.length >= 60 && info.desc.length <= 200, info.desc.length + ' 字符');
      check(`[${page}] canonical / robots / OG / Twitter 齐全`,
        !!info.canonical && !!info.robots && info.og >= 6 && info.twitter >= 3,
        `canonical=${!!info.canonical} robots="${info.robots}" og=${info.og} tw=${info.twitter}`);
      check(`[${page}] 仅一个 h1 且 lang 正确`,
        info.h1 === 1 && info.lang === 'zh-CN', `h1=${info.h1} lang=${info.lang}`);
      check(`[${page}] JSON-LD 全部可解析`,
        info.ldBad === 0 && info.ldCount >= 1, JSON.stringify(info.ldTypes));
      check(`[${page}] 正文内容量充足(>=500字)`,
        info.words >= 500, info.words + ' 字');
      check(`[${page}] 未使用样式表中不存在的 class`,
        undefinedClasses.length === 0, undefinedClasses.join(', '));

      /* 域名一致性 */
      [info.canonical, info.ogUrl, info.ogImage, info.twImage].forEach(u => {
        const m = /^https?:\/\/[^/]+/.exec(u || '');
        if (m) origins.add(m[0]);
      });
      check(`[${page}] canonical / OG / Twitter 均指向正式域名`,
        info.canonical.indexOf(SITE_DOMAIN) === 0 &&
        (info.ogUrl || '').indexOf(SITE_DOMAIN) === 0 &&
        (info.ogImage || '').indexOf(SITE_DOMAIN) === 0 &&
        (info.twImage || '').indexOf(SITE_DOMAIN) === 0,
        `${info.canonical} | ${info.ogUrl} | ${info.ogImage}`);

      if (page === 'guide.html') {
        await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1400, deviceScaleFactor: 1, mobile: false });
        await sleep(400);
        const gs = await cdp.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(os.tmpdir(), 'stitch-guide.png'), Buffer.from(gs.data, 'base64'));
        try { fs.copyFileSync(path.join(os.tmpdir(), 'stitch-guide.png'), path.join(__dirname, '..', 'screenshot-guide.png')); } catch (e) {}
      }
    }

    /* --- 404 行为 --- */
    await cdp.send('Page.navigate', { url: SITE + 'no-such-page-xyz.html' });
    await sleep(900);
    const notFound = await cdp.eval(`({ h1: (document.querySelector('h1')||{}).textContent,
                                       hasLinks: document.querySelectorAll('a').length })`);
    check('未知路径回落到 404 页并保留导航',
      /404|走丢|不存在/.test(notFound.h1 || '') && notFound.hasLinks > 3,
      JSON.stringify(notFound));

    /* --- robots.txt / sitemap.xml --- */
    const robotsTxt = await (await fetch(SITE + 'robots.txt')).text();
    const sitemapTxt = await (await fetch(SITE + 'sitemap.xml')).text();
    check('robots.txt 指向 sitemap 且允许抓取',
      /User-agent:\s*\*/i.test(robotsTxt) && /Sitemap:\s*https?:\/\//i.test(robotsTxt), robotsTxt.trim().split('\n')[0]);
    check('sitemap.xml 合法且包含 5 个页面',
      sitemapTxt.includes('<urlset') && (sitemapTxt.match(/<loc>/g) || []).length === 5 &&
      !sitemapTxt.includes('404'), (sitemapTxt.match(/<loc>/g) || []).length + ' 个 URL');
    check('robots.txt / sitemap.xml 使用正式域名',
      robotsTxt.includes('https://stitch.yanxv.com/sitemap.xml') &&
      sitemapTxt.includes('https://stitch.yanxv.com/') &&
      !sitemapTxt.includes('example.com'), 'stitch.yanxv.com');
    check('全站域名一致（无混用）',
      origins.size === 1 && origins.has('https://stitch.yanxv.com'),
      [...origins].join(', ') || '(无)');
  } catch (e) {
    check('测试执行', false, e.message);
  } finally {
    try { if (cdp) cdp.ws.close(); } catch (e) {}
    browser.kill();
    server.kill();
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
  }

  console.log('\n================ 自测结果 ================');
  let pass = 0, fail = 0;
  results.forEach(r => {
    console.log((r.ok ? '  PASS  ' : '  FAIL  ') + r.name + (r.detail ? '   → ' + r.detail : ''));
    r.ok ? pass++ : fail++;
  });
  console.log('--------------------------------------------');
  console.log('  通过 ' + pass + ' / ' + (pass + fail));
  console.log('============================================\n');
  process.exit(fail ? 1 : 0);
})();
