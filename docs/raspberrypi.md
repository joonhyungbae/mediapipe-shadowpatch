# 라즈베리파이 5에 올리기

노트북에서 돌던 페이지를 그대로 라즈베리파이에 올려, 전원만 켜면 색면 화면이 뜨는 장비로 만듭니다.

**어떻게 도는가.** 파이가 켜지면 파이 안에서 작은 웹 서버가 뜨고, 크로미움 브라우저가 전체 화면으로 이 페이지를 엽니다.
웹캠 영상은 브라우저 안에서 바로 실루엣이 되고, 같은 페이지가 색면을 그려 화면에 띄웁니다.
노트북도 인터넷도 필요 없고, 영상은 파이 밖으로 나가지 않으며 저장되지 않습니다.

> 이 안내는 실제 라즈베리파이에서 아직 시험하지 않았습니다. 처음 올려 보면서 막히는 곳이 있으면 알려 주세요. 고쳐서 다시 올리겠습니다.

## 1. 준비물

| 무엇 | 비고 |
|---|---|
| 라즈베리파이 5 (4GB 이상) | |
| microSD 카드 32GB 이상 | |
| USB 웹캠 | 광각이면 가까운 거리에서도 사람 전신을 잡기 쉽다 |
| 작은 화면 (5~7인치, HDMI 또는 DSI) | HDMI 화면이면 파이 5 쪽은 micro HDMI 선이 필요하다 |
| 공식 Active Cooler | 케이스에 넣는다면 사실상 필수 |
| 책상용 전원: 공식 27W 어댑터 | 처음 설치와 시험용 |
| 배터리로 쓸 때: USB-C PD 보조배터리 | 4절에서 잰다 |
| 처음 설치할 때만: 키보드, 마우스 | 원격 접속(SSH)으로 대신해도 된다 |

## 2. SD 카드 만들기 (노트북에서)

1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) 를 설치하고 엽니다.
2. 장치 **Raspberry Pi 5**, 운영체제 **Raspberry Pi OS (64-bit)** (데스크톱이 있는 판), 저장소는 SD 카드를 고릅니다.
3. 「설정을 편집」에서 다음을 넣습니다.
   - 호스트 이름: `shadowpatch`
   - 사용자 이름과 비밀번호
   - 와이파이 (설치할 때만 인터넷이 필요합니다)
   - 서비스 탭에서 **SSH 사용** 을 켭니다
4. 쓰기가 끝나면 SD 카드를 파이에 꽂고, 화면, 웹캠, 쿨러를 연결한 뒤 27W 어댑터로 켭니다.

## 3. 설치 (한 번만)

노트북 터미널에서 파이에 접속합니다. 사용자 이름은 2단계에서 정한 것입니다.

```bash
ssh 사용자이름@shadowpatch.local
```

파이 안에서 다음을 차례로 칩니다.

```bash
git clone https://github.com/joonhyungbae/mediapipe-shadowpatch
cd mediapipe-shadowpatch
bash scripts/pi-setup.sh
sudo reboot
```

`pi-setup.sh` 는 네 가지를 합니다. 크로미움 등 필요한 프로그램 설치, conda 환경과 모델(conda 가 없으면 Miniforge 를 `~/miniforge3` 에 깝니다), 화면 꺼짐 막기, 켜면 저절로 뜨게 하기입니다.
자동 시작도 같은 conda 환경(`shadowpatch`)으로 서버를 띄웁니다.
다시 켜지면 색면 화면이 전체 화면으로 뜹니다.

## 4. 처음 켜서 잴 것 세 가지

노트북에서 잰 값은 파이에서 그대로 통하지 않습니다. 아래 표를 직접 채웁니다.

**빠르기.** 키보드를 꽂고 `H` 를 누르면 조절판이 나오고, 화면 아래에 fps 가 보입니다. 다시 `H` 를 누르면 숨겨집니다.
움직임이 끊겨 보이면 `pi.env` 의 `QUERY` 에 `in=256` 이나 `in=192` 를 넣어 사람을 찾는 그림을 줄입니다.

**전원과 열.** `pi.env` 에 `CHECK=1` 을 넣고 다시 켜면 10초마다 온도와 전원 상태를 `~/shadowpatch-check.csv` 에 적습니다.
보조배터리로 켜 두었다가 꺼지면, 다시 켜서 파일의 마지막 줄을 봅니다. 「켠지(분)」가 버틴 시간입니다.

