/*
 시작하는 자리. 감지 → 특징 → 규칙 → 그리기 를 한 프레임마다 잇는다.

 주소 뒤에 붙여 쓰는 것
   ?sim          카메라 없이 가짜 사람으로 시작
   ?sim&people=2 가짜 사람 둘
   ?display      조절판 없이 색면만 (전시용 화면)
   ?cam=USB      이름에 USB 가 든 카메라로 연다
   ?video=sample/팔벌려뛰기.webm   카메라 대신 영상 파일로 시작
   ?in=256       사람을 찾는 그림 크기(기본 320). 느린 기계에서 줄인다
   ?gpu          GPU 로 감지한다 (기본은 CPU)
   ?offline=10   10초를 녹화해 서버에 보내고 끝낸다 (./start.sh --offline 10 이 쓴다)
*/

import { CameraSense, SimSense } from "./sense.js";
import { Features } from "./features.js";
import { rule } from "./rule.js";
import { Painter } from "./shape.js";
import { PARAMS } from "./settings.js";

const $ = (id) => document.getElementById(id);
const url = new URLSearchParams(location.search);

const FEATURES = [
  ["present", "사람 있음"], ["people", "사람 수"], ["area", "넓이"], ["cx", "좌우 자리"], ["cy", "위아래 자리"],
  ["width", "좌우로 퍼짐"], ["height", "위아래로 퍼짐"], ["reach", "팔 벌림"], ["lift", "손 듦"], ["motion", "움직임"],
];
const SHAPE_KEYS = ["size", "x", "y", "stretch", "spikes", "wobble", "lobes"];

// 조절판에서 바꾼 값은 이 브라우저에 남긴다. settings.js 의 처음 값이 바뀌었으면 남은 값을 버린다.
const STORE = "shadowpatch.params.v2";
const DEFAULTS = Object.fromEntries(PARAMS.map((d) => [d.key, d.value]));
const p = { ...DEFAULTS };
try {
  const saved = JSON.parse(localStorage.getItem(STORE) || "null");
  if (saved && JSON.stringify(saved.defaults) === JSON.stringify(DEFAULTS)) Object.assign(p, saved.values);
} catch {}
const save = () => {
  try { localStorage.setItem(STORE, JSON.stringify({ defaults: DEFAULTS, values: p })); } catch {}
};

/* ---------- 조절판 만들기 ---------- */

function buildPanel() {
  const box = $("params");
  box.innerHTML = "";
  for (const d of PARAMS) {
    const row = document.createElement("label");
    row.className = "param";
    if (d.only) row.dataset.only = d.only;
    let input;
    if (d.type === "select") {
      input = document.createElement("select");
      for (const [v, t] of d.options) input.add(new Option(t, v));
      input.value = p[d.key];
    } else if (d.type === "check") {
      input = document.createElement("input");
      input.type = "checkbox";
      input.checked = !!p[d.key];
    } else if (d.type === "color") {
      input = document.createElement("input");
      input.type = "color";
      input.value = p[d.key];
    } else {
      input = document.createElement("input");
      input.type = "range";
      Object.assign(input, { min: d.min, max: d.max, step: d.step });
      input.value = p[d.key];
    }
    const out = document.createElement("output");
    const show = () => (out.textContent = d.type ? "" : Number(p[d.key]).toFixed(d.step < 1 ? 2 : 0));
    input.addEventListener("input", () => {
      p[d.key] = d.type === "check" ? input.checked : d.type ? input.value : Number(input.value);
      show();
      save();
      applyLayout();
    });
    show();
    row.append(Object.assign(document.createElement("span"), { textContent: d.label }), input, out);
    box.append(row);
  }
  applyLayout();
}

function applyLayout() {
  document.querySelectorAll("[data-only]").forEach((el) => (el.hidden = el.dataset.only !== p.mode));
}

function buildMeters() {
  $("features").innerHTML = FEATURES.map(
    ([k, t]) => `<div class="meter"><span>${t}</span><i><b id="f-${k}"></b></i><output id="fv-${k}"></output></div>`
  ).join("");
  $("shape").innerHTML = SHAPE_KEYS.map((k) => `<span>${k} <b id="s-${k}">0</b></span>`).join("");
}

/* ---------- 감지 고르기 ---------- */

let sense = null;
const video = $("video");

