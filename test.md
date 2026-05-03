# 전역 인터페이스 × Regex 조합 예시 (참고용)

이 문서는 **앱 코드를 바꾸지 않고**, 현재 제공되는 기능만으로 시도할 수 있는 **설정 예시 모음**입니다.  
실제 동작은 브라우저·렌더 순서·이스케이프에 따라 달라질 수 있으니, 항상 소량으로 테스트하세요.

---

## 1. 역할 정리

| 구분 | 위치 | 하는 일 (요약) |
|------|------|------------------|
| **Regex Script** | 캐릭터 생성 → **스크립트** 탭, `interfaceConfig.regexScripts` | 단계(`scriptType`)마다 문자열에 정규식 치환 적용 |
| **전역 인터페이스** | 설정 또는 생성 → **전역 UI (HTML/CSS/JS)** | 앱 전체에 CSS 주입, 고정 HTML 레이어, (선택) JavaScript |
| **채팅 본문 표시** | `MessageParser` | `modify_display` 단계는 **`normalizeImageControlTags` 안에서** 적용된 뒤, `**`/`*` 마크다운 등으로 렌더 |

Regex 타입(앱 라벨 기준):

- `modify_input` — 사용자 입력
- `modify_output` — 모델이 방금 만든 **어시스턴트 한 턴**의 텍스트(전송/저장에도 영향이 갈 수 있음)
- `modify_request` — API로 보내는 요청 본문
- `modify_display` — **화면에만** 쓰는 표시용 문자열(이미지 태그 정규화 직전에도 동일 phase가 사용됨)

**전역 인터페이스 JS**는 채팅 state와 **기본 연결되어 있지 않습니다**. 아래 예시 중 “DOM 감시” 류는 가능은 하지만 깨지기 쉬운 **우회**입니다.

---

## 2. 조합 패턴 A — Regex만으로 “깔끔한 대사창”

**목표:** 모델이 자주 쓰는 쓰레기 토큰, 중복 태그, OOC 메모를 대화창에서만 지운다.

| 이름 | scriptType | pattern (예시) | replacement |
|------|----------------|----------------|-------------|
| OOC 제거 | `modify_display` | `\s*\[OOC\][\s\S]*?\[/OOC\]\s*` | (빈 문자열) |
| 연속 빈 줄 축소 | `modify_display` | `\n{3,}` | `\n\n` |

**포인트:** `modify_display`는 표시 경로에만 타므로, **저장된 원문을 건드리지 않게** 하려면 정책을 통일하는 게 좋습니다(앱 버전에 따라 저장 타이밍이 다를 수 있음).

---

## 3. 조합 패턴 B — Regex + 전역 CSS (대화창 “게임 톤”)

**목표:** 모델에게 `**중요대사**`, `*나레이션*` 형식을 쓰게 유도하고, 전역 CSS로 색·글자 크기를 덮어쓴다.

`MessageParser`는 `**텍스트**` → `<strong class="font-bold text-blue-400">`, `*텍스트*` → `<em class="opacity-65 not-italic">` 로 렌더합니다.

**전역 인터페이스 → CSS 예시:**

```css
/* 어시스턴트 말풍선 안 강조 — 선택자는 실제 DOM에 맞게 조정 */
.font-bold.text-blue-400 {
  color: #fde68a !important;
  text-shadow: 0 0 12px rgba(250, 204, 21, 0.35);
}

em.opacity-65 {
  color: #94a3b8 !important;
  font-size: 0.95em;
  letter-spacing: 0.02em;
}
```

**Regex 예시(유도):** 모델이 자꾸 한 줄로만 쓸 때, `modify_display`로 문단 앞에 빈 줄을 넣는 등(프로젝트·모델에 따라 조정).

---

## 4. 조합 패턴 C — `modify_output`으로 태그·각오 문구 고정

**목표:** 매 턴 끝에 배경·캐릭터 태그가 빠지지 않게, **출력 문자열에만** 안전하게 덧붙이기(과하면 부자연스러우니 시나리오와 함께 조절).

