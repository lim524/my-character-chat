# NovelChat / my-character-chat — 설정용 AI 프롬프트 팩

> 생성 화면 오른쪽 아래 **「AI 가이드」** 버튼에서도 이 내용을 볼 수 있습니다.  
> 웹에서 사용하는 원본 파일: `public/ai-configuration-prompt-pack.md` — 내용을 바꿀 때는 이 파일과 이 문서를 함께 맞추세요.

다른 AI(챗봇)에게 **정규식·전역 인터페이스·출력 형식**을 짜 달라고 할 때, 아래를 **순서대로 복사**하면 질문이 구체해져서 결과가 안정적입니다.

---

## 설정 지도: 연관관계와 권장 작업 순서 (상세)

### 왜 “한 가지만” 켜도 잘 안 맞는가

캐릭터는 **에셋 → 프롬프트(백그라운드 임베딩·시나리오) → 모델 출력 → 후처리(정규식) → 화면(VN·추가 인터페이스·커스텀 CSS·전역 UI·게임 변수)** 순으로 한 줄로 이어집니다.  
어느 한 축만 있으면 나머지가 “연결되지 않은 기본 동작”으로 남을 수 있습니다. 아래는 **누가 무엇을 참조하는지**, **최소로 무엇을 같이 써야 하는지**입니다.

### 흐름 한눈에 보기 (채팅 한 턴)

1. **요청**  
   사용자 입력 → (선택) `modify_input` 정규식 → `modify_request` 정규식 → 모듈 규칙 등을 거쳐 API 요청 본문에 포함.  
   시스템 쪽 컨텍스트에는 대략 **백그라운드 임베딩**, **시나리오·규칙**, (있으면) **게임 변수 안내·스탯 안내**, **이미지 태그 가이드**가 붙습니다.
2. **모델**  
   위 문맥과 대화 로그를 보고 응답. 본문에 `<img=에셋ID…>` 태그, `*나레이션*`, `**대사**`, (선택) 맨 끝 `[game_state]` … `[/game_state]` 블록을 둘 수 있습니다.
3. **응답 (서버)**  
   `modify_output` 정규식 → 모듈 규칙 → 클라이언트로 전달.  
   **주의:** `modify_output`이 `[game_state]` 블록이나 `<img=…>` 줄을 지우면 **방 상태 갱신·VN 배경·스프라이트 갱신이 깨질 수 있습니다.**
4. **응답 (클라이언트)**  
   이미지 태그 정규화 등 → **`[game_state]` 파싱 후 채팅방별 저장** → 대화에 남기는 텍스트에서는 해당 블록 제거.  
   화면에 그릴 때는 표시용 경로에서 `modify_display` 등이 관여할 수 있습니다.
5. **화면**  
   VN 배경·캐릭터는 **등록된 에셋 ID + 본문의 이미지 태그**로 바뀝니다.  
   **게임 변수** 값은 **채팅방(방 ID)마다** 저장되며, 전역 인터페이스 HTML의 `{{키이름}}` 치환과 이벤트로 연결됩니다.

**전역 인터페이스(레이어)** 는 **`/chat/…` 채팅 방 화면에 들어갔을 때만** 주입됩니다. 홈·캐릭터 목록·설정·생성 화면 배경에는 올라가지 않습니다. 생성 화면의 큰 미리보기는 **캐릭터 `customCSS`·에셋·추가 인터페이스** 중심이며, **저장된 전역 레이어 미리보기는 채팅과 동일하지 않을 수 있습니다.**

### 요소별 역할과 연결 (표)

