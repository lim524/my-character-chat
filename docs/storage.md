# 저장소·입출력 (RisuAI 대비)

## 진실의 원천(SoT)

- 앱 내부에서 캐릭터의 정본은 **`LocalCharacter` + `InterfaceConfig`** ([`lib/localStorage.ts`](../lib/localStorage.ts), [`lib/interfaceConfig.ts`](../lib/interfaceConfig.ts)) 입니다.
- 브라우저에는 IndexedDB 단일 KV 스토어([`lib/idbKV.ts`](../lib/idbKV.ts))에 JSON 문자열로 기록됩니다.

## RisuAI와의 비교 (요약)

| 영역 | RisuAI | my-character-chat |
|------|--------|---------------------|
| 구조화 DB | msgpack + 압축 + 블록 인코딩 (`risuSave`) | JSON 문자열 (`local-characters` 키 등) |
| 큰 바이너리 | 에셋 블롭 분리·해시 | `mcc-blob:*` 별도 키로 분리(마이그레이션·저장 시) |
| 교환 | PNG / JSON 카드 / CharX ZIP 등 | Character Card V2/V3 호환 JSON + 확장 필드, CharX·PNG(선택) |

## 비목표

- **Risu `.risudat` / 네이티브 RisuSave 바이너리와의 호환**은 범위에 두지 않습니다 (스펙·버전 추적 비용 대비 이득이 작음).

## 교환 포맷

- **JSON 카드**: SillyTavern 등과 맞추기 쉬운 필드(`name`, `description`, `personality`, `scenario`, `first_mes` 등) + 앱 전용 확장 `data.extensions.my_character_chat` (또는 동등 구조)에 `interfaceConfig`, `details`, 기타 필드 보관. 구현: [`lib/characterCardInterop.ts`](../lib/characterCardInterop.ts).
- **CharX**: ZIP 내 `card.json` + `assets/` — [`lib/charxImport.ts`](../lib/charxImport.ts).
- **PNG**: `chara` / `ccv3` 등 메타 청크 — [`lib/pngCardImport.ts`](../lib/pngCardImport.ts).
- **라우팅**: [`lib/cardImportRouter.ts`](../lib/cardImportRouter.ts) (확장자·시그니처로 분기).
- **블롭 분리**: [`lib/characterBlobStorage.ts`](../lib/characterBlobStorage.ts), [`lib/idbKV.ts`](../lib/idbKV.ts) `kvRemoveByPrefix`.

## API 요청 본문

- Vercel 등의 요청 크기 제한을 피하기 위해 `/api/chat` 전송 시 `data:` URL 제거: [`lib/stripDataUrlsForApi.ts`](../lib/stripDataUrlsForApi.ts) (내부 저장 구조와 별개).

## 에셋 블롭 키

- 형식: `mcc-blob:{characterId}:{slot}` (`slot` 예: `profile`, `emotion-{id}`, `asset-{id}`).
- 캐릭터 삭제 시 해당 ID 접두사 키 일괄 삭제.
