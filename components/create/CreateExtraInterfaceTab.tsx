import { Fragment, type Dispatch, type SetStateAction } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import type { ExtraInterfaceEntry, InterfaceConfig } from '@/lib/interfaceConfig'

const exampleJson = `{
  "icons": [
    { "id": "bag", "label": "가방", "position": "bottom-right", "lucide": "Backpack", "toggleMenuId": "inventory" },
    { "id": "sword", "label": "강철검", "position": "bottom-right", "lucide": "Sword", "parentId": "inventory" },
    { "id": "potion", "label": "체력포션", "position": "bottom-right", "lucide": "FlaskConical", "parentId": "inventory" },
    { "id": "coins", "label": "100 Gold", "position": "bottom-right", "lucide": "Coins", "parentId": "inventory" }
  ],
  "overlays": []
}`

const otherImagesExampleJson = `{
  "icons": [
    {
      "id": "map_button",
      "label": "지도",
      "position": "top-right",
      "lucide": "Map",
      "triggerOverlayId": "world_map_overlay"
    }
  ],
  "overlays": [
    {
      "id": "world_map_overlay",
      "assetId": "map_asset_id_here",
      "position": "center",
      "style": { "width": "92vw", "height": "84vh", "opacity": 0.95 }
    }
  ],
  "visibility": { "dialogue": true, "character": true, "background": true }
}`

const characterLayoutExampleJson = `{
  "characterLayout": {
    "liftPx": 128,
    "scale": 1.1,
    "heightVh": 50,
    "maxWidthPx": 450,
    "multi": {
      "sideBySide": true,
      "gapPx": 30,
      "align": "end",
      "justify": "center"
    }
  }
}`


const characterLayoutImplementationRef = `【적용 흐름】
extraInterfaceEntries[].json → parseMergedCharacterLayoutFromExtraEntries → 채팅 pages/chat/[id].tsx 스프라이트 레이어 + MessageParser 다중 URL

──────── lib/interfaceRuntime.ts (저장소와 동일) ────────
export function parseMergedCharacterLayoutFromExtraEntries(
  entries: ExtraInterfaceEntry[] | undefined
): ExtraInterfaceCharacterLayout {
  let merged: ExtraInterfaceCharacterLayout = {}
  if (!entries?.length) return merged
  for (const e of entries) {
    const raw = e.json?.trim()
    if (!raw) continue
    try {
      const data = JSON.parse(raw) as { characterLayout?: ExtraInterfaceCharacterLayout }
      const cl = data.characterLayout
      if (!cl || typeof cl !== 'object') continue
      merged = {
        ...merged,
        ...cl,
        multi: mergeMulti(merged.multi, cl.multi),
      }
    } catch {
      // invalid JSON
    }
  }
  return merged
}

export function effectiveCharacterLiftPx(
  interfaceLift: number | undefined,
  extra: ExtraInterfaceCharacterLayout
): number {
  const fromExtra = extra.liftPx
  if (typeof fromExtra === 'number' && Number.isFinite(fromExtra)) {
    return Math.min(400, Math.max(0, fromExtra))
  }
  return Math.min(400, Math.max(0, interfaceLift ?? 0))
}

──────── pages/chat/[id].tsx (핵심 변수·스타일) ────────
const characterLayout = useMemo(
  () => parseMergedCharacterLayoutFromExtraEntries(
    characterInfo?.interfaceConfig?.extraInterfaceEntries),
  [characterInfo?.interfaceConfig?.extraInterfaceEntries])

const effectiveLiftPx = useMemo(
  () => effectiveCharacterLiftPx(undefined, characterLayout),
  [characterLayout])

const sideBySide = !!(multi?.sideBySide && nSprites > 1)
const gapPx = … // multi.gapPx 또는 기본 12
const spriteScale = … // characterLayout.scale 클램프 0.35~2
// 스프라이트 영역: style={{ bottom: effectiveLiftPx }}
// 바깥 래퍼: transform: spriteScale !== 1 ? \`scale(\${spriteScale})\` : undefined, transformOrigin: 'bottom center'
// 나란히: display: 'grid', gridTemplateColumns: \`repeat(\${gridColumnCount}, minmax(0, 1fr))\`, gap: gapPx,
//         justifyContent / alignItems ← multi.justify, multi.align 매핑
// 각 셀 maxWidth: maxWidthPx만 → min(px, 96vw); maxWidthVw만 → Nvw; 둘 다 → min(px, Nvw)
// 내부 박스: max-w-[min(36rem,calc(100vw-2rem))], heightVh 시 maxHeight에 dvh로 모바일 안전 여백

──────── components/MessageParser.tsx ────────
캐릭터 태그마다 detectedCharUrls.push(asset.url)
useEffect에서 onCharacterSpritesChange?.([...detectedCharUrls])`

