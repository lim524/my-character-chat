# components/chat 폴더 기능 설명

채팅 인터페이스 전용 컴포넌트들이 모여 있습니다.

## 주요 컴포넌트

### `ChatAssetPicker.tsx`
- 캐릭터의 표정이나 배경 이미지 등을 선택하여 채팅창에 삽입할 수 있는 도구입니다.

### `ChatDialoguePanel.tsx`
- 실제 대화 내용이 표시되는 영역입니다. 일반 채팅 로그와 비주얼 노벨(VN) 스타일 오버레이를 모두 지원합니다.

### `ChatHeaderBar.tsx`
- 채팅 화면 상단바이며, 캐릭터 정보와 메뉴 접근 버튼을 포함합니다.

### `ChatInputBar.tsx`
- 메시지 입력창입니다. 멀티라인 입력, 자산 삽입, 메시지 전송 기능을 제공합니다.

### `ChatLogModal.tsx`
- 전체 대화 기록을 원문 그대로 확인하고 관리할 수 있는 모달입니다.

### `ChatModelModal.tsx`
- 현재 채팅에 사용할 AI 모델을 선택하고 세부 설정을 변경하는 모달입니다.

### `ChatSaveLoadModal.tsx`
- 채팅 세션의 저장 및 불러오기 기능을 담당합니다.

### `ChatSettingsModal.tsx`
- 현재 채팅 세션에 특화된 설정(캐릭터별 오버라이드 등)을 관리합니다.

### `ChatStatsOverlay.tsx`
- 사용된 토큰 수 등 채팅 세션의 통계를 보여줍니다.

### `ChatVnLayer.tsx`
- 비주얼 노벨 스타일의 캐릭터 스프라이트와 배경을 렌더링하는 레이어입니다.
