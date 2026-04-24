# lib 폴더 기능 설명

이 폴더는 애플리케이션의 핵심 로직과 유틸리티 함수들을 포함하고 있습니다.

## 주요 파일 및 기능

### `appSettings.ts`
- 애플리케이션 전역 설정(API 키, 모델 구성, UI 설정 등)을 관리합니다.
- 설정을 로컬 저장소에 저장하거나 불러오는 기능을 담당합니다.

### `cardImportRouter.ts`
- 다양한 캐릭터 카드 형식(PNG, JSON 등)을 감지하고 적절한 임포터로 연결해줍니다.

### `characterBlobStorage.ts`
- IndexedDB 또는 로컬 저장소를 사용하여 캐릭터 이미지 및 자산(Asset)의 저장과 검색을 관리합니다.

### `characterCardInterop.ts`
- SillyTavern, V2 카드 등 서로 다른 캐릭터 카드 표준 간의 호환성을 제공하고 데이터를 표준화합니다.

### `charxImport.ts`
- `.charx` 파일 형식의 캐릭터 임포트를 전담 처리합니다.

### `chatPromptContext.ts`
- 대화 기록, 로어북 항목, 시스템 프롬프트 등을 결합하여 AI 모델에 보낼 최종 프롬프트를 구성합니다.

### `externalImportUtils.ts`
- 외부 소스나 다양한 포맷으로부터 데이터를 가져오는 유틸리티 모음입니다.

### `gemini.ts`
- Google Gemini API와의 통신을 담당하는 클라이언트입니다.

### `idbKV.ts`
- IndexedDB를 키-값(Key-Value) 형태로 쉽게 사용할 수 있게 해주는 래퍼 라이브러리입니다.

### `interfaceConfig.ts` & `interfaceRuntime.ts`
- AI가 제어할 수 있는 동적 UI 레이어인 "Extra Interface"의 설정과 런타임 로직을 관리합니다.

### `localStorage.ts`
- 브라우저 LocalStorage 접근을 위한 유틸리티 함수들입니다.

### `lorebookActivation.ts`
- 채팅 메시지를 스캔하여 키워드에 맞는 로어북(Lorebook) 항목을 활성화하는 로직입니다.

### `pngCardImport.ts`
- PNG 이미지 내에 숨겨진 캐릭터 메타데이터(스테가노그래피)를 추출하는 기능을 담당합니다.

### `vnDialogPagination.ts`
- 긴 AI 응답을 비주얼 노벨 스타일의 화면에 맞게 여러 페이지로 나누는 로직입니다.

### `vnDialogueStyles.ts`
- 비주얼 노벨 인터페이스에서 사용하는 스타일 상수 및 설정입니다.
