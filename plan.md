# 캐릭터 채팅 앱: 사용자 정의 애니메이션 엔진 구현 계획

이 계획서는 사용자가 직접 애니메이션과 동적 연출을 자유롭게 설계할 수 있는 **'데이터 기반 애니메이션 엔진'** 구축을 목표로 합니다. 개발자가 정해놓은 효과를 넘어, 사용자가 JSON과 CSS를 통해 자신만의 게임 화면을 완성할 수 있게 합니다.

---

## 1. 핵심 개념: 사용자 정의 엔진 (User-Defined Engine)
- **개발자 역할:** 애니메이션이 실행될 수 있는 '엔진'과 '트리거'를 제공합니다.
- **사용자 역할:** JSON 설정과 CSS를 통해 애니메이션의 '속도', '방식', '모양'을 직접 정의합니다.

## 2. 주요 기능 및 구현 방안

### ① 전역 CSS 주입 시스템 (Global CSS Injection)
- **기능:** `InterfaceConfig`에 사용자가 직접 CSS를 작성할 수 있는 필드를 추가합니다.
- **활용:** 
  - 사용자가 자신만의 `@keyframes` 애니메이션 정의 (예: `shake-hard`, `glitch-effect`).
  - 특정 UI 요소에 대한 세밀한 스타일링 및 커스텀 폰트 적용.

### ② JSON 기반 Motion 프로퍼티 지원
- **도구:** `framer-motion`
- **방식:** `ExtraInterfaceEntry`의 JSON 구조를 확장하여 `motion` 속성을 직접 받습니다.
- **JSON 예시:**
  ```json
  {
    "id": "heart-icon",
    "motion": {
      "initial": { "scale": 0.5, "opacity": 0 },
      "animate": { "scale": [1, 1.2, 1], "opacity": 1 },
      "transition": { "repeat": "Infinity", "duration": 1.5 }
    }
  }
  ```

### ③ 이벤트 트리거 시스템 (Event Hooks)
- **기능:** 앱 내부의 상태 변화를 애니메이션 실행 신호로 연결합니다.
- **트리거 목록:**
  - `onMessage`: 새 메시지가 도착했을 때.
  - `onCharacterChange`: 캐릭터 스프라이트가 교체될 때.
  - `onBackgroundChange`: 배경 이미지가 바뀔 때.
  - `onLorebookTrigger`: 특정 키워드가 감지되어 로어북이 활성화될 때.
- **활용:** 사용자가 `"onMessage": { "animation": "bounce" }`와 같이 트리거를 직접 매핑.

### ④ 시네마틱 연출 제어
- **타이핑 효과 (Typewriter):** 출력 속도를 사용자가 조절하거나, 특정 구간에서 멈추는 등의 제어권을 부여합니다.
- **화면 효과 (VFX):** `ScreenShake(강도, 지속시간)`와 같은 함수형 명령어를 JSON에서 호출할 수 있게 지원합니다.

## 3. 단계별 실행 계획

### 1단계: 기반 라이브러리 및 CSS 주입 구현
- `framer-motion` 패키지 설치.
- `InterfaceConfig`에 `customCSS` 필드 추가 및 페이지 헤드에 동적 주입 로직 작성.

### 2단계: 모션 엔진 탑재 (Motion Wrapper)
- `ExtraInterfaceOverlay` 등 주요 컴포넌트를 `motion` 컴포넌트로 업그레이드.
- 사용자가 입력한 JSON의 `motion` 객체를 라이브러리 속성으로 자동 연결하는 매퍼(Mapper) 작성.

### 3단계: 이벤트 트리거 및 상태 연동
- 채팅 메시지 수신 및 캐릭터 변경 시 이벤트를 발생시키는 Hook 구현.
- 사용자가 설정한 트리거 조건에 따라 애니메이션이 즉각 반응하도록 연동.

### 4단계: 프리셋 및 가이드 제공
- 사용자가 참고할 수 있는 애니메이션 프리셋(Fade, Slide, Shake 등) 샘플 라이브러리 배포.
- 설정 화면 내 실시간 미리보기 기능 강화.

---

> [!IMPORTANT]
> 이 방식은 사용자가 시스템의 코드를 직접 수정하지 않고도, **설정 파일(JSON/CSS)만으로 앱 전체의 연출을 완전히 바꿀 수 있게 하는 것**이 핵심입니다.