export function CreateExtraInterfaceTab({
  iface,
  patchInterface,
  expandedExtraInterfaceId,
  setExpandedExtraInterfaceId,
}: {
  iface: InterfaceConfig
  patchInterface: (patch: Partial<InterfaceConfig>) => void
  expandedExtraInterfaceId: string | null
  setExpandedExtraInterfaceId: Dispatch<SetStateAction<string | null>>
}) {
  const entries = iface.extraInterfaceEntries ?? []

  const setEntries = (next: ExtraInterfaceEntry[]) => {
    patchInterface({ extraInterfaceEntries: next })
  }

  const addEntry = () => {
    const row: ExtraInterfaceEntry = {
      id: uuidv4(),
      name: `설정 ${entries.length + 1}`,
      json: '{\n  "icons": [],\n  "characterLayout": {}\n}',
    }
    setEntries([...entries, row])
    setExpandedExtraInterfaceId(row.id)
  }

  const updateEntry = (id: string, patch: Partial<ExtraInterfaceEntry>) => {
    setEntries(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  const removeEntry = (id: string) => {
    if (!window.confirm('이 항목을 삭제할까요?')) return
    setEntries(entries.filter((e) => e.id !== id))
    if (expandedExtraInterfaceId === id) setExpandedExtraInterfaceId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="block font-semibold">추가 인터페이스 설정</label>
        <button
          type="button"
          onClick={addEntry}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#444] text-xs hover:border-white"
        >
          <Plus size={14} /> 항목 추가
        </button>
      </div>
      <p className="text-[11px] text-gray-400 leading-relaxed">
        채팅·게임 화면에 올릴 <b>아이콘, 버튼, 오버레이</b> 등을 JSON으로 정의합니다.{' '}
        아이콘에 <code className="text-[10px] text-cyan-300/90">triggerOverlayId</code> 또는{' '}
        <code className="text-[10px] text-cyan-300/90">triggerAssetId</code>를 넣으면 클릭으로 오버레이를 토글할 수 있습니다.{' '}
        <b className="text-gray-300">characterLayout</b>으로 스프라이트 <b>위치(liftPx)</b>,{' '}
        <b>크기(scale, heightVh, maxWidthPx·maxWidthVw)</b>를 조정할 수 있습니다. 화면이 좁으면{' '}
        <code className="text-[10px] text-pink-300/90">maxWidthPx</code>는 자동으로{' '}
        <code className="text-[10px] text-pink-300/90">96vw</code> 이하로 줄고,{' '}
        <code className="text-[10px] text-pink-300/90">maxWidthVw</code>로 비율 제한을 줄 수도 있습니다. 한 메시지에{' '}
        <code className="text-[10px] text-pink-300/90">&lt;img=…&gt;</code> 캐릭터 태그가 여러 개일 때{' '}
        <b>multi.sideBySide</b> 등으로 <b>옆으로 나열·줄바꿈(maxPerRow)</b>할 수 있습니다. 행을 눌러 JSON을 펼쳐
        편집하세요. (항목이 여러 개면 뒤쪽 JSON이 앞쪽 characterLayout을 덮어씁니다.)
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const row: ExtraInterfaceEntry = {
              id: uuidv4(),
              name: '예시: 인벤토리 가방',
              json: exampleJson,
            }
            if (entries.length > 0 && !window.confirm('예시 항목을 목록에 추가할까요?')) return
            setEntries([...entries, row])
            setExpandedExtraInterfaceId(row.id)
          }}
          className="px-2 py-1 rounded border border-[#444] text-[11px] hover:border-white hover:bg-[#1a1a1a]"
        >
          인벤토리 예시
        </button>
        <button
          type="button"
          onClick={() => {
            const row: ExtraInterfaceEntry = {
              id: uuidv4(),
              name: '예시: 기타 이미지 오버레이',
              json: otherImagesExampleJson,
            }
            if (entries.length > 0 && !window.confirm('오버레이 예시 항목을 추가할까요?')) return
            setEntries([...entries, row])
            setExpandedExtraInterfaceId(row.id)
          }}
          className="px-2 py-1 rounded border border-[#444] text-[11px] hover:border-white hover:bg-[#1a1a1a]"
        >
          기타 이미지 예시
        </button>
        <button
          type="button"
          onClick={() => {
            const row: ExtraInterfaceEntry = {
              id: uuidv4(),
              name: '예시: 캐릭터 레이아웃',
              json: characterLayoutExampleJson,
            }
            if (entries.length > 0 && !window.confirm('캐릭터 레이아웃 예시 항목을 추가할까요?')) return
            setEntries([...entries, row])
            setExpandedExtraInterfaceId(row.id)
          }}
          className="px-2 py-1 rounded border border-[#444] text-[11px] hover:border-white hover:bg-[#1a1a1a]"
        >
          캐릭터 레이아웃 예시
        </button>
      </div>

      <details className="rounded-lg border border-[#333] bg-[#0f0f12] px-3 py-2">
        <summary className="cursor-pointer text-[11px] font-semibold text-gray-300 select-none">
          characterLayout 이 채팅에 적용되는 실제 코드 경로·발췌 (참고)
        </summary>
        <pre className="mt-2 max-h-[min(70vh,28rem)] overflow-auto text-[10px] leading-snug text-gray-400 whitespace-pre-wrap font-mono border-t border-[#222] pt-2">
          {characterLayoutImplementationRef}
        </pre>
      </details>

      <div className="border border-[#333] rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-[#111] text-gray-400">
            <tr>
              <th className="w-8 px-2 py-2 text-left" />
              <th className="px-2 py-2 text-left min-w-[100px]">이름</th>
              <th className="w-10 px-2 py-2 text-right" />
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-gray-500">
                  항목이 없습니다. &quot;항목 추가&quot;로 JSON 블록을 만드세요.
                </td>
              </tr>
            ) : (
              entries.map((e) => {
                const open = expandedExtraInterfaceId === e.id
                return (
                  <Fragment key={e.id}>
                    <tr
                      onClick={() => setExpandedExtraInterfaceId((p) => (p === e.id ? null : e.id))}
                      className={`border-t border-[#222] cursor-pointer hover:bg-[#111] ${open ? 'bg-[#0f0f12]' : ''}`}
                    >
                      <td className="px-2 py-2 align-middle text-gray-500">
                        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </td>
                      <td className="px-2 py-2" onClick={(ev) => ev.stopPropagation()}>
                        <input
                          value={e.name}
                          onChange={(ev) => updateEntry(e.id, { name: ev.target.value })}
                          className="w-full bg-[#111] border border-[#333] rounded px-2 py-1"
                          placeholder="블록 이름"
                        />
                      </td>
                      <td className="px-2 py-2 text-right" onClick={(ev) => ev.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => removeEntry(e.id)}
                          className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                          title="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-t border-[#222] bg-[#0b0b0f]">
                        <td colSpan={3} className="px-3 py-3" onClick={(ev) => ev.stopPropagation()}>
                          <label className="block text-[10px] text-gray-500 mb-1">JSON</label>
                          <textarea
                            value={e.json}
                            onChange={(ev) => updateEntry(e.id, { json: ev.target.value })}
                            className="w-full min-h-[200px] bg-[#090909] border border-[#333] rounded px-3 py-2 text-xs font-mono text-gray-200"
                            placeholder={exampleJson}
                            spellCheck={false}
                          />
                          <p className="text-[10px] text-gray-600 mt-1">
                            유효한 JSON인지는 저장 시 검사하지 않습니다. 키 구조는 클라이언트 구현에 맞추면 됩니다.
                          </p>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
