# 예시: 상태창 전역 인터페이스 (HTML / CSS / JavaScript) + 게임 변수

채팅 **게임 변수** 탭에 아래 키들을 정의하고, 응답 끝에 `[game_state]{ "키": 값 }[/game_state]` 로 갱신하면 `{{키}}` 가 치환됩니다.  
전역 UI(앱 설정 또는 캐릭터 `globalUiLayers`)에 **HTML / CSS / JavaScript** 필드에 각각 붙여 넣으면 됩니다.  
(HTML 안에는 `<script>` 를 쓰지 말고, 스크립트는 **JavaScript** 필드만 사용합니다.)

---

## 1. 게임 변수 정의 (복사용)

| key | type | label (표시용) | defaultValue |
|-----|------|----------------|--------------|
| `hp` | number | HP | 100 |
| `mp` | number | MP | 50 |
| `max_hp` | number | 최대 HP | 100 |
| `max_mp` | number | 최대 MP | 50 |
| `gold` | number | 골드 | 0 |
| `location` | string | 위치 | 알 수 없는 곳 |

백그라운드 임베딩/시나리오에 **한 번** 넣을 문장 예:

```text
매 턴 대사/묘사가 끝난 뒤, 응답 맨 끝에만 아래 형식으로 방 상태를 갱신한다. 키는 캐릭터에 정의된 것만 사용한다.
[game_state]
{ "hp": 100, "mp": 40, "max_hp": 100, "max_mp": 50, "gold": 120, "location": "엘프 숲 입구" }
[/game_state]
```

---

## 2. HTML (전역 UI — `html` 필드)

```html
<div class="mcc-status-hud" data-mcc-hud>
  <div class="mcc-status-hud__title">상태</div>
  <div class="mcc-status-hud__row">
    <span class="mcc-status-hud__label">위치</span>
    <span class="mcc-status-hud__value mcc-status-hud__value--wide">{{location}}</span>
  </div>
  <div class="mcc-status-hud__row">
    <span class="mcc-status-hud__label">HP</span>
    <div class="mcc-status-hud__bar">
      <div class="mcc-status-hud__fill mcc-status-hud__fill--hp" style="width: calc(100% * ({{hp}}) / max(1, {{max_hp}}))"></div>
    </div>
    <span class="mcc-status-hud__nums">{{hp}} / {{max_hp}}</span>
  </div>
  <div class="mcc-status-hud__row">
    <span class="mcc-status-hud__label">MP</span>
    <div class="mcc-status-hud__bar">
      <div class="mcc-status-hud__fill mcc-status-hud__fill--mp" style="width: calc(100% * ({{mp}}) / max(1, {{max_mp}}))"></div>
    </div>
    <span class="mcc-status-hud__nums">{{mp}} / {{max_mp}}</span>
  </div>
  <div class="mcc-status-hud__row">
    <span class="mcc-status-hud__label">골드</span>
    <span class="mcc-status-hud__value">{{gold}} G</span>
  </div>
</div>
```

- `{{location}}` 등은 서버/클라이언트가 **이스케이프된 문자열**로 넣으므로, 위치에 특수문자가 있어도 안전합니다.
- 막대 비율은 `style` 안의 `{{hp}}` / `{{max_hp}}` 치환으로 계산됩니다. 값은 숫자형 변수를 권장합니다.

---

## 3. CSS (전역 UI — `css` 필드)

```css
.mcc-status-hud {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 50;
  min-width: 220px;
  max-width: min(92vw, 320px);
  padding: 12px 14px;
  border-radius: 12px;
  background: linear-gradient(145deg, rgba(20, 24, 32, 0.92), rgba(12, 16, 24, 0.88));
  border: 1px solid rgba(120, 180, 255, 0.25);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  font-family: ui-sans-serif, system-ui, "Segoe UI", sans-serif;
  font-size: 13px;
  color: rgba(235, 240, 255, 0.95);
  pointer-events: auto;
}

.mcc-status-hud__title {
  font-weight: 700;
  letter-spacing: 0.06em;
  font-size: 11px;
  text-transform: uppercase;
  color: rgba(160, 190, 255, 0.85);
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.mcc-status-hud__row {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  align-items: center;
  gap: 8px 10px;
  margin-bottom: 8px;
}
.mcc-status-hud__row:last-child {
  margin-bottom: 0;
}

.mcc-status-hud__label {
  font-size: 11px;
  color: rgba(200, 210, 230, 0.7);
}

.mcc-status-hud__value {
  grid-column: 2 / -1;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.mcc-status-hud__value--wide {
  grid-column: 2 / -1;
  text-align: right;
  font-size: 12px;
  line-height: 1.35;
  color: rgba(220, 230, 255, 0.95);
}

.mcc-status-hud__bar {
  grid-column: 2;
  height: 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.35);
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.4);
}

.mcc-status-hud__fill {
  height: 100%;
  border-radius: 999px;
  max-width: 100%;
  transition: width 0.35s ease, background 0.3s ease;
}
.mcc-status-hud__fill--hp {
  background: linear-gradient(90deg, #2d7a4a, #4ade80);
}
.mcc-status-hud__fill--mp {
  background: linear-gradient(90deg, #1d4e8f, #60a5fa);
}

.mcc-status-hud__nums {
  grid-column: 3;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: rgba(200, 210, 230, 0.9);
  white-space: nowrap;
}

/* JavaScript가 HP 낮을 때 붙이는 클래스 */
.mcc-status-hud--danger {
  border-color: rgba(248, 113, 113, 0.55);
  box-shadow: 0 0 0 1px rgba(248, 113, 113, 0.2), 0 8px 32px rgba(0, 0, 0, 0.45);
  animation: mcc-hud-pulse 1.2s ease-in-out infinite;
}
.mcc-status-hud--danger .mcc-status-hud__fill--hp {
  background: linear-gradient(90deg, #7f1d1d, #f87171);
}

@keyframes mcc-hud-pulse {
  0%,
  100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.12);
  }
}
```

---

## 4. JavaScript (전역 UI — `javascript` 필드)

`GlobalUiLayersRuntime` 는 이 코드를 `new Function` 으로 실행합니다. **정리 함수**를 반환하면 레이어가 바뀔 때 호출됩니다.

```javascript
return (function () {
  var LOW_HP = 20

  function onGameVars(e) {
    var d = e.detail || {}
    var hp = Number(d.hp)
    if (!Number.isFinite(hp)) return
    var root = document.querySelector('[data-mcc-hud]')
    if (!root) return
    root.classList.toggle('mcc-status-hud--danger', hp > 0 && hp < LOW_HP)
  }

  window.addEventListener('game-variables-updated', onGameVars)

  return function () {
    window.removeEventListener('game-variables-updated', onGameVars)
  }
})()
```

- 앱이 `game-variables-updated` 이벤트에 **현재 맵 전체**를 `detail` 로 넣으므로, 위 스크립트는 HP만 보고 위험 스타일을 토글합니다.

---

## 5. AI 출력 예시 (`[game_state]`)

```text
엘프 병사가 활시위를 당긴다. 숲 사이로 바람이 스친다.

[game_state]
{
  "hp": 72,
  "mp": 33,
  "max_hp": 100,
  "max_mp": 50,
  "gold": 145,
  "location": "숲길 — 매복 지점"
}
[/game_state]
```

이 블록은 클라이언트에서 파싱된 뒤 **대화창 텍스트에서는 제거**되고, 정의된 키만 방(채팅방) 상태에 저장된 뒤 `{{...}}` 치환에 사용됩니다.
