#!/usr/bin/env node
/* ============================================================
   gen-images.js —— 无依赖生成 PNG 资源（og 图 / logo / 图标）
   用法： node tools/gen-images.js
   ============================================================ */
'use strict';

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'assets', 'img');

/* ---------------- PNG 编码 ---------------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(w, h, rgba) {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/* ---------------- 简易画布 ---------------- */
class Canvas {
  constructor(w, h, ss) {
    this.ss = ss || 3;
    this.w = w; this.h = h;
    this.W = w * this.ss; this.H = h * this.ss;
    this.buf = Buffer.alloc(this.W * this.H * 4);
  }
  blend(x, y, r, g, b, a) {
    if (x < 0 || y < 0 || x >= this.W || y >= this.H || a <= 0) return;
    const i = (y * this.W + x) * 4;
    const d = this.buf;
    const ia = 1 - a;
    d[i] = Math.round(r * a + d[i] * ia);
    d[i + 1] = Math.round(g * a + d[i + 1] * ia);
    d[i + 2] = Math.round(b * a + d[i + 2] * ia);
    d[i + 3] = Math.max(d[i + 3], Math.round(255 * a));
  }
  fill(color) {
    const [r, g, b, a] = color;
    for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) this.blend(x, y, r, g, b, a);
  }
  gradient(c1, c2, angle) {
    const rad = (angle * Math.PI) / 180;
    const dx = Math.cos(rad), dy = Math.sin(rad);
    const len = Math.abs(this.W * dx) + Math.abs(this.H * dy);
    for (let y = 0; y < this.H; y++) {
      for (let x = 0; x < this.W; x++) {
        let t = ((x - this.W / 2) * dx + (y - this.H / 2) * dy) / len + 0.5;
        t = Math.max(0, Math.min(1, t));
        this.blend(x, y,
          c1[0] + (c2[0] - c1[0]) * t,
          c1[1] + (c2[1] - c1[1]) * t,
          c1[2] + (c2[2] - c1[2]) * t, 1);
      }
    }
  }
  rect(x, y, w, h, color) {
    const s = this.ss;
    const x0 = Math.round(x * s), y0 = Math.round(y * s);
    const x1 = Math.round((x + w) * s), y1 = Math.round((y + h) * s);
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) this.blend(xx, yy, color[0], color[1], color[2], color[3] == null ? 1 : color[3]);
  }
  roundRect(x, y, w, h, r, color) {
    const s = this.ss;
    const x0 = Math.round(x * s), y0 = Math.round(y * s);
    const x1 = Math.round((x + w) * s), y1 = Math.round((y + h) * s);
    const R = r * s;
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) {
        const px = xx + 0.5, py = yy + 0.5;
        const cx = Math.min(Math.max(px, x0 + R), x1 - R);
        const cy = Math.min(Math.max(py, y0 + R), y1 - R);
        const d = Math.hypot(px - cx, py - cy);
        if (d <= R) this.blend(xx, yy, color[0], color[1], color[2], color[3] == null ? 1 : color[3]);
      }
    }
  }
  circle(cx, cy, r, color) {
    const s = this.ss;
    const CX = cx * s, CY = cy * s, R = r * s;
    for (let yy = Math.floor(CY - R); yy <= Math.ceil(CY + R); yy++) {
      for (let xx = Math.floor(CX - R); xx <= Math.ceil(CX + R); xx++) {
        const d = Math.hypot(xx + 0.5 - CX, yy + 0.5 - CY);
        if (d <= R) this.blend(xx, yy, color[0], color[1], color[2], color[3] == null ? 1 : color[3]);
      }
    }
  }
  polygon(points, color) {
    const s = this.ss;
    const pts = points.map(p => [p[0] * s, p[1] * s]);
    let minY = Infinity, maxY = -Infinity;
    pts.forEach(p => { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
          xs.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
        }
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        for (let x = Math.floor(xs[k]); x <= Math.ceil(xs[k + 1]); x++) {
          this.blend(x, y, color[0], color[1], color[2], color[3] == null ? 1 : color[3]);
        }
      }
    }
  }
  /* 降采样输出 */
  toPNG() {
    const s = this.ss;
    const out = Buffer.alloc(this.w * this.h * 4);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        for (let dy = 0; dy < s; dy++) {
          for (let dx = 0; dx < s; dx++) {
            const i = ((y * s + dy) * this.W + (x * s + dx)) * 4;
            r += this.buf[i]; g += this.buf[i + 1]; b += this.buf[i + 2]; a += this.buf[i + 3];
          }
        }
        const n = s * s, o = (y * this.w + x) * 4;
        out[o] = Math.round(r / n); out[o + 1] = Math.round(g / n);
        out[o + 2] = Math.round(b / n); out[o + 3] = Math.round(a / n);
      }
    }
    return encodePNG(this.w, this.h, out);
  }
}

