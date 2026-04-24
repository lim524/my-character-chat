# components/create 폴더 기능 설명

캐릭터 생성 및 편집 단계에서 사용되는 컴포넌트들입니다.

## 주요 컴포넌트

### `CreateProfileTab.tsx`, `CreateDialogueTab.tsx` 등
- 캐릭터의 기본 프로필, 대화 스타일, 설정 등을 입력하는 각 탭의 UI입니다.

### `CreateLorebookTab.tsx`
- 캐릭터 전용 로어북(세계관 설정)을 관리하는 인터페이스입니다.

### `CreateExtraInterfaceTab.tsx` & `CreateScriptTab.tsx`
- 커스텀 UI(아이콘, 오버레이) 및 캐릭터 레이아웃 설정을 JSON으로 관리합니다.
- 인벤토리, 기타 이미지 오버레이, 캐릭터 레이아웃(크기/위치) 등의 예시 버튼을 제공하여 빠르게 설정을 생성할 수 있습니다.

### `CreateScreenTab.tsx` & `CreateImagesTab.tsx`
- 비주얼 노벨 화면 구성 및 캐릭터 자산(이미지)을 등록하고 관리합니다.
- 각 카테고리별로 등록된 이미지를 한꺼번에 삭제할 수 있는 '전체 삭제' 기능을 제공합니다.

### `ImageAssetCard.tsx`
- 개별 이미지 자산을 표시하고 편집하기 위한 카드 형태의 컴포넌트입니다.