| 구분 | 저장 위치(대표) | 모델·채팅과의 관계 | 자주 나는 실수 |
|------|-----------------|-------------------|----------------|
| **에셋** | `interfaceConfig.assets` | `<img=에셋ID:background>` 등 **태그가 여기 등록된 ID를 가리킴**. `details`의 초기 배경/캐릭터도 같은 풀. | 태그만 쓰고 에셋에 없음, ID 오타. |
| **백그라운드 임베딩** | `backgroundEmbedding` | **매 API 요청**에 시스템 프롬프트로 “항상 준수” 섹션으로 붙음. 세계관·금지·출력 형식 같은 **불변 규칙**에 맞음. | 시나리오와 문장을 똑같이 두 군데에 두어 모델이 혼동. |
| **시나리오·규칙** | `dialogueScript`, `scenarioRules` | API에서 `# 시나리오 및 게임 규칙`으로 합쳐짐. **말투·장면·진행**에 두고, “항상 지켜야 할 법칙”은 임베딩에 모아 두면 역할이 분리됨. | 비어 있으면 시스템 기본 가이드·임베딩만으로 동작. |
| **정규식** | `regexScripts` | 단계가 다름: 입력 / 요청 / **모델 출력** / 표시. **출력에서 이미지 태그를 지우면 화면 VN이 안 바뀜.** | `modify_output`에서 `[game_state]`까지 삭제. |
| **게임 변수** | `gameVariables` + 방별 저장 | 시스템에 키 목록이 실림. 응답 끝 `[game_state]` JSON으로만 정의된 키 갱신. **전역 UI `{{키}}`** 와 짝. | 정의 없는 키만 JSON으로 보냄(무시됨), HTML의 `{{이름}}`과 키 불일치. |
| **전역 인터페이스** | 앱 설정·카드 `globalUiLayers` 등 | **채팅 방에서만** CSS/HTML/JS 레이어. 변수와 **자동 양방향 연동은 아님**(치환·이벤트로 수동에 가깝). | 모든 페이지에 깔린다고 가정(실제는 채팅만). |
| **추가 인터페이스** | `extraInterfaceEntries` | VN 위 오버레이·아이콘·캐릭터 레이아웃 JSON. **에셋 ID**·태그와 연동되는 트리거가 많음. | JSON 키가 생성 탭 예시와 다름. |
| **커스텀 CSS** | `interfaceConfig.customCSS` | 채팅과 생성 미리보기 등에 주입. 전역 레이어 CSS와 **별 트랙**이며 둘 다 켜면 선택자 충돌 가능. | 같은 요소에 서로 덮어씀. |
| **로어북** | `loreEntries` 등 | 키워드 매칭 시에만 API 컨텍스트에 추가. 정규식 파이프라인과는 별개. | 활성화 조건과 무관한 긴 로어를 한 번에 넣음. |

### 게임 변수(`gameVariables`) vs 스탯(`stats`)

- **게임 변수**: 정의된 키만, **`[game_state]{ … }[/game_state]`** 로 갱신. 방별 저장. HUD·문구는 전역 HTML의 `{{키}}`에 맞추기 좋음.
- **스탯**: 별도 안내 블록이 있고, 모델이 **응답 마지막 줄에 JSON 한 줄**로 수치를 내는 흐름(앱의 스탯 가이드 따름).  
같은 화면에 **숫자 두 체계를 동시에** 쓰면 규칙이 길어지고 모델이 혼동할 수 있어, 목적에 맞게 **하나를 중심**으로 잡는 편이 안전합니다.

### 권장 작업 순서 (처음 채울 때)

1. **프로필·이미지 탭** — 배경·캐릭터 등 **에셋 ID를 고정**하고, 나중에 프롬프트 예시에 그 ID를 그대로 쓸 것.
2. **백그라운드 임베딩** — 세계관, 금지 사항, **출력 형식**(태그·`*`·`**`·선택 시 `[game_state]` 위치)을 한 블록으로 정리.
3. **시나리오 및 규칙** — 성격, 장면 진행, 분기 힌트(임베딩과 **중복 문장 최소화**).
4. **(선택) 게임 변수** — 키·타입·기본값 정의 후, 임베딩에서 “끝에 `[game_state]` 로만 갱신”을 명시.
5. **(선택) 전역 인터페이스** — HUD용 HTML/CSS; `{{키}}`는 4번의 키와 **완전히 동일한 스펠링**.
6. **정규식** — 먼저 `modify_display`로 표시만 다듬기 → `modify_output`은 **태그·상태 블록을 건드리지 않는지** 검증하며 추가.

### 외부 AI에게 시킬 때 한 줄 팁

위 순서를 요청에 적어 주면, “임베딩 문단”, “시나리오 문단”, “Regex JSON”, “변수 키 목록”, “전역 HTML 조각”을 **서로 모순 없이** 짜기 쉬워집니다. **같은 규칙을 백그라운드 임베딩과 시나리오에 이중 기재하지 말 것**을 명시하면 충돌이 줄어듭니다.

