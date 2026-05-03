import { Fragment, type Dispatch, type SetStateAction } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import type { GameVariableDefinition, InterfaceConfig } from '@/lib/interfaceConfig'
import { isValidVariableKey } from '@/lib/gameVariables'

export function CreateGameVariablesTab({
  iface,
  patchInterface,
  expandedId,
  setExpandedId,
}: {
  iface: InterfaceConfig
  patchInterface: (patch: Partial<InterfaceConfig>) => void
  expandedId: string | null
  setExpandedId: Dispatch<SetStateAction<string | null>>
}) {
  const rows = iface.gameVariables ?? []

  const setRows = (next: GameVariableDefinition[]) => {
    patchInterface({ gameVariables: next })
  }

  const addRow = () => {
    const row: GameVariableDefinition = {
      id: uuidv4(),
      key: `var_${rows.length + 1}`,
      label: `변수 ${rows.length + 1}`,
      type: 'string',
      defaultValue: '',
    }
    setRows([...rows, row])
    setExpandedId(row.id)
  }

  const updateRow = (id: string, patch: Partial<GameVariableDefinition>) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const removeRow = (id: string) => {
    if (!window.confirm('이 변수 정의를 삭제할까요?')) return
    setRows(rows.filter((r) => r.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="block font-semibold">게임 변수 (동적 상태)</label>
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#444] text-xs hover:border-white"
        >
          <Plus size={14} /> 항목 추가
        </button>
      </div>
      <p className="text-[11px] text-gray-400 leading-relaxed">
        AI가 응답 끝에{' '}
        <code className="text-[10px] text-cyan-300/90">
          [game_state]{'{'} ... {'}'}[/game_state]
        </code>{' '}
        블록으로 보내면, 여기서 정의한 키만 채팅방별로 저장됩니다. 전역 인터페이스 HTML에서는{' '}
        <code className="text-[10px] text-pink-300/90">{'{{'}키이름{'}}'}</code> 로 표시할 수 있습니다.
        키는 영문으로 시작하는 식별자만 허용됩니다.
      </p>

      <div className="border border-[#333] rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-[#111] text-gray-400">
            <tr>
              <th className="w-8 px-2 py-2 text-left" />
              <th className="px-2 py-2 text-left">키</th>
              <th className="px-2 py-2 text-left">라벨</th>
              <th className="w-10 px-2 py-2 text-right" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                  변수가 없습니다. 필요하면 「항목 추가」를 누르세요.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const open = expandedId === row.id
                const keyOk = isValidVariableKey(row.key.trim())
                return (
                  <Fragment key={row.id}>
                    <tr
                      onClick={() => setExpandedId((p) => (p === row.id ? null : row.id))}
                      className={`border-t border-[#222] cursor-pointer hover:bg-[#111] ${open ? 'bg-[#0f0f12]' : ''}`}
                    >
                      <td className="px-2 py-2 align-middle text-gray-500">
                        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </td>
                      <td className="px-2 py-2 font-mono text-[11px]" onClick={(ev) => ev.stopPropagation()}>
                        <input
                          value={row.key}
                          onChange={(e) => updateRow(row.id, { key: e.target.value })}
                          className={`w-full bg-[#111] border rounded px-2 py-1 ${keyOk ? 'border-[#333]' : 'border-red-500/60'}`}
                          placeholder="banner_text"
                        />
                      </td>
                      <td className="px-2 py-2" onClick={(ev) => ev.stopPropagation()}>
                        <input
                          value={row.label}
                          onChange={(e) => updateRow(row.id, { label: e.target.value })}
                          className="w-full bg-[#111] border border-[#333] rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-2 py-2 text-right" onClick={(ev) => ev.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                          title="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-t border-[#222] bg-[#0b0b0f]">
                        <td colSpan={4} className="px-3 py-3" onClick={(ev) => ev.stopPropagation()}>
                          <div className="flex flex-wrap gap-3 mb-3">
                            <label className="text-[10px] text-gray-500 flex items-center gap-2">
                              타입
                              <select
                                value={row.type}
                                onChange={(e) =>
                                  updateRow(row.id, {
                                    type: e.target.value as GameVariableDefinition['type'],
                                  })
                                }
                                className="bg-[#111] border border-[#333] rounded px-2 py-1 text-gray-200"
                              >
                                <option value="string">string</option>
                                <option value="number">number</option>
                                <option value="boolean">boolean</option>
                              </select>
                            </label>
                          </div>
                          <label className="block text-[10px] text-gray-500 mb-1">기본값</label>
                          <input
                            value={row.defaultValue}
                            onChange={(e) => updateRow(row.id, { defaultValue: e.target.value })}
                            className="w-full bg-[#090909] border border-[#333] rounded px-3 py-2 text-xs font-mono text-gray-200"
                            placeholder={row.type === 'boolean' ? 'true / false' : ''}
                          />
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
