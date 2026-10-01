/*
 특징. 실루엣을 숫자 몇 개로 줄인다.

 색면이 실루엣의 무엇에 반응할지는 rule.js 가 정한다. 여기서는 재료만 만든다.
 값은 모두 대략 0~1 이 되게 맞춰 두었다. 새 숫자가 필요하면 여기에 더하고
 rule.js 에서 꺼내 쓰면 된다.

   present  사람이 있다 (0 또는 1)
   people   잡힌 사람 수
   area     화면에서 몸이 차지하는 넓이
   cx, cy   몸의 무게중심 자리
   width    몸이 좌우로 퍼진 정도
   height   몸이 위아래로 퍼진 정도
   reach    팔을 벌린 정도 (관절이 잡혔을 때만, 아니면 width 로 대신)
   lift     손을 어깨 위로 든 정도
   motion   직전 프레임과 실루엣이 달라진 양
*/

import { GW, GH } from "./sense.js";
import { PRESENT_AREA, MOTION_GAIN } from "./settings.js";

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export class Features {
  constructor() {
    this.prev = new Float32Array(GW * GH);
  }

  read({ mask, poses }) {
    let sum = 0, sx = 0, sy = 0, sxx = 0, syy = 0, diff = 0;
    for (let y = 0; y < GH; y++) {
      for (let x = 0; x < GW; x++) {
        const i = y * GW + x;
        const m = mask[i];
        diff += Math.abs(m - this.prev[i]);
        if (m < 0.5) continue;
        sum += 1;
        sx += x; sy += y;
        sxx += x * x; syy += y * y;
      }
    }
    this.prev.set(mask);

    const area = sum / (GW * GH);
    const present = area > PRESENT_AREA ? 1 : 0;
    const cx = sum ? sx / sum / GW : 0.5;
    const cy = sum ? sy / sum / GH : 0.5;
    // 퍼진 정도는 표준편차로 잰다. 막대처럼 서 있으면 0.1 안팎, 팔을 벌리면 커진다.
    const width = sum ? clamp((Math.sqrt(Math.max(0, sxx / sum - (sx / sum) ** 2)) / GW) * 4) : 0;
    const height = sum ? clamp((Math.sqrt(Math.max(0, syy / sum - (sy / sum) ** 2)) / GH) * 3) : 0;
    const motion = clamp((diff / (GW * GH)) * MOTION_GAIN);

    let reach = width, lift = 0, n = 0;
    for (const p of poses) {
      const L = p[15], R = p[16], LS = p[11], RS = p[12];
      if (!L || !R || !LS || !RS) continue;
      const shoulder = Math.hypot(LS.x - RS.x, LS.y - RS.y) || 0.05;
      const span = Math.hypot(L.x - R.x, L.y - R.y);
      // 손목 사이가 어깨너비의 1배면 팔을 내린 것, 4배 가까우면 활짝 벌린 것
      const r = clamp((span / shoulder - 1) / 3);
      const shoulderY = (LS.y + RS.y) / 2;
      const l = clamp((shoulderY - Math.min(L.y, R.y)) / (shoulder * 2) + 0.5);
      if (n === 0) { reach = r; lift = l; }
      else { reach = Math.max(reach, r); lift = Math.max(lift, l); }
      n++;
    }

    return { present, people: Math.max(poses.length, present), area, cx, cy, width, height, reach, lift, motion };
  }
}