/* ---------------- 配色 ---------------- */
const INK = [26, 28, 46];
const WHITE = [255, 255, 255];
const GREY_BG = [246, 247, 251];
const GREY_LINE = [228, 231, 240];
const GREY_BAR = [214, 219, 232];
const INDIGO = [99, 102, 241];

/* ---------------- 品牌图标 ---------------- */
function drawLogo(cv, size) {
  cv.gradient([99, 102, 241], [236, 72, 153], 45);
  const s = size;
  /* 山形 */
  cv.polygon([
    [s * 0.16, s * 0.70], [s * 0.36, s * 0.40], [s * 0.50, s * 0.58],
    [s * 0.64, s * 0.36], [s * 0.86, s * 0.72]
  ], [255, 255, 255, 0.94]);
  /* 太阳 */
  cv.circle(s * 0.31, s * 0.29, s * 0.075, [255, 255, 255, 0.9]);
}

/* ---------------- OG 主视觉（应用界面示意） ---------------- */
function drawOG() {
  const W = 1200, H = 630;
  const cv = new Canvas(W, H, 3);
  cv.gradient([79, 70, 229], [219, 39, 119], 35);

  /* 背景装饰 */
  cv.circle(150, 90, 190, [255, 255, 255, 0.07]);
  cv.circle(1080, 570, 230, [255, 255, 255, 0.06]);
  cv.roundRect(-40, 470, 420, 240, 60, [255, 255, 255, 0.05]);

  /* 应用窗口 */
  const wx = 120, wy = 92, ww = 960, wh = 446, wr = 22;
  /* 阴影 */
  for (let i = 10; i >= 1; i--) {
    cv.roundRect(wx - i * 2.2, wy - i * 1.4 + 14, ww + i * 4.4, wh + i * 2.8, wr + i * 2, [20, 16, 50, 0.028]);
  }
  cv.roundRect(wx, wy, ww, wh, wr, WHITE);

  /* 顶部工具条 */
  cv.roundRect(wx, wy, ww, 46, wr, [252, 252, 254]);
  cv.rect(wx, wy + 24, ww, 22, [252, 252, 254]);
  cv.rect(wx, wy + 45, ww, 1, GREY_LINE);
  ['#f87171', '#fbbf24', '#34d399'].forEach((c, i) => {
    const col = [[248, 113, 113], [251, 191, 36], [52, 211, 153]][i];
    cv.circle(wx + 26 + i * 20, wy + 23, 6, col);
  });
  cv.roundRect(wx + 110, wy + 12, 96, 22, 11, [238, 240, 248]);
  cv.roundRect(wx + 220, wy + 12, 70, 22, 11, [238, 240, 248]);
  cv.roundRect(wx + ww - 150, wy + 10, 130, 26, 13, INDIGO);

  /* 左侧面板 */
  const lpw = 196;
  cv.rect(wx + 1, wy + 46, lpw, wh - 47, GREY_BG);
  cv.rect(wx + lpw, wy + 46, 1, wh - 47, GREY_LINE);
  cv.roundRect(wx + 18, wy + 66, lpw - 36, 26, 8, [232, 234, 244]);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 2; c++) {
      cv.roundRect(wx + 18 + c * 84, wy + 106 + r * 32, 76, 26, 8, [226, 229, 240]);
    }
  }
  cv.roundRect(wx + 18, wy + 214, lpw - 36, 24, 8, [226, 229, 240]);
  cv.roundRect(wx + 18, wy + 248, lpw - 36, 24, 8, [226, 229, 240]);
  cv.roundRect(wx + 18, wy + 296, lpw - 36, 26, 8, INDIGO);

  /* 右侧面板 */
  const rpw = 190;
  cv.rect(wx + ww - rpw - 1, wy + 46, rpw, wh - 47, GREY_BG);
  cv.rect(wx + ww - rpw - 1, wy + 46, 1, wh - 47, GREY_LINE);
  for (let r = 0; r < 6; r++) {
    cv.roundRect(wx + ww - rpw + 18, wy + 66 + r * 34, rpw - 36, 24, 8, [226, 229, 240]);
  }

  /* 中间画布 */
  const cx0 = wx + lpw + 1, cy0 = wy + 46;
  const cw = ww - lpw - rpw - 2, ch = wh - 47;
  cv.rect(cx0, cy0, cw, ch, [233, 236, 245]);

  /* 画布内的拼贴 */
  const px = cx0 + 34, py = cy0 + 30, pw = cw - 68, ph = ch - 60;
  cv.roundRect(px, py, pw, ph, 10, WHITE);
  const tiles = [
    [0.00, 0.00, 0.46, 0.52, [99, 102, 241]],
    [0.50, 0.00, 0.50, 0.52, [236, 72, 153]],
    [0.00, 0.57, 0.30, 0.43, [16, 185, 129]],
    [0.33, 0.57, 0.30, 0.43, [245, 158, 11]],
    [0.66, 0.57, 0.34, 0.43, [14, 165, 233]]
  ];
  const gx = pw - 28, gy = ph - 26;
  tiles.forEach(t => {
    const x = px + 14 + t[0] * gx, y = py + 12 + t[1] * gy;
    const w = t[2] * gx, h = t[3] * gy;
    cv.roundRect(x, y, w, h, 8, t[4]);
    cv.roundRect(x, y, w, Math.min(h, 26), 8, [255, 255, 255, 0.14]);
  });
  /* 选中的元素框 + 控制点（用角标表示选中，避免遮挡内容） */
  const sx = px + 14 + 0.50 * gx, sy = py + 12 + 0.00 * gy;
  const sw = 0.50 * gx, sh = 0.52 * gy;
  const bx = sx - 3, by = sy - 3, bw = sw + 6, bh = sh + 6;
  const arm = Math.min(22, bw / 3, bh / 3), lw = 3;
  /* 四角 L 形角标 */
  [[bx, by, 1, 1], [bx + bw, by, -1, 1], [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1]]
    .forEach(([cx, cy, sxg, syg]) => {
      cv.rect(sxg > 0 ? cx : cx - arm, cy - (syg > 0 ? lw : 0), arm, lw, INDIGO);
      cv.rect(sxg > 0 ? cx : cx - lw, syg > 0 ? cy : cy - arm, lw, arm, INDIGO);
    });
  [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]].forEach(p => {
    cv.rect(p[0] - 4, p[1] - 4, 8, 8, WHITE);
    cv.roundRect(p[0] - 3.2, p[1] - 3.2, 6.4, 6.4, 1.4, INDIGO);
  });

  /* 底部文字条（示意标题） */
  cv.roundRect(px + 14, py + ph - 14 - 22, 150, 20, 6, [30, 32, 52, 0.85]);

  return cv.toPNG();
}

/* ---------------- 输出 ---------------- */
function write(name, buf) {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log('生成 ' + name + '  (' + (buf.length / 1024).toFixed(1) + ' KB)');
}

/* logo */
const logo512 = new Canvas(512, 512, 3);
drawLogo(logo512, 512);
write('logo-512.png', logo512.toPNG());

/* apple touch icon */
const apple = new Canvas(180, 180, 4);
drawLogo(apple, 180);
write('apple-touch-icon.png', apple.toPNG());

/* og 图 */
write('og-home.png', drawOG());

/* favicon（矢量） */
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'favicon.svg'),
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#ec4899"/>
  </linearGradient></defs>
  <rect x="1" y="1" width="30" height="30" rx="8" fill="url(#g)"/>
  <path d="M8 22.5l5-6 3.4 4 4.2-6 3.4 8z" fill="#fff" opacity=".93"/>
  <circle cx="11" cy="10.5" r="2.5" fill="#fff" opacity=".85"/>
</svg>
`, 'utf8');
console.log('生成 favicon.svg');

console.log('全部完成。');
