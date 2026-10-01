/*
 그리기. 규칙이 정한 값으로 검은 색면을 그린다.

 두 가지 방식이 있다.

   녹인 실루엣  실루엣을 흐리게 녹였다가 다시 굳혀 덩어리로 만든다. 몸의 생김새가 남는다
   특징 도형    실루엣은 버리고 rule.js 가 낸 숫자만으로 도형을 새로 짓는다. 몸은 숫자로만 남는다

 좌표는 카메라 화면(4:3)을 출력 화면 높이에 맞춰 가운데 놓은 공간이다.
 출력 화면이 세로로 길어도 가로로 넓어도 같은 자리에 그려진다.
*/

import { GW, GH } from "./sense.js";
import { MELT_W as MW, MELT_H as MH, MELT_EDGE, FORM_POINTS } from "./settings.js";

function boxBlur(src, dst, w, h, r) {
  if (r < 1) { dst.set(src); return; }
  const tmp = new Float32Array(w * h);
  const n = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += src[y * w + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = acc / n;
      acc += src[y * w + Math.min(w - 1, x + r + 1)] - src[y * w + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      dst[y * w + x] = acc / n;
      acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
}

function hex(c) {
  const v = parseInt(c.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export class Painter {
  constructor() {
    this.field = new Float32Array(GW * GH);
    this.blurA = new Float32Array(GW * GH);
    this.blurB = new Float32Array(GW * GH);
    this.small = document.createElement("canvas");
    this.small.width = GW; this.small.height = GH;
    this.sctx = this.small.getContext("2d");
    this.mid = document.createElement("canvas");
    this.mid.width = MW; this.mid.height = MH;
    this.mctx = this.mid.getContext("2d", { willReadFrequently: true });
    this.phase = [0, 1.3, 2.1, 0.7, 4.0];
  }

  /* 실루엣을 천천히 따라오게 쌓는다. lag 초가 길수록 굼뜨다. */
  follow(mask, k) {
    const f = this.field;
    for (let i = 0; i < f.length; i++) f[i] += (mask[i] - f[i]) * k;
  }

  draw(ctx, W, H, s, f, p, dt) {
    ctx.save();
    ctx.fillStyle = p.paper;
    ctx.fillRect(0, 0, W, H);
    if (p.mirror) { ctx.translate(W, 0); ctx.scale(-1, 1); }
    const camW = (H * 4) / 3;
    const ox = (W - camW) / 2;
    if (p.mode === "melt") this.melt(ctx, ox, camW, H, s, f, p);
    else this.form(ctx, ox, camW, H, s, p, dt);
    ctx.restore();
  }

  melt(ctx, ox, camW, H, s, f, p) {
    const r = Math.round(p.melt);
    boxBlur(this.field, this.blurA, GW, GH, r);
    boxBlur(this.blurA, this.blurB, GW, GH, r);
    const img = this.sctx.createImageData(GW, GH);
    for (let i = 0; i < this.blurB.length; i++) {
      const v = Math.min(255, this.blurB[i] * 255);
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    this.sctx.putImageData(img, 0, 0);
    this.mctx.imageSmoothingEnabled = true;
    this.mctx.imageSmoothingQuality = "high";
    this.mctx.drawImage(this.small, 0, 0, MW, MH);

    // 문턱보다 진한 곳만 잉크로 굳힌다. 문턱 앞뒤를 조금 남겨 가장자리를 부드럽게 한다.
    const out = this.mctx.getImageData(0, 0, MW, MH);
    const d = out.data;
    const [ir, ig, ib] = hex(p.ink);
    const lo = p.threshold - MELT_EDGE, hi = p.threshold + MELT_EDGE;
    for (let i = 0; i < d.length; i += 4) {
      const v = d[i] / 255;
      const a = v <= lo ? 0 : v >= hi ? 1 : (v - lo) / (hi - lo);
      d[i] = ir; d[i + 1] = ig; d[i + 2] = ib; d[i + 3] = a * 255;
    }
    this.mctx.putImageData(out, 0, 0);

    // 「자리 따라가기」를 낮추면 덩어리를 가운데로 끌어온다. 크기는 「크기 배율」.
    const dx = (s.x - f.cx) * camW;
    const dy = (s.y - f.cy) * H;
    const cx = ox + camW / 2, cy = H / 2;
    ctx.translate(cx + dx, cy + dy);
    ctx.scale(p.size, p.size);
    ctx.drawImage(this.mid, -camW / 2, -H / 2, camW, H);
  }

  form(ctx, ox, camW, H, s, p, dt) {
    const ph = this.phase;
    const rates = [0.7, 1.1, 1.6, 0.5, 0.9];
    for (let i = 0; i < ph.length; i++) ph[i] += dt * s.wobble * rates[i];

    const N = FORM_POINTS;
    const R = s.size * H * 0.25;
    const sx = 1 / Math.sqrt(s.stretch), sy = Math.sqrt(s.stretch);
    const cx = ox + s.x * camW, cy = s.y * H;
    const L = Math.max(2, s.lobes);
    const l0 = Math.floor(L), fr = L - l0;
    const pts = [];
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      const base = 1 + 0.12 * Math.sin(2 * t + ph[0]) + 0.08 * Math.sin(3 * t + ph[1]) + 0.05 * Math.sin(5 * t + ph[2]);
      // 혹의 개수가 3.4 처럼 사이에 있으면 3개와 4개를 섞어 갑자기 바뀌지 않게 한다
      const lob = (1 - fr) * Math.sin(l0 * t + ph[3]) + fr * Math.sin((l0 + 1) * t + ph[3]);
      const spike = s.spikes * 0.9 * Math.pow(Math.max(0, lob), 6);
      const r = R * (base + 0.14 * lob * (1 - s.spikes) + spike);
      pts.push([cx + Math.cos(t) * r * sx, cy + Math.sin(t) * r * sy]);
    }
    ctx.fillStyle = p.ink;
    ctx.beginPath();
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let m = mid(pts[N - 1], pts[0]);
    ctx.moveTo(m[0], m[1]);
    for (let i = 0; i < N; i++) {
      const a = pts[i], b = pts[(i + 1) % N];
      m = mid(a, b);
      ctx.quadraticCurveTo(a[0], a[1], m[0], m[1]);
    }
    ctx.closePath();
    ctx.fill();
  }
}
