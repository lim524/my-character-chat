# pages/api 폴더 기능 설명

서버 사이드 로직을 처리하는 API 엔드포인트들입니다.

## 주요 API

### `chat.ts`
- 통합 채팅 처리 엔드포인트입니다. 모델 선택, 프롬프트 생성, 응답 스트리밍을 총괄합니다.

### `claude.ts` / `gemini.ts`
- 특정 AI 모델(Anthropic Claude, Google Gemini)과의 직접 통신을 위한 엔드포인트입니다.

### `generate-image.ts`
- AI를 사용하여 캐릭터 자산이나 배경 이미지를 생성하는 요청을 처리합니다.

### `hello.ts`
- API 작동 확인을 위한 샘플 엔드포인트입니다.