---

## 1. 첫 메시지에 통째로 넣을 “앱 컨텍스트” (복붙용)

아래 블록을 요청 맨 앞에 붙이세요.

```text
대상 앱: NovelChat 계열 로컬 캐릭터 챗 (Next.js + React). 내가 설정에 붙여 넣을 JSON/정규식/CSS만 생성해 줘. 앱 소스를 가정하지 말고, 아래 스펙만 따를 것.

[Regex Script]
- 저장 위치: 캐릭터의 interfaceConfig.regexScripts 배열.
- 한 줄 규칙 타입 RegexScriptEntry: { id: string(uuid), name: string, scriptType: "modify_input"|"modify_output"|"modify_request"|"modify_display", pattern: string(JS RegExp 소스), replacement: string ($1,$2 허용), enabled: boolean }
- phase 의미:
  - modify_input: 사용자가 입력한 문자열
  - modify_output: AI가 방금 생성한 assistant 한 턴의 텍스트(저장/전송에도 연관될 수 있음)
  - modify_request: API로 보내는 요청 본문
  - modify_display: 화면에만 쓰는 텍스트(채팅 메시지 표시·이미지 태그 정리 경로에 사용)
- 정규식은 JavaScript `new RegExp(pattern, "g")` 로 돌아감. 백슬래시는 JSON 문자열 안에서 이중 이스케이프 필요할 수 있음.

[채팅 이미지 태그 — AI가 본문에 써야 할 형식]
- 배경(맨 앞 권장): <img=에셋ID:background>
- 캐릭터(기본): <img=에셋ID> 또는 타입 힌트: :character, :etc, :overlay, :ui
- 등록된 에셋 ID/label/type은 캐릭터 interfaceConfig.assets 기준.

[대화창 가벼운 마크다운]
- **굵게** / *이탤릭(나레이션 느낌)* — 표시기가 strong/em으로 나눔.
- 메시지 끝에 단독 JSON 객체 { ... } 를 붙이면 UI가 끝부분 JSON을 표시에서 제거할 수 있음(수치 UI 용도 등).

[전역 인터페이스 — 채팅 방 화면 전용 HTML/CSS/JS 레이어]
- 여러 개 레이어: 각각 { id, name, enabled, html, css, javascript }.
- 적용 범위: /chat/… 채팅 방에 들어갔을 때만 주입. 다른 페이지(홈·목록·생성 등)에는 적용되지 않음.
- 적용 순서: 켜진 레이어 위→아래로, CSS → HTML(고정 오버레이) → JS(new Function) 실행. HTML 필드의 <script>는 저장 시 제거됨. 스크립트는 javascript 필드에만.
- 대략 제한: CSS는 레이어당 약 2만자 수준에서 잘릴 수 있음, HTML 10만자, JS 5만자(앱 구현 기준, 여유 있게 쓰지 말 것).
- 게임 변수 {{키}} 치환 등은 정의·저장과 연동되나, 채팅 메시지 본문과 자동 동기화되지는 않음. DOM 감시 JS는 실험적.
- 이미지 에셋(배경·캐릭터·기타/ui) ID를 전역 HTML에 자동 삽입하는 기능은 없음. 기타 이미지를 쓰려면 해당 에셋의 URL을 직접 넣거나, 문자열 게임 변수 + {{키}} 로 우회(§9).

[캐릭터 카드 JSON 확장(내보내기/가져오기)]
- extensions.my_character_chat 아래: interfaceConfig, details, (선택) globalUiLayers — 전역 레이어 배열.

[동적 게임 변수 gameVariables]
- interfaceConfig.gameVariables: 각 항목은 key, type(string|number|boolean), defaultValue 등.
- AI는 필요 시 응답 끝에 [game_state] 와 [/game_state] 사이에 JSON 객체 한 개를 넣어 상태를 갱신한다. 정의된 키만 채팅방별로 저장되며, 전역 인터페이스 HTML에서는 {{key}} 로 표시에 반영된다.

응답은 항상: (1) 한국어로 짧은 설명 (2) 복사 가능한 JSON 또는 정규식/치환문만 코드 블록.
```

---