async function useSource(kind, file) {
  sense?.stop();
  sense = null;
  $("status").textContent = "여는 중";
  try {
    if (kind === "sim") sense = new SimSense({ people: 1 });
    else if (kind === "sim2") sense = new SimSense({ people: 2 });
    else {
      sense = new CameraSense(video, {
        file,
        deviceId: kind.startsWith("cam:") ? kind.slice(4) : null,
        camLabel: kind === "camera" ? url.get("cam") : null,
        say: (t) => ($("status").textContent = t),
      });
    }
    await sense.start();
    $("status").textContent = `${sense.source} · ${sense.note}`;
    if (sense instanceof CameraSense && !file) listCameras();
  } catch (e) {
    $("status").textContent = `열지 못했습니다: ${e.message || e}. 「가짜 사람」으로 바꿔 색면부터 볼 수 있습니다`;
    sense = new SimSense({ people: 1 });
  }
}

async function listCameras() {
  const sel = $("source");
  const devices = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput");
  sel.querySelectorAll("option[data-cam]").forEach((o) => o.remove());
  devices.forEach((d, i) => {
    const o = new Option(`카메라: ${d.label || i + 1}`, `cam:${d.deviceId}`);
    o.dataset.cam = "1";
    sel.add(o, sel.options[1]);
  });
}

$("source").addEventListener("change", (e) => {
  const v = e.target.value;
  if (v === "file") $("file").click();
  else useSource(v);
});
$("file").addEventListener("change", (e) => {
  if (e.target.files[0]) useSource("file", e.target.files[0]);
});

/* ---------- 기록 ---------- */

