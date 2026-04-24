import type { CharacterDraft, InterfaceConfig } from '@/lib/interfaceConfig'
import type { Dispatch, SetStateAction } from 'react'

export function CreateScreenTab({
  draft,
  patchDraft,
  iface,
  patchInterface,
  uiThemeJsonText,
  setUiThemeJsonText,
}: {
  draft: CharacterDraft
  patchDraft: (patch: Partial<CharacterDraft>) => void
  iface: InterfaceConfig
  patchInterface: (patch: Partial<InterfaceConfig>) => void
  uiThemeJsonText: string
  setUiThemeJsonText: Dispatch<SetStateAction<string>>
}) {
  const bgAssets = iface.assets.filter((a) => a.type === 'background')
  const charAssets = iface.assets.filter((a) => a.type === 'character')

  return (
    <div className="space-y-4">
      <label className="block font-semibold">초기 화면 설정</label>
      <p className="text-[11px] text-gray-400 leading-relaxed mb-4">
        채팅 화면에 처음 진입했을 때 보여줄 배경 이미지와 캐릭터 스탠딩을 설정합니다. 이 설정은 AI와의 대화 시작 전에
        자동으로 적용됩니다.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold">시작 배경</label>
          <select
            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e45463]"
            value={((draft.details as Record<string, unknown>)?.initialBackground as string) || ''}
            onChange={(e) =>
              patchDraft({ details: { ...(draft.details as Record<string, unknown>), initialBackground: e.target.value } })
            }
          >
            <option value="">(기본 배경)</option>
            {bgAssets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label || a.id}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">시작 캐릭터 (가운데)</label>
          <select
            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e45463]"
            value={((draft.details as Record<string, unknown>)?.initialCharacter as string) || ''}
            onChange={(e) =>
              patchDraft({ details: { ...(draft.details as Record<string, unknown>), initialCharacter: e.target.value } })
            }
          >
            <option value="">(표시 안 함)</option>
            {charAssets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label || a.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg bg-[#0d0d10] border border-[#333] p-3 text-[11px] text-gray-300 mt-4">
        <p className="font-medium text-blue-300 mb-1">💡 이미지 연출 가이드</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>배경/캐릭터:</strong> 선택 시 채팅방 진입과 동시에 자동으로 나타납니다.</li>
          <li><strong>기타 이미지(UI):</strong> AI가 대화 중 필요한 이미지를 스스로 판단하여 화면 중앙에 크게 띄워줍니다.</li>
        </ul>
      </div>

      <div className="pt-6 border-t border-[#222]">
        <label className="block font-semibold mb-1">대화창 UI 테마 커스텀</label>
        <p className="text-[11px] text-gray-400 mb-2">
          대화창의 색상, 투명도, 둥글기 등을 JSON 형식으로 자유롭게 설정하세요.
        </p>
        <textarea
          value={
            uiThemeJsonText ||
            JSON.stringify(
              iface.uiTheme || {
                backgroundColor: 'rgba(0,0,0,0.75)',
                nameColor: '#fbcfe8',
                textColor: '#f3f4f6',
              },
              null,
              2
            )
          }
          onChange={(e) => {
            const raw = e.target.value
            setUiThemeJsonText(raw)
            try {
              const stripped = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '')
              const parsed = JSON.parse(stripped)
              const flat: Record<string, string | number> = {}
              for (const [k, v] of Object.entries(parsed)) {
                if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
                  Object.assign(flat, v)
                } else {
                  flat[k] = v as string | number
                }
              }
              patchInterface({ uiTheme: flat })
            } catch {
              // invalid json, don't patch yet
            }
          }}
          className="w-full h-48 bg-[#111] border border-[#333] rounded p-3 text-xs font-mono text-gray-300 focus:outline-none focus:border-[#e45463]"
          spellCheck={false}
        />
      </div>
    </div>
  )
}
