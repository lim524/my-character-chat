# My Character Chat - 프로젝트 가이드 (종합)

이 파일은 `my-character-chat` 프로젝트의 전체적인 구조와 주요 기능들을 한국어로 요약한 문서입니다. 각 폴더별 상세 내용은 링크된 `.md` 파일을 참조하세요.

## 📁 프로젝트 구조 요약

### 1. [lib](./lib/lib.md)
애플리케이션의 핵심 로직과 유틸리티 함수들이 모여 있습니다.
- **캐릭터 관리**: 카드 임포트, 데이터 호환성 처리.
- **채팅 엔진**: 프롬프트 생성, 로어북 활성화 로직.
- **저장소**: IndexedDB 및 LocalStorage 연동.
- **AI 연동**: Gemini API 등 외부 AI 연동 클라이언트.

### 2. [components](./components/components.md)
UI 구성을 위한 리액트 컴포넌트들입니다.
- **[chat](./components/chat/chat.md)**: 채팅 화면 전용 (입력창, 대화창, VN 레이어, 설정 모달).
- **[create](./components/create/create.md)**: 캐릭터 생성 및 편집 관련 컴포넌트.
- **[settings](./components/settings/settings.md)**: 환경 설정 관련 탭 컴포넌트.
- **기타**: 네비게이션, 메시지 파서, 이미지 업로더 등.

### 3. [pages](./pages/pages.md)
Next.js 기반의 라우팅 및 페이지 정의입니다.
- **[api](./pages/api/api.md)**: 서버 사이드 API 엔드포인트.
- **[chat](./pages/chat/chat.md)**: 실시간 채팅 세션 페이지.
- **기타**: 홈, 캐릭터 목록, 생성 마법사, 마이페이지, 전역 설정.

### 4. [context](./context/context.md)
전역 상태 관리를 위한 React Context들입니다.
- **테마/검색**: UI 테마 및 전역 검색 상태 관리.

### 5. 기타 자산
- **[types](./types/types.md)**: TypeScript 공통 타입 정의.
- **[styles](./styles/styles.md)**: 전역 CSS 스타일시트.

## 🔄 문서 유지보수
코드가 수정되거나 폴더 내에 새로운 기능이 추가될 때, 해당 폴더 이름과 동일한 `.md` 파일(예: `lib/lib.md`)을 항상 최신 상태로 업데이트하여 일관성을 유지합니다.
