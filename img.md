# 이미지 출력 규칙 정리

이 문서는 채팅 화면에서 이미지가 어떻게 파싱/출력되는지 현재 코드 기준으로 설명합니다.

## 1) 지원 태그 형식

채팅 본문에서 아래 형식들을 입력하면 내부적으로 `<img=...>` 형태로 정규화됩니다.

- `<img=REF>`
- `<img=REF:background>`
- `<img=REF:character>`
- `<img=REF:etc>` (`overlay`, `ui`도 같은 계열로 처리)
- `<img-src=REF>`
- `<img-src=REF:background>`
- `<img-src=REF:character>`
- `<img-src-REF>` (대시 변형)
- HTML `<img src="REF">` (src를 REF로 인식)
- 이스케이프된 `&lt;img ...&gt;`, `&lt;img-src ...&gt;`도 인식

## 2) REF(참조값) 매칭 규칙

`REF`는 에셋의 다음 값들과 매칭됩니다.

- `asset.id` 정확/대소문자 무시 매칭
- `asset.label` 정확/대소문자 무시 매칭
- `asset.url` 정확/대소문자 무시 매칭
- URL basename/확장자 제거 basename 매칭
- 특수문자를 제거한 정규화 문자열 기준 매칭
- 길이가 충분할 때 부분 일치(fuzzy) 보조 매칭

즉, 가능하면 **가장 안전하게 `asset.id`를 태그에 넣는 방식**을 권장합니다.

## 3) 타입 힌트(`:background`, `:character`, `:etc`) 처리

태그 뒤에 타입 힌트를 붙이면 우선적으로 해당 타입으로 분류합니다.

- `:background` -> 배경 레이어
- `:character` -> 캐릭터 스프라이트 레이어
- `:etc`, `:overlay`, `:ui` -> 오버레이 레이어

힌트가 없어도 에셋의 실제 `type` 값(`background` / `character` / `ui`)으로 분류됩니다.

## 4) 화면 상태 계산 방식(중요)

채팅은 메시지 전체를 처음부터 현재 인덱스까지 스캔하여 상태를 만듭니다.

- 배경: 마지막으로 발견된 배경 태그가 현재 배경이 됨
- 캐릭터: 메시지 내 캐릭터 태그들을 수집하여 현재 캐릭터 목록을 교체
- 오버레이: 마지막으로 선언된 오버레이 목록 유지

태그가 없을 때 기본값:

- 배경: `initialBackground` -> 없으면 첫 background 에셋
- 캐릭터: `initialCharacter` -> 없으면 첫 character 에셋 -> 없으면 프로필 이미지 fallback

## 5) 표시 On/Off 조건

`extraInterfaceEntries`의 `visibility` 설정이 최종 렌더링에 영향을 줍니다.

- `visibility.background === false` 이면 배경 숨김
- `visibility.character === false` 이면 캐릭터 숨김
- `visibility.dialogue === false` 이면 대사창 숨김

## 6) 오버레이 단독 모드

현재 메시지에서 오버레이만 있고(배경/캐릭터 태그 없음) 조건이 맞으면 `overlayOnlyMode`가 켜질 수 있습니다.  
이 경우 캐릭터가 의도적으로 숨겨질 수 있습니다.

## 7) 이미지 URL 종류와 렌더링

`Next/Image` 렌더링 시 다음 URL은 최적화 제외(`unoptimized`)로 처리됩니다.

- `data:...`
- `blob:...`

업로드 직후 생성되는 `blob:` URL은 이 처리 없으면 이미지가 보이지 않을 수 있습니다.

## 8) 권장 작성 예시

가장 권장되는 형식(에셋 ID 사용):

- 배경: `<img-src=YOUR_BG_ASSET_ID:background>`
- 캐릭터: `<img-src=YOUR_CHARACTER_ASSET_ID:character>`
- 오버레이: `<img-src=YOUR_UI_ASSET_ID:etc>`

초기 대사/로그에 섞어도 정상 동작합니다.

## 9) 캐릭터가 안 보일 때 점검 순서

1. 태그가 실제로 로그에 남았는지 확인 (`<img...>` 형태)
2. 태그 REF가 실제 에셋 `id`와 일치하는지 확인
3. 해당 에셋의 `type`이 `character`인지 확인
4. `visibility.character`가 `false`인지 확인
5. 오버레이 단독 모드 조건인지 확인
6. URL이 `blob:`/`data:`일 때 렌더링 예외 처리 상태 확인

