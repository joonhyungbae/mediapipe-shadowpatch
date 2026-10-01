# AGENTS.md · 이 저장소에서 일하는 AI 에이전트에게

Cursor, Claude Code, Codex 등 어떤 도구로 들어왔든 이 파일을 먼저 읽습니다.
사람에게 설명하는 글은 [README.md](README.md) 에 있습니다.

## 이 저장소가 하는 일

카메라에 비친 사람의 실루엣을 검은 색면 하나로 바꿔 그리는 작품의 **출발점**입니다. 완성품이
아니라 작가가 고쳐 쓰라고 둔 예제이고, 쓰는 사람은 대개 코딩 경험이 적은 예술가입니다.
작가가 주로 고치는 곳은 `web/rule.js`(연결)와 `web/settings.js`(숫자) 두 파일입니다.

```
카메라·영상·가짜 사람 → sense.js → features.js → rule.js → shape.js → <canvas>
                         실루엣·관절    숫자 열 개    연결       그리기
                                         ↕
                                 app.js 조절판 (settings.js 의 PARAMS)
```

다른 예제와 달리 **브라우저에서 도는 예제**입니다. 빌드 단계가 없고, 브라우저가 `web/*.js` 를
ES 모듈로 바로 읽습니다. 파이썬은 `serve.py`(정적 서버)와 `fetch_model.py`(내려받기)에만 쓰고
표준 라이브러리만 씁니다. 그래도 **언제나 conda 환경(`shadowpatch`)으로 돌립니다.** `environment.yml` 에는
파이썬만 있고, `requirements.txt` 는 없습니다. conda 를 찾고 Miniforge 를 까는 일은 `scripts/conda.sh`
(윈도우 `scripts/conda.ps1`) 한 곳에 있고 install · start · pi-kiosk 가 불러 씁니다.

한 파일이 한 가지만 합니다. 자세한 규약은 오픈서킷 허브의 `docs/example-repo.md` 「코드 구성」.

## 먼저 돌려 보기

```bash
./start.sh --sim                     # 장비 없이 가짜 사람
./start.sh --offline 10              # 10초 동안의 색면을 out.mp4 로 (브라우저가 잠깐 열렸다 닫힌다)
./start.sh --video sample/팔벌려뛰기.webm   # 시험용 영상 (fetch_model.py --sample 로 받는다)
```

고친 뒤에는 최소한 이 둘이 통과해야 합니다.

1. `--sim` 으로 열어 브라우저 콘솔에 빨간 오류가 없고, 「그리는 방식」 두 가지가 다 그려진다.
2. `--video sample/팔벌려뛰기.webm` 에서 「감지한 것」이 붉게 칠해지고 숫자 막대가 움직인다.

헤드리스로 확인할 때는 `window.shadowpatch` 에 `p`(조절판 값), `state`(색면 값),
`features`(뽑은 숫자)가 걸려 있습니다.

## 파일과 책임

| 파일 | 책임 | 주의 |
|---|---|---|
| `web/settings.js` | **숫자의 유일한 출처**. 조절판 항목(`PARAMS`)도 여기 | 다른 파일에 숫자를 하드코딩하지 않는다 |
| `serve.py` | 인자 해석, 정적 서버, `--offline` 녹화 받기 | 로직을 쌓지 않는다. `Cache-Control: no-store` 를 지운다면 작가가 고친 것이 안 보인다 |
| `web/sense.js` | 바깥 세계를 사건으로 바꾼다. 매 프레임 `{mask, poses, image}` | 이 꼴을 바꾸지 않는다. 열화상 센서 같은 다른 입력도 같은 꼴이면 나머지는 그대로 돈다 |
| `web/features.js` | 실루엣에서 숫자 뽑기 | 새 숫자는 0~1 근처로 맞추고, 맨 위 주석과 `app.js` 의 `FEATURES` 에 같이 더한다 |
| `web/rule.js` | 무엇을 할지 고른다. 숫자 → 색면 값 | 작가의 자리다. 한 줄에 한 연결로 짧게 둔다. 사람이 없을 때의 쉬는 모양을 늘 돌려준다 |
| `web/shape.js` | 내보낸다(그리기 두 방식) | `rule.js` 가 내는 값(size, x, y, stretch, spikes, wobble, lobes)만 읽는다. 프레임마다 도는 곳이라 할당을 늘리지 않는다 |
| `web/app.js` | 한 프레임에 벌어지는 일, 조절판, 녹화 | 짧게 유지한다 |
| `web/vendor/mediapipe/` | MediaPipe Tasks Vision 1.0.1 (bundle + SIMD wasm) | 수정하지 않는다. 판을 올리면 NOTICE 도 고친다 |
| `fetch_model.py` | 모델과 시험용 영상 받기 | 받은 것은 커밋하지 않는다 |
| `environment.yml`, `scripts/conda.sh`·`.ps1` | conda 환경과 conda 찾기·깔기 | 환경 이름은 `shadowpatch` 한 곳에서만 정한다 |
| `scripts/pi-*.sh` | 라즈베리파이 자동 시작 | 실제 파이에서 아직 시험하지 않았다. 고칠 때 `docs/raspberrypi.md` 도 같이 |
| `.github/workflows/pages.yml` | 설치 없이 보는 주소 | 모델을 올리기 직전에 받아 함께 올린다 |