| 이름 | scriptType | pattern | replacement (개념) |
|------|------------|---------|---------------------|
| 문단 끝 태그 보강 | `modify_output` | `$(?!.)` 또는 마지막 줄만 타게 하는 패턴 | 원문 + `\n<img=배경ID:background>\n<img=캐릭터ID>` |

**주의:** `$`는 다줄 문자열에서 “문서 끝” 한 번만 매칭됩니다. 에셋 ID는 실제 등록 ID와 일치해야 합니다.

---

## 5. 조합 패턴 D — 전역 HTML/CSS로 “고정 HUD”, Regex로 본문 정리

**목표:** 상단·하단에 항상 보이는 프레임(HP 바 자리, 로고 자리 등)은 **전역 인터페이스 HTML**로 깔고, 대사 중 노이즈만 Regex로 제거.

- **전역 인터페이스 HTML:** 빈 `div` 래퍼 + 고정 `position` 레이아웃만 두고, 텍스트는 비워 둔 채 CSS로 테두리·그라데이션만 연출.
- **Regex:** `modify_display`로 시스템 프롬프트 누설 패턴 삭제 등.

이 패턴은 **“AI 한 줄이 HUD 텍스트를 직접 갱신”**하지는 않습니다. 텍스트 HUD까지 쓰려면 나중에 앱에서 채팅 이벤트와 연결하는 편이 안전합니다.

---

## 6. 조합 패턴 E — 전역 JS (실험적): DOM에서 마지막 어시스턴트 블록만 감시

**목표:** “대화창에 나온 특정 패턴을 복사해 상단 배너에 붙인다” 같은 **비공식** 연동.

개념 예시(실제 선택자는 개발자 도구로 확인 필요):

```javascript
(function () {
  const banner = document.getElementById('custom-global-banner')
  if (!banner) return function () {}

  const observer = new MutationObserver(() => {
    const last = document.querySelector('[data-role="assistant-last"]') /* 예시: 실제 구조 없음 */
    if (!last) return
    const m = last.textContent?.match(/\[나레이션\]\s*([\s\S]+?)\s*\[\/나레이션\]/)
    if (m) banner.textContent = m[1].trim()
  })

  observer.observe(document.body, { childList: true, subtree: true })
  return () => observer.disconnect()
})()
```

**한계:** 채팅 마크업 클래스가 바뀌면 깨집니다. 위 `data-role` 같은 속성은 **현재 앱에 없을 수 있음** — 반드시 실제 DOM에 맞춰 수정해야 합니다.

---

## 7. 트레일링 JSON (앱 자체 동작 참고)

`MessageParser`는 메시지 **맨 끝**에 단일 JSON 객체 `{ ... }` 가 오면 표시에서 잘라 냅니다.  
게임 수치용으로 모델에게 JSON을 붙이게 했다면, Regex로 포맷을 맞추거나 `modify_display`로 아예 사용자에게 안 보이게 정리할 수 있습니다.

---

## 8. 체크리스트 (설정만으로 할 때)

1. Regex는 **JavaScript 정규식** 문법 — 백슬래시 이스케이프 주의 (`\\d` 등).
2. `modify_display` ↔ `modify_output` 구분: 저장·재생 일관성을 위해 용도를 나누기.
3. 전역 CSS는 `sanitizeCustomCss` 길이 제한이 있음 — 길면 잘림.
4. 전역 HTML의 `<script>`는 저장 시 제거되므로 **스크립트는 JavaScript 칸**에 작성.

---

## 9. 정리

- **안정적인 연동:** 에셋 ID + `<img=` 규칙 + 시나리오/로어 + Regex(`modify_display`/`modify_output`).
- **전역 인터페이스:** 레이아웃·테마·실험적 DOM 스크립트.
- **“조건 나오면 전역 레이어 문구 갱신”**까지 **설정만**으로 완성하기는 어렵고, 패턴 E는 예시 수준의 우회입니다.

이 파일(`test.md`)은 예시 모음이며, 빌드·런타임에 자동으로 읽히지 않습니다.