let recorder = null;
function stamp() {
  const d = new Date();
  const z = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}`;
}
function download(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
function toggleRecord() {
  if (recorder) { recorder.stop(); return; }
  const type = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find((t) =>
    window.MediaRecorder?.isTypeSupported?.(t)
  );
  if (!type) { $("status").textContent = "이 브라우저는 화면 녹화를 지원하지 않습니다"; return; }
  const chunks = [];
  recorder = new MediaRecorder($("out").captureStream(30), { mimeType: type });
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  recorder.onstop = () => {
    download(new Blob(chunks, { type }), `shadowpatch-${stamp()}.${type.includes("mp4") ? "mp4" : "webm"}`);
    recorder = null;
    $("rec").textContent = "녹화 시작";
    $("rec").classList.remove("on");
  };
  recorder.start(1000);
  $("rec").textContent = "녹화 멈추고 저장";
  $("rec").classList.add("on");
}
function snapshot() {
  $("out").toBlob((b) => download(b, `shadowpatch-${stamp()}.png`));
}
$("rec").addEventListener("click", toggleRecord);
$("snap").addEventListener("click", snapshot);
$("only").addEventListener("click", () => document.body.classList.toggle("display"));

/* 전시 중에 화면이 저절로 꺼지면 안 된다. 되는 브라우저에서만 막는다. */
let wake = null;
async function keepAwake() {
  try {
    if (!wake && navigator.wakeLock) {
      wake = await navigator.wakeLock.request("screen");
      wake.addEventListener("release", () => (wake = null));
    }
  } catch {}
}
addEventListener("pointerdown", keepAwake);
document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && keepAwake());
$("reset").addEventListener("click", () => {
  for (const d of PARAMS) p[d.key] = d.value;
  save();
  buildPanel();
});
addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
  const k = e.key.toLowerCase();
  if (k === "h") document.body.classList.toggle("display");
  if (k === "f") document.fullscreenElement ? document.exitFullscreen() : $("stage").requestFullscreen?.();
  if (k === "r") toggleRecord();
  if (k === "s") snapshot();
});

/* ---------- 한 프레임 ---------- */

const features = new Features();
const painter = new Painter();
const out = $("out");
const octx = out.getContext("2d");
const prev = $("preview");
const pctx = prev.getContext("2d");
let state = null;
let smooth = null;
let last = performance.now();

function drawPreview(frame) {
  const W = prev.width, H = prev.height;
  pctx.save();
  if (p.mirror) { pctx.translate(W, 0); pctx.scale(-1, 1); }
  pctx.globalAlpha = 0.55;
  pctx.drawImage(frame.image, 0, 0, W, H);
  pctx.globalAlpha = 1;
  // 몸이라고 본 곳을 붉게 덮는다
  const img = pctx.getImageData(0, 0, W, H);
  const gw = 128, gh = 96;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const sx = p.mirror ? W - 1 - x : x;
      const m = frame.mask[Math.floor((y * gh) / H) * gw + Math.floor((sx * gw) / W)];
      if (m > 0.5) {
        const i = (y * W + x) * 4;
        img.data[i] = img.data[i] * 0.4 + 230 * 0.6;
        img.data[i + 1] *= 0.5;
        img.data[i + 2] *= 0.5;
      }
    }
  }
  pctx.putImageData(img, 0, 0);
  pctx.fillStyle = "#fff";
  for (const pts of frame.poses) {
    for (const i of [0, 11, 12, 13, 14, 15, 16, 23, 24, 27, 28]) {
      const q = pts[i];
      if (!q || q.v < 0.4) continue;
      pctx.beginPath();
      pctx.arc(q.x * W, q.y * H, 3, 0, Math.PI * 2);
      pctx.fill();
    }
  }
  pctx.restore();
}

function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const k = 1 - Math.exp(-dt / Math.max(0.01, p.lag));

  if (sense) {
    const frame = sense.read(now);
    const f = features.read(frame);
    smooth = smooth || { ...f };
    for (const key in f) smooth[key] += (f[key] - smooth[key]) * k;
    smooth.present = f.present;

    const target = rule(smooth, p);
    state = state || { ...target };
    for (const key in target) state[key] += (target[key] - state[key]) * k;

    painter.follow(frame.mask, k);

    // 출력 캔버스를 고른 비율로 자리에 꽉 맞춘다
    const box = $("stage").getBoundingClientRect();
    const [aw, ah] = String(p.aspect).split("/").map(Number);
    const ar = aw / ah;
    const cw = Math.min(box.width, box.height * ar);
    out.style.width = `${Math.floor(cw)}px`;
    out.style.height = `${Math.floor(cw / ar)}px`;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = Math.round(out.clientWidth * dpr), H = Math.round(out.clientHeight * dpr);
    if (out.width !== W || out.height !== H) { out.width = W; out.height = H; }
    painter.draw(octx, W, H, state, smooth, p, dt);

    if (!document.body.classList.contains("display")) {
      drawPreview(frame);
      for (const [key] of FEATURES) {
        const v = f[key];
        $(`f-${key}`).style.width = `${Math.min(1, key === "people" ? v / 3 : v) * 100}%`;
        $(`fv-${key}`).textContent = key === "people" ? v : v.toFixed(2);
      }
      for (const key of SHAPE_KEYS) $(`s-${key}`).textContent = state[key].toFixed(2);
      $("fps").textContent = `${Math.round(sense.fps)} fps`;
    }
  }
  requestAnimationFrame(loop);
}

/* ---------- 시작 ---------- */

buildPanel();
buildMeters();
if (url.has("display")) document.body.classList.add("display");
const people = Number(url.get("people") || 1);
if (url.get("video")) {
  $("source").value = "file";
  useSource("file", url.get("video"));
} else {
  const start = url.has("sim") ? (people > 1 ? "sim2" : "sim") : "camera";
  $("source").value = start;
  useSource(start);
}
requestAnimationFrame(loop);
/* ./start.sh --offline N. 장비 없이 N초 동안의 색면을 녹화해 serve.py 에 보낸다. 검증용. */
const offline = Number(url.get("offline") || 0);
if (offline > 0) {
  setTimeout(() => {
    const type = ["video/mp4;codecs=avc1", "video/mp4", "video/webm"].find((t) => window.MediaRecorder?.isTypeSupported?.(t));
    if (!type) { $("status").textContent = "이 브라우저는 녹화를 지원하지 않습니다"; return; }
    const chunks = [];
    const rec = new MediaRecorder($("out").captureStream(30), { mimeType: type });
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = async () => {
      const ext = type.includes("mp4") ? "mp4" : "webm";
      try {
        await fetch(`/save?ext=${ext}`, { method: "POST", body: new Blob(chunks, { type }) });
        $("status").textContent = `out.${ext} 로 적었습니다. 이 창은 닫아도 됩니다`;
      } catch {
        download(new Blob(chunks, { type }), `out.${ext}`);
      }
    };
    $("status").textContent = `${offline}초 녹화 중`;
    rec.start(1000);
    setTimeout(() => rec.stop(), offline * 1000);
  }, 1500);
}

window.shadowpatch = { p, get state() { return state; }, get features() { return smooth; } };
