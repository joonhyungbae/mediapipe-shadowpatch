# mediapipe-shadowpatch

**카메라 앞에 사람이 서면 검은 색면 하나가 생깁니다.** 다가오면 커지고, 팔을 벌리면 가장자리가
뾰족해지고, 움직이면 일렁입니다. 사람이 떠나면 작게 줄어들어 숨만 쉽니다.

웹캠 한 대와 노트북, 브라우저로 돕니다. [MediaPipe](https://ai.google.dev/edge/mediapipe) 가 몸의
윤곽과 관절을 찾고, 나머지는 브라우저가 그립니다. 같은 페이지를 폰이나 라즈베리파이에 올려 작은
화면에 띄울 수도 있습니다. 완성된 작품이 아니라 출발점이고, 바꿔 가며 자기 작품으로 만들라고 둔
예제입니다. 설치 없이 보려면 <https://joonhyungbae.github.io/mediapipe-shadowpatch/> 를 크롬으로 엽니다.

《2026 오픈서킷 부산: 아트앤테크 프랙티스》 멘토링 과정에서 만든 예제입니다. 참여 작가와
작업을 구상하다 공통으로 쓸 만한 뼈대가 나와, 참여자 누구나 쓸 수 있도록 공개합니다.

## 1. 깔기

터미널을 엽니다. 윈도우는 시작 메뉴에서 `PowerShell`, 맥은 `터미널`입니다.

**맥 · 리눅스**

```bash
curl -fsSL https://raw.githubusercontent.com/joonhyungbae/mediapipe-shadowpatch/main/install.sh | bash
```

**윈도우 (PowerShell)**

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
irm https://raw.githubusercontent.com/joonhyungbae/mediapipe-shadowpatch/main/install.ps1 -OutFile "$env:TEMP\install.ps1"
& "$env:TEMP\install.ps1"
```

설치가 챙기는 것: conda 환경(`shadowpatch`), 사람을 찾는 모델(약 6MB), 카메라 대신 써 볼 시험용 영상.
conda 가 없으면 [Miniforge](https://conda-forge.org/download/)를 사용자 폴더(`~/miniforge3`)에 먼저 깝니다.
관리자 권한이 필요 없고 터미널 설정 파일은 건드리지 않습니다. 이미 conda(Anaconda, Miniconda)가 있으면 그것을 씁니다.

## 2. 켜기

```bash
./start.sh          # 맥 · 리눅스
.\start.ps1         # 윈도우
```

맥에서는 폴더의 `start.command` 를 더블클릭해도 됩니다. 처음에 「확인되지 않은 개발자」라고
막히면 오른쪽 클릭 → **열기** 입니다.

브라우저가 저절로 열립니다. 안 열리면 `127.0.0.1:7000` 을 칩니다. 카메라 권한을 묻으면 **허용**
합니다. 끌 때는 <kbd>Ctrl</kbd>+<kbd>C</kbd>.

이 한 줄이 conda 환경을 찾아 그 안에서 켜고, 모델이 없으면 받아 오고, 받지 못하면 가짜 사람으로 켭니다.
`conda activate` 를 따로 칠 필요는 없습니다. 7000 번이 쓰이고 있으면
다음 빈 번호를 찾습니다.

| 명령 | 하는 일 |
|---|---|
| `./start.sh --sim` | 카메라 없이 가짜 사람(막대 인형)으로 |
| `./start.sh --video sample/팔벌려뛰기.webm` | 카메라 대신 시험용 영상으로 |
| `./start.sh --offline 10` | 장비 없이 10초 동안의 색면을 `out.mp4` 로 적는다 |
| `./start.sh --host 0.0.0.0` | 폰이나 다른 컴퓨터에서 본다 (카메라는 켠 컴퓨터에서만 열린다) |
| `./start.sh --port 7001` | 포트를 바꾼다 |
| `./start.sh --display` | 조절판 없이 색면만. 전시용 화면 |

## 3. 화면에서 보는 것

- **왼쪽 큰 화면**: 색면. 전시에서 보일 그림입니다.
- **무엇을 보나**: 노트북 카메라, 꽂은 USB 카메라, 가짜 사람, 영상 파일 중에서 고릅니다.
- **감지한 것**: 카메라 그림 위에 몸으로 본 곳이 붉게 칠해지고, 관절이 흰 점으로 찍힙니다.
- **뽑은 숫자**: 실루엣에서 나온 숫자 열 개(넓이, 자리, 팔 벌림, 움직임 등)와 색면에 들어간 값입니다.
- **조절**: 슬라이더를 움직이면 색면이 바로 달라집니다.
- **녹화 · 사진 저장**: 색면 화면을 mp4 와 png 로 내려받습니다.
- **색면만 보기**: 조절판을 숨기고 색면만 채웁니다. <kbd>H</kbd> 로도 됩니다. <kbd>F</kbd> 는 전체 화면입니다.

## 4. 바꾸는 자리

1. **`web/settings.js`** 숫자가 전부 이 파일에 있습니다. 조절판의 처음 값도 여기서 정합니다.
   줄마다 무엇을 바꾸는 값인지 적어 두었습니다. 고치고 저장한 뒤 브라우저를 새로 고침합니다.
2. **조절판 슬라이더** 「그리는 방식」을 **특징 도형** 과 **녹인 실루엣** 으로 바꿔 봅니다. 특징 도형은
   몸을 숫자로만 받아 도형을 새로 짓고, 녹인 실루엣은 몸의 생김새를 녹여 남깁니다. 작품의 성격이
   여기서 갈립니다.
3. **입력 바꾸기** 「무엇을 보나」에서 영상 파일을 고르면 찍어 둔 영상으로 돕니다. 같은 움직임으로
   규칙을 여러 번 비교할 때 씁니다. 바깥을 향해 단 카메라로 남을 찍을 때는 **거울처럼 뒤집기** 를 끕니다.
4. **`web/rule.js`** 실루엣의 무엇이 색면의 무엇을 바꾸는지 정하는 곳입니다. 「가까이 오면 커진다」,
   「팔을 벌리면 뾰족해진다」 같은 연결이 한 줄씩 적혀 있습니다. 이 줄들을 바꾸면 작품이 바뀝니다.

Cursor 에서 이 폴더를 열고 「rule.js 에서 팔을 벌리면 색면이 가로로 길어지게 바꿔 줘」처럼 말하면
됩니다. 고친 뒤에는 새로 고침만 하면 보입니다.

## 5. 안 될 때

| 이런 일이 생기면 | 이렇게 합니다 |
|---|---|
| 카메라가 안 켜진다 | 주소창 왼쪽 자물쇠를 눌러 카메라를 허용합니다. 맥은 시스템 설정 → 개인정보 보호 → 카메라에서 크롬을 켭니다 |
| 「열지 못했습니다」가 뜬다 | 줌 같은 다른 앱이 카메라를 쓰고 있지 않은지 봅니다. 그동안은 가짜 사람으로 돕니다 |
| 「모델이 없습니다」가 뜬다 | 인터넷이 될 때 `./start.sh` 를 다시 켭니다. 없으면 받아 옵니다 |
| 몸이 붉게 안 칠해진다 | 상반신이나 온몸이 화면에 들어오게 물러섭니다. 주소에 `?gpu` 를 붙였다면 뺍니다 |
| 고쳤더니 화면이 하얗게 멈췄다 | 코드에 오타가 있습니다. 크롬에서 <kbd>Cmd</kbd>+<kbd>Option</kbd>+<kbd>J</kbd>(윈도우는 <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>J</kbd>)로 빨간 글자를 보고, 그대로 Cursor 에 붙여 넣습니다 |
| 느리다 (fps 가 10 아래) | `./start.sh --query in=256` 으로 사람을 찾는 그림을 줄입니다 |
| 「conda 환경이 없습니다」가 나온다 | 설치 한 줄을 다시 실행합니다. 이미 받은 폴더 안에서 `bash install.sh` 로 쳐도 됩니다 |
| Miniforge 를 깔지 못했다고 나온다 | <https://conda-forge.org/download/> 에서 받아 깐 뒤 설치 한 줄을 다시 실행합니다 |
| 윈도우에서 스크립트가 막힌다 | PowerShell 에 `Set-ExecutionPolicy -Scope Process Bypass -Force` 를 먼저 칩니다 |

## 6. 더 들어가기

한 프레임마다 카메라 → 실루엣 → 숫자 → 규칙 → 색면 순서로 흐릅니다. 파일도 단계마다 하나입니다.

```text
serve.py         시작하는 자리. web/ 를 띄우고 --sim · --offline 을 처리한다
fetch_model.py   모델과 시험용 영상을 받는다
web/
├── settings.js  만지는 숫자가 전부 여기. 여기부터 본다
├── sense.js     입력. 카메라 · 영상 · 가짜 사람을 실루엣과 관절로 바꾼다
├── features.js  실루엣에서 숫자 열 개를 뽑는다
├── rule.js      숫자를 색면의 값으로 잇는다. 여기가 작품이다
├── shape.js     출력. 색면을 그린다 (녹인 실루엣 · 특징 도형)
├── app.js       한 프레임에 벌어지는 일, 조절판, 녹화
└── vendor/      MediaPipe 라이브러리 (인터넷 없이 돌도록 넣어 두었다)
scripts/pi-*.sh  라즈베리파이 자동 시작
```

MediaPipe Pose Landmarker 는 사람마다 관절 33개와 몸의 윤곽(분리 마스크)을 함께 내 줍니다.
모두 브라우저 안에서 계산하고, 카메라 영상은 컴퓨터 밖으로 나가지 않으며 저장되지 않습니다.

폰이나 라즈베리파이에 올리는 길은 [docs/hardware.md](docs/hardware.md), 라즈베리파이를 켜면
바로 색면이 뜨게 하는 순서는 [docs/raspberrypi.md](docs/raspberrypi.md) 에 있습니다.
왜 이런 구조인지는 [docs/notes.md](docs/notes.md). AI 도구로 고칠 때의 규칙은 [AGENTS.md](AGENTS.md).

## 쓰는 것과 라이선스

사람 감지는 [MediaPipe](https://ai.google.dev/edge/mediapipe)(Apache-2.0)입니다. 라이브러리는
`web/vendor/` 에 넣어 두었고, 모델은 설치할 때 받습니다. 시험용 영상은 위키미디어 공용의
CC BY-SA 4.0 영상입니다. 전체 목록은 [NOTICE.md](NOTICE.md).

코드는 [OpenCircuit License v1.0](LICENSE)을 따릅니다. 오픈소스가 아니라 소스를 공개하되
쓰임을 제한합니다.

- **됩니다**: 받아서 쓰고 고치기. 이것으로 만든 **작품**은 전시하고 팔아도 허가가 필요 없습니다.
- **문의해 주세요**: 강좌나 워크숍의 교재로 쓰는 것, 코드 자체를 파는 것. <jh.bae@kaist.ac.kr>

---

<details>
<summary>English</summary>

A person in front of the camera becomes a single black shape. Come closer and it grows, open your
arms and its edge turns spiky, move and it ripples. When everyone leaves it shrinks and breathes.

```bash
curl -fsSL https://raw.githubusercontent.com/joonhyungbae/mediapipe-shadowpatch/main/install.sh | bash
cd mediapipe-shadowpatch && ./start.sh      # opens 127.0.0.1:7000
```

The installer creates a conda environment (`shadowpatch`, Python only; Miniforge is installed to
`~/miniforge3` if no conda is found). A standard-library server (`serve.py`) serves `web/`, and MediaPipe
Pose Landmarker runs in the browser (library vendored in `web/vendor/`, model fetched at install).
`web/features.js` reduces the mask and landmarks to ten numbers, `web/rule.js` maps them to the shape,
and `web/shape.js` draws it as a melted silhouette or a parametric form. Every tunable value is in
`web/settings.js`. Try it without installing: <https://joonhyungbae.github.io/mediapipe-shadowpatch/>.

Source-available, not open source: personal and artistic use is free and the works you make are
entirely yours; teaching with it or selling it needs permission ([LICENSE](LICENSE)).

</details>

<sub>《2026 오픈서킷 부산: 아트앤테크 프랙티스》에서 만든 작품 베이스라인입니다. 다른 도구는
[opencircuit](https://github.com/joonhyungbae/opencircuit)에 모여 있습니다.</sub>