- `throttled` 가 `0x0` 이면 괜찮습니다. 0 이 아니면 전원이 모자랐거나 열 때문에 느려진 적이 있다는 뜻입니다.
- 파이 5는 5V 5A 전원을 기대합니다. 그보다 약한 전원이면 시작할 때 경고를 띄우고 USB 장치에 주는 전류를 줄입니다. 웹캠이 끊기거나 화면이 깜빡이면 전원부터 의심합니다.

| 잴 것 | in=320 | in=256 | in=192 |
|---|---|---|---|
| fps | | | |

| 잴 것 | 값 |
|---|---|
| 보조배터리 이름과 용량 | |
| 버틴 시간 | |
| 한 시간 뒤 온도 | |
| throttled 가 0 이 아닌 적이 있었나 | |

## 5. 설정 바꾸기: `pi.env`

설치하면 저장소 폴더에 `pi.env` 가 생깁니다. 고친 뒤 파이를 다시 켜면 적용됩니다.

```bash
nano ~/mediapipe-shadowpatch/pi.env
```

| 이름 | 하는 일 | 예 |
|---|---|---|
| `QUERY` | 주소에 붙일 것. 카메라 고르기, 입력 크기, 가짜 사람 | `"cam=USB&in=256"` |
| `ROTATE` | 화면 회전. 세로로 달면 90 이나 270 | `"90"` |
| `OUTPUT` | 회전할 화면 이름. 비우면 첫 화면 | `"HDMI-A-1"` |
| `CHECK` | 1 이면 온도와 전원 상태를 적는다 | `"1"` |

- 카메라 이름은 `v4l2-ctl --list-devices`, 화면 이름은 `wlr-randr` 로 봅니다.
- 조절판에서 바꾼 값(크기, 뾰족함, 색 등)은 그 브라우저에 남습니다. 노트북에서 맞춘 값이 파이로 따라오지는 않으니 파이에서 `H` 를 눌러 다시 맞춥니다. 값을 아예 처음 값으로 박아 두려면 `web/settings.js` 의 `PARAMS` 에서 `value` 를 고칩니다.

## 6. 노트북에서 고친 규칙을 파이로 옮기기

`web/rule.js` 는 노트북에서 고치고 확인한 뒤 파이로 옮깁니다. 노트북 터미널에서 칩니다.

```bash
scp web/rule.js web/settings.js 사용자이름@shadowpatch.local:mediapipe-shadowpatch/web/
ssh 사용자이름@shadowpatch.local sudo reboot
```

자기 GitHub 저장소를 따로 두고 파이에서 `git pull` 로 받아도 됩니다.
코드를 공개하고 싶지 않으면 그 저장소를 비공개로 만들면 됩니다.

## 7. 멈추기와 되돌리기

```bash
touch /tmp/shadowpatch-stop && pkill -f chromium     # 지금 멈춘다 (다시 켜면 또 뜬다)
bash ~/mediapipe-shadowpatch/scripts/pi-setup.sh off  # 자동 시작을 끈다
bash ~/mediapipe-shadowpatch/scripts/pi-setup.sh      # 다시 켠다
```

## 막힐 때

| 증상 | 볼 곳 |
|---|---|
| 화면이 안 뜬다 | `cat /tmp/shadowpatch-server.log`. 그리고 `ps aux \| grep chromium` 으로 브라우저가 떠 있는지 |
| 「열지 못했습니다」가 뜬다 | 웹캠이 잡혔는지 `v4l2-ctl --list-devices`. USB 포트를 바꿔 꽂아 본다 |
| 실루엣이 붉게 안 칠해진다 | `QUERY` 에 `gpu` 를 넣었다면 뺀다 |
| 느리다 | `in=256`, `in=192`. 그래도 느리면 AI 가속기(AI HAT+ 2)를 검토한다. 이때는 파이썬판으로 다시 짜야 한다 |
| 가끔 웹캠이 끊긴다 | 전원. 4절의 throttled 를 본다 |
| 화면이 몇 분 뒤 꺼진다 | `sudo raspi-config` → Display Options → Screen Blanking 을 끈다 |
| 크로미움이 「복구할까요」를 묻는다 | 전원을 갑자기 뽑아서 그렇다. 시작 설정에 이미 막아 두었으니 반복되면 알려 주세요 |