## 2. “정규식만” 짜 달라고 할 때 붙이는 문장

```text
위 스펙의 RegexScriptEntry만 사용해 줘. scriptType은 modify_display로 하고, 내가 하려는 것: [여기에 한 문장: 예) OOC [OOC]...[/OOC] 제거, 연속 개행 2개로 압축, 특수 접두어로 감싼 나레이션은 남기기]. pattern/replacement JSON 한 개 이상 제시해 줘. enabled: true.
```

---

## 3. “전역 CSS만” 짜 달라고 할 때

```text
전역 인터페이스의 css 필드에 넣을 CSS만. !important는 충돌 날 때만. 대상: [예) 굵은 대사 색, 대화 박스 둥근 테두리, 상단 고정 나레이션 박스는 html에 내가 id를 둘 예정: #mc-narration]. Tailwind가 이미 있으니 클래스 충돌 주의해 줘.
```

---

## 4. “전역 JS (실험)” 짜 달라고 할 때

```text
javascript 필드에 넣을 단일 IIFE 또는 즉시 실행 코드만. new Function으로 실행됨. 정리 함수를 반환하면 다음 레이어 갱신 시 호출될 수 있음(return () => { ... }). 목표: [예) 특정 텍스트가 포함된 마지막 메시지 찾기는 가능하지만 DOM 선택자는 불안정하니 data-attribute 없으면 최소한의 query만 쓰라고 경고해 줘].
```

---

## 5. “추가 인터페이스 JSON” 짜 달라고 할 때

```text
extraInterfaceEntries 한 줄의 json 문자열 안에 들어갈 객체를 만들어 줘. 형식은 최소 { "icons": [...], "overlays": [...] }. 아이콘은 lucide 이름 문자열, 위치는 top-left 등 문자열. 오버레이는 id, assetId 또는 url, position, visible 트리거 방식은 채팅 태그와 에셋과 연동된다는 설명만 하고, 내 카드 에셋 ID는 다음과 같다: [목록].
```

(실제 키 이름은 앱의 `CreateExtraInterfaceTab` 예시 JSON과 동일하게 유지.)

---

## 6. “모델 출력 규칙” 문장만 만들어 달라고 할 때

```text
시나리오/프롬프트에 넣을 한국어 규칙 문단만 써 줘. 조건: 매 응답에 배경 태그 1 + 캐릭터 태그 1 이상, 나레이션은 *별표 한 겹*으로, 중요 대사는 **굵게**. 금지: [리스트].
```

(서버 쪽 하드코딩된 태그 가이드가 있을 수 있으니, 캐릭터 시나리오·백그라운드 임베딩과 **함께** 쓰는 게 안전함.)

---

## 7. 변수·키 이름 빠른 목록 (복붙·검증용)

| 이름 | 설명 |
|------|------|
| `interfaceConfig.regexScripts` | Regex 규칙 배열 |
| `interfaceConfig.assets` | `{ id, type: background\|character\|ui, label, url, ... }` |
| `interfaceConfig.backgroundEmbedding` | 매 요청 시스템에 붙는 **백그라운드 임베딩** |
| `interfaceConfig.extraInterfaceEntries` | `{ id, name, json }` — `json` 안에 icons/overlays 등 |
| `interfaceConfig.dialogueScript` / `scenarioRules` | 시나리오·규칙 (**임베딩과 역할 분리** 권장 — 위 설정 지도 참고) |
| `interfaceConfig.customCSS` | 캐릭터 단위 CSS (전역 레이어 `css`와 별도 트랙) |
| 전역 `global-ui-layers` (또는 카드 `globalUiLayers`) | 전역 UI 레이어 배열 (**채팅 방 화면에서만** 적용) |
| `scriptType` | `modify_input` \| `modify_output` \| `modify_request` \| `modify_display` |
| `interfaceConfig.gameVariables` | 동적 변수 정의 — `[game_state]` 로 갱신, 방별 저장, 전역 HTML `{{키}}` |
| `interfaceConfig.stats` | 스탯 추적(별도 출력 규칙) — `gameVariables` 와 형식이 다름 |
| `details` (예: `initialBackground`) | 새 방·미리보기 초기 장면용 에셋 ID 등 |

---

## 8. 동적 게임 변수 (`gameVariables`)