## 깨뜨리면 안 되는 것

1. **인터넷 없이 떠야 한다.** CDN·외부 폰트·외부 스크립트를 넣지 않는다. 라이브러리는
   `web/vendor/` 에, 모델은 설치가 받아 `web/models/` 에 둔다.
2. **없어도 돌아가야 한다.** 카메라가 안 열리거나 모델이 없으면 가짜 사람으로 넘어간다.
   사람이 없으면 `rule.js` 의 쉬는 모양을 그린다.
3. **숫자는 `settings.js` 에.**
4. **주석과 문서는 한국어.** 긴 대시 대신 쉼표와 마침표.
5. **큰 자료는 벤더링하지 않는다.** 모델과 영상은 설치가 받아 온다.
6. **카메라 원본을 저장하거나 밖으로 보내지 않는다.** 녹화는 색면 화면만 한다.
7. **conda 환경 하나로 돈다.** 시스템 파이썬이나 venv 로 켜는 길을 만들지 않는다. npm, 번들러,
   프레임워크를 들이지 않는다. 파이썬 패키지가 꼭 필요하면 `environment.yml` 에 더한다.
8. **라이선스.** 소스 공개다. 오픈소스라고 부르지 않는다.

## 자주 하는 작업

- **색면이 반응하는 방식을 바꾼다** → `rule.js` 의 연결 한 줄. 세기는 `settings.js` 의 `PARAMS`.
- **새 숫자가 필요하다**(머리 기울기, 두 사람 사이 거리) → `features.js` 에서 뽑고 `rule.js` 에서
  꺼내 쓴다. 관절 번호는 MediaPipe Pose 의 33개(0 코, 11·12 어깨, 15·16 손목, 23·24 엉덩이, 27·28 발목).
- **조절판에 슬라이더를 더한다** → `settings.js` 의 `PARAMS` 에 한 줄. 화면은 저절로 생긴다.
- **입력 장치를 바꾼다** → `sense.js` 에 같은 꼴을 내는 클래스를 더하고 `app.js` 의 `useSource` 에 잇는다.

## 함정

- **MediaPipe 는 사용 기록을 구글로 보낸다**(`odml.pa.googleapis.com/v1/log`, 60초마다). `web/sense.js` 위쪽에서 그 주소로
  가는 fetch 만 막는다. 이 막음을 지우면 「인터넷 없이, 밖으로 보내지 않는다」가 깨진다.

- **GPU 위임을 기본으로 쓰지 않는다.** 헤드리스 크롬에서 관절은 잡히는데 분리 마스크가 전부 0 으로
  나왔다. 기본은 CPU, 주소의 `?gpu` 로만 켠다.
- MediaPipe 의 마스크는 `detectForVideo` 콜백 안에서만 유효하다. 콜백 형태를 유지한다.
- `vendor/`·`models/` 는 `index.html` 기준 경로다. `web/sense.js` 안에서 `./vendor` 로 부르면 모듈 기준으로
  풀린다. `new URL(..., document.baseURI)` 를 쓴다.
- 조절판 값은 `localStorage` 에 남는다. `settings.js` 의 처음 값이 바뀌면 남은 값을 버린다
  (`app.js` 의 `STORE`). 이것을 지우면 작가가 settings.js 를 고쳐도 화면이 안 바뀐다.
- `python3 -m http.server` 로 띄우면 브라우저가 옛 모듈을 들고 있을 수 있다. `serve.py` 를 쓴다.
- conda 는 터미널 설정(`conda init`)을 읽지 않는 자리에서도 찾아야 한다. curl | bash 설치, 더블클릭,
  라즈베리파이 자동 시작이 그렇다. `scripts/conda.sh` 의 `find_conda` 가 흔한 설치 위치를 차례로 본다.
  `conda activate` 대신 `conda run --no-capture-output -n shadowpatch` 를 쓴다.
- Miniforge 설치 파일은 이름이 `.sh` 로 끝나지 않으면 「bash 로 실행하라」며 멈춘다.
- 카메라는 `localhost`·`127.0.0.1` 이거나 https 일 때만 열린다. `--host 0.0.0.0` 으로 다른 기기에서
  열면 카메라 없이(가짜 사람이나 영상) 돈다.

## 작업을 마칠 때

사람에게 보이는 변화면 README 도 함께 고칩니다. 커밋 메시지는 한국어로 한 줄입니다.
새로 찾은 함정이 다른 예제에도 해당하면 오픈서킷 허브의 `docs/example-repo.md` 와 틀에도 적습니다.
