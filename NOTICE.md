# NOTICE · 제3자 구성요소

이 저장소의 코드는 [LICENSE](LICENSE) 를 따릅니다. 아래 것들은 각 원저작자의 라이선스를 그대로 따릅니다.

## 코드에 포함한 것

| 경로 | 출처 | 원저작자 | 라이선스 | 수정 여부 |
|---|---|---|---|---|
| `web/vendor/mediapipe/vision_bundle.mjs` | https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/vision_bundle.mjs | Google | **Apache-2.0** | 수정 없음 |
| `web/vendor/mediapipe/wasm/vision_wasm_internal.js`, `.wasm` | https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm/ | Google | **Apache-2.0** | 수정 없음 |

전시장에서 인터넷이 끊겨도 돌도록 CDN 대신 파일을 넣어 두었습니다. wasm 은 SIMD 판 하나만 넣었습니다.
SIMD 를 못 쓰는 아주 오래된 브라우저에서는 열리지 않습니다.

## 실행할 때 설치하는 것

conda 환경(`environment.yml`)에는 파이썬만 들어갑니다. `serve.py` 와 `fetch_model.py` 는 표준 라이브러리만 씁니다.

| 대상 | 쓰는 곳 | 라이선스 |
|---|---|---|
| Python (conda-forge) | 웹 서버, 내려받기 | PSF License |
| Miniforge (conda 가 없을 때만 `~/miniforge3` 에 깐다) | conda 환경 | BSD-3-Clause |

## 따로 받아 쓰는 것

| 대상 | 출처 | 라이선스 | 비고 |
|---|---|---|---|
| MediaPipe Pose Landmarker 모델 (`web/models/pose_landmarker_lite.task`) | https://storage.googleapis.com/mediapipe-models/ | Apache-2.0 | 저장소에 넣지 않는다. 설치 스크립트가 받는다. 설치 없이 보는 주소에는 배포할 때 받아 올린다 |
| 시험용 영상 (`web/sample/팔벌려뛰기.webm`) | https://commons.wikimedia.org/wiki/File:Jumping_jacks_and_burpees.webm | **CC BY-SA 4.0** (Taco fleur) | 저장소에 넣지 않는다. 설치 스크립트가 받고 출처를 `web/sample/credits.md` 에 적는다. 시험용으로만 쓴다 |