캐릭터 생성 화면 → **게임 변수** 탭에서 키·타입·기본값을 정의한다.

- AI는 응답 **본문 끝**에 아래 블록을 넣으면, 클라이언트가 파싱한 뒤 **대화창에서는 블록이 제거**된다.

```text
[game_state]
{ "banner_text": "이진성 헌터가 출몰했습니다", "hp": 72 }
[/game_state]
```

- JSON은 **객체 하나**. 위에서 정의한 **키만** 병합되며, 정의에 없는 키는 무시된다.
- 값은 **채팅방(방 ID)별**로 로컬에 저장된다. 방을 바꾸면 해당 방에 저장된 상태가 로드된다.
- **전역 인터페이스** HTML에서는 `{{키이름}}` 자리에 현재 값이 들어간다 (텍스트는 HTML 이스케이프).
- `/api/chat` 시스템 프롬프트에 변수 목록·블록 형식이 자동 포함된다.

외부 AI에게 시킬 때 예시:

```text
위 앱의 gameVariables 키만 사용해서 [game_state] 블록 예시를 만들어 줘. 키: banner_text(string), hp(number).
```

---

## 9. 전역 인터페이스 HTML에서 기타( UI ) 이미지·에셋 반영

생성 화면 **이미지** 탭의 **기타 이미지**는 데이터상 `interfaceConfig.assets` 에서 **`type: ui`** 로 저장된다. 채팅 본문의 `<img=에셋ID:etc>` / `:ui` 태그는 **VN·대화 처리 전용**이며, **전역 인터페이스 HTML은 에셋 ID만 보고 이미지를 자동 삽입하지 않는다.** 전역 HTML에서 지원하는 치환은 **게임 변수 `{{키이름}}`** 뿐이다.

그래도 같은 그림을 HUD 등에 쓰려면 아래 **우회**를 쓴다.

### 방법 A — 이미지 URL을 직접 넣기

- 에셋 행에 표시되는 **이미지 주소(URL)** 를 복사해, 전역 HTML/CSS의 `<img src="…">` 또는 `background-image: url(…)` 에 **그대로 붙여 넣는다.**
- 로컬 업로드면 **`data:image/...;base64,...`** 형태가 길게 들어갈 수 있다.

### 방법 B — 게임 변수(문자열)에 URL 저장 후 `{{키}}`

1. **게임 변수** 탭에서 문자열 키를 만든다 (예: `hud_img_url`).
2. 기본값에 해당 에셋의 URL을 넣거나, AI에게 `[game_state]`로 URL을 갱신하도록 유도한다.
3. 전역 HTML 예: `<img src="{{hud_img_url}}" alt="" />`  
   - 값이 **완전한 URL**이면 브라우저가 로드한다.  
   - `{{…}}` 치환은 텍스트용 HTML 이스케이프를 타므로, URL에 `&` 등이 많으면 이스케이프 이슈가 날 수 있어 **가능하면 `&`가 적은 URL·data URL** 을 쓴다.

### 외부 AI에게 시킬 때 (복붙용)

```text
전역 인터페이스 HTML 조각과 짝이 되게 해 줘:
1) gameVariables에 이미지 URL용 문자열 키 하나 정의
2) 전역 HTML에는 <img src="{{그_키}}" /> 만 두고, URL은 내가 에셋에서 붙일 예정이라고 가정
3) 필요하면 [game_state]로 그 키를 갱신하는 예시 JSON
기타(ui) 에셋 ID 자동 치환은 앱에 없으니 언급하지 말 것.
```

---

## 10. `test.md`와의 관계

같은 저장소의 `test.md`는 **Regex + 전역 UI 조합 개념 예시**이고, 이 문서는 **외부 AI에 시킬 때 쓰는 메타 가이드**입니다. 둘 다 참고하면 됩니다.

---

## 11. 주의 (AI 답변 검증용)

- 정규식이 잘못되면 앱이 해당 규칙을 **건너뛴다** (콘솔에만).
- 전역 HTML에 `<script>`를 넣으면 **삭제**된다.
- CSS/길이 제한으로 **잘릴 수 있다**.

이 문서는 앱 동작을 100% 보장하지 않으며, 저장 전에 항상 짧은 문장·한 턴으로 시험할 것.
