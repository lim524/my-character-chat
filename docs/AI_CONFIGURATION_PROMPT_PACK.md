# NovelChat / my-character-chat — 설정용 AI 프롬프트 팩

> 생성 화면 오른쪽 아래 **「AI 가이드」** 버튼에서도 이 내용을 볼 수 있습니다.  
> 웹에서 사용하는 원본 파일: `public/ai-configuration-prompt-pack.md` — 내용을 바꿀 때는 이 파일과 이 문서를 함께 맞추세요.

다른 AI(챗봇)에게 **정규식·전역 인터페이스·출력 형식**을 짜 달라고 할 때, 아래를 **순서대로 복사**하면 질문이 구체해져서 결과가 안정적입니다.

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

[전역 인터페이스 — 앱 전체 HTML/CSS/JS 레이어]
- 여러 개 레이어: 각각 { id, name, enabled, html, css, javascript }.
- 적용 순서: 켜진 레이어 위→아래로, CSS → HTML(고정 오버레이) → JS(new Function) 실행. HTML 필드의 <script>는 저장 시 제거됨. 스크립트는 javascript 필드에만.
- 대략 제한: CSS는 레이어당 약 2만자 수준에서 잘릴 수 있음, HTML 10만자, JS 5만자(앱 구현 기준, 여유 있게 쓰지 말 것).
- 전역 UI는 채팅 state와 기본 연동되지 않음. DOM 감시는 실험적.

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
| `interfaceConfig.backgroundEmbedding` | 항상 붙는 배경 설정 텍스트 |
| `interfaceConfig.extraInterfaceEntries` | `{ id, name, json }` — `json` 안에 icons/overlays 등 |
| `interfaceConfig.dialogueScript` / `scenarioRules` | 시나리오·규칙 |
| 전역 `global-ui-layers` (또는 카드 `globalUiLayers`) | 전역 UI 레이어 배열 |
| `scriptType` | `modify_input` \| `modify_output` \| `modify_request` \| `modify_display` |
| `interfaceConfig.gameVariables` | 동적 변수 정의 `{ id, key, label, type, defaultValue }` — 채팅방별 상태 |

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

## 9. `test.md`와의 관계

같은 저장소의 `test.md`는 **Regex + 전역 UI 조합 개념 예시**이고, 이 문서는 **외부 AI에 시킬 때 쓰는 메타 가이드**입니다. 둘 다 참고하면 됩니다.

---

## 10. 주의 (AI 답변 검증용)

- 정규식이 잘못되면 앱이 해당 규칙을 **건너뛴다** (콘솔에만).
- 전역 HTML에 `<script>`를 넣으면 **삭제**된다.
- CSS/길이 제한으로 **잘릴 수 있다**.

이 문서는 앱 동작을 100% 보장하지 않으며, 저장 전에 항상 짧은 문장·한 턴으로 시험할 것.
