/*
 규칙. 실루엣의 무엇이 색면의 무엇을 바꾸는가.

 이 파일이 작품의 규칙이다. 코드의 다른 곳은 재료를 나르고 그릴 뿐이다.
 아래 연결은 출발점으로 정해 둔 예시다. 줄을 바꾸고, 지우고, 새로 이어 보면서
 관객이 「내가 움직여서 바뀌었다」고 알아차리는 연결을 찾는 것이 할 일이다.

 들어오는 것  f  features.js 의 숫자들 (present, area, cx, cy, width, height, reach, lift, motion, people)
             p  화면 오른쪽 조절판의 값들 (대시보드에서 바꾼다)
 나가는 것       색면 하나를 정하는 값들. shape.js 가 이것으로 그린다

   size     색면 크기. 1 이면 화면 높이의 절반쯤
   x, y     색면 중심 자리 (0~1)
   stretch  1 보다 크면 세로로 길고, 작으면 가로로 넓다
   spikes   가장자리가 뾰족한 정도 (0 매끈 ~ 1 날카로움)
   wobble   가장자리가 일렁이는 속도
   lobes    가장자리 혹의 개수 (정수로 반올림된다)
*/

export function rule(f, p) {
  // 사람이 없을 때: 작게, 가운데에, 천천히 숨 쉬듯.
  if (!f.present) {
    return { size: p.rest, x: 0.5, y: 0.5, stretch: 1, spikes: 0, wobble: 0.15, lobes: 3 };
  }

  return {
    // 몸이 화면을 많이 차지할수록(가까이 올수록) 색면이 커진다
    size: p.size * (0.35 + Math.sqrt(f.area) * 2.2),

    // 몸이 있는 쪽으로 따라간다. 「자리 따라가기」가 0 이면 가운데 고정
    x: 0.5 + (f.cx - 0.5) * p.follow,
    y: 0.5 + (f.cy - 0.5) * p.follow,

    // 서 있으면 세로로, 팔을 벌리면 가로로 눕는다
    stretch: Math.max(0.4, Math.min(2.5, (0.4 + f.height) / (0.2 + f.width))),

    // 팔을 벌릴수록 가장자리가 뾰족해진다
    spikes: Math.min(1, f.reach * p.spikes),

    // 많이 움직일수록 빨리 일렁인다
    wobble: 0.15 + f.motion * p.wobble * 4,

    // 손을 들수록 혹이 많아진다. 사람이 늘어도 많아진다
    lobes: 3 + f.lift * 4 + (f.people - 1) * 2,
  };
}
