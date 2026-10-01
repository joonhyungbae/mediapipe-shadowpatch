/*
 만지는 숫자는 전부 여기 있다.

 코드를 읽기 전에 이 파일만 봐도 작품이 무엇으로 이루어져 있는지 보인다.
 화면 오른쪽 조절판(PARAMS)의 값은 여기 적힌 것이 처음 값이다. 조절판에서 바꾼 값은
 그 브라우저에 남아 새로 고침해도 그대로다. 이 파일의 처음 값을 고치면 남아 있던 값은
 버리고 고친 값으로 다시 시작한다.

 실루엣의 무엇이 색면의 무엇을 바꾸는지(작품의 규칙)는 숫자가 아니라 연결이라서
 rule.js 에 따로 있다.
*/

// ─── 조절판 ──────────────────────────────────────────────────────────────
// key 는 코드에서 부르는 이름, label 은 화면에 보이는 이름, value 가 처음 값이다.
export const PARAMS = [
  // 「특징 도형」은 숫자만으로 도형을 새로 짓고, 「녹인 실루엣」은 몸의 생김새를 녹여 남긴다
  { key: "mode", label: "그리는 방식", type: "select", options: [["form", "특징 도형"], ["melt", "녹인 실루엣"]], value: "form" },
  // 색면이 몸의 변화를 따라오는 데 걸리는 시간. 짧으면 바로바로, 길면 굼뜨게 뒤따른다
  { key: "lag", label: "따라오는 시간(초)", min: 0.05, max: 3, step: 0.05, value: 0.6 },
  // 색면 전체 크기에 곱하는 값
  { key: "size", label: "크기 배율", min: 0.3, max: 3, step: 0.05, value: 1 },
  // 0 이면 색면이 늘 가운데, 1 이면 몸이 있는 자리로 따라간다
  { key: "follow", label: "자리 따라가기", min: 0, max: 1, step: 0.05, value: 0.3 },
  // 팔을 벌렸을 때 가장자리가 얼마나 뾰족해지는지
  { key: "spikes", label: "뾰족함 세기", min: 0, max: 2, step: 0.05, value: 1 },
  // 움직임이 가장자리를 얼마나 빨리 일렁이게 하는지
  { key: "wobble", label: "일렁임 세기", min: 0, max: 3, step: 0.05, value: 1 },
  // 아무도 없을 때 남는 색면의 크기. 0 이면 사라진다 (특징 도형만)
  { key: "rest", label: "아무도 없을 때 크기", min: 0, max: 1.5, step: 0.05, value: 0.35 },
  // 녹인 실루엣: 몸을 얼마나 뭉갤지. 클수록 팔다리가 사라지고 덩어리가 된다
  { key: "melt", label: "녹이는 정도", min: 0, max: 12, step: 1, value: 5, only: "melt" },
  // 녹인 실루엣: 어디까지를 색면으로 굳힐지. 낮으면 두툼하고 높으면 홀쭉하다
  { key: "threshold", label: "굳히는 문턱", min: 0.05, max: 0.9, step: 0.01, value: 0.35, only: "melt" },
  // 노트북 카메라로 자기를 볼 때는 켜고, 바깥을 향한 카메라로 남을 찍을 때는 끈다
  { key: "mirror", label: "거울처럼 뒤집기", type: "check", value: true },
  { key: "ink", label: "색면", type: "color", value: "#111111" },
  { key: "paper", label: "바탕", type: "color", value: "#ecebe6" },
  // 색면을 띄울 화면의 비율에 맞춘다
  { key: "aspect", label: "화면 비율", type: "select", options: [["4/3", "4:3"], ["3/4", "3:4 세로"], ["1/1", "1:1"], ["16/9", "16:9"], ["9/16", "9:16 세로"]], value: "4/3" },
];

// ─── 감지 (sense.js) ─────────────────────────────────────────────────────
export const MAX_PEOPLE = 2;            // 동시에 몇 사람까지 찾을지. 늘리면 느려진다
export const INPUT_WIDTH = 320;         // 사람을 찾는 그림의 너비. 주소에 ?in=256 으로 바꿀 수 있다
export const GRID_W = 128;              // 실루엣을 다루는 격자. 숫자를 뽑고 녹이는 데 쓴다
export const GRID_H = 96;

// ─── 숫자 뽑기 (features.js) ─────────────────────────────────────────────
export const PRESENT_AREA = 0.004;      // 화면의 이만큼 이상이 몸이면 「사람이 있다」로 본다
export const MOTION_GAIN = 12;          // 움직임 숫자를 0~1 로 맞추는 배율. 늘 0 근처면 키운다

// ─── 그리기 (shape.js) ───────────────────────────────────────────────────
export const MELT_W = 640;              // 녹인 실루엣을 굳히는 중간 크기. 키우면 가장자리가 고와지고 느려진다
export const MELT_H = 480;
export const MELT_EDGE = 0.006;         // 굳힐 때 가장자리를 부드럽게 남기는 폭
export const FORM_POINTS = 180;         // 특징 도형의 가장자리를 몇 점으로 그릴지
