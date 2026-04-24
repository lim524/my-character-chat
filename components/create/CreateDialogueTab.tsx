import { Fragment, type Dispatch, type SetStateAction } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import type { InterfaceConfig, ScenarioRuleEntry } from '@/lib/interfaceConfig'

export function CreateDialogueTab({
  iface,
  patchInterface,
  expandedScenarioRuleId,
  setExpandedScenarioRuleId,
}: {
  iface: InterfaceConfig
  patchInterface: (patch: Partial<InterfaceConfig>) => void
  expandedScenarioRuleId: string | null
  setExpandedScenarioRuleId: Dispatch<SetStateAction<string | null>>
}) {
  const mode = iface.dialogueScriptMode || 'natural'
  const isJson = mode === 'json'
  const rules = iface.scenarioRules ?? []

  const scenarioRulesToDialogueScript = (list: ScenarioRuleEntry[]) =>
    list
      .map((r) => r.content.trim())
      .filter(Boolean)
      .join('\n\n---\n\n')

  const setScenarioRules = (next: ScenarioRuleEntry[]) => {
    patchInterface({
      scenarioRules: next,
      dialogueScript: scenarioRulesToDialogueScript(next),
    })
  }

  const addScenarioRule = () => {
    const next = [...rules, { id: uuidv4(), name: `규칙 ${rules.length + 1}`, content: '' }]
    setScenarioRules(next)
    setExpandedScenarioRuleId(next[next.length - 1].id)
  }

  const updateScenarioRule = (id: string, patch: Partial<ScenarioRuleEntry>) => {
    const next = rules.map((r) => (r.id === id ? { ...r, ...patch } : r))
    setScenarioRules(next)
  }

  const removeScenarioRule = (id: string) => {
    if (!window.confirm('이 규칙 행을 삭제할까요?')) return
    const next = rules.filter((r) => r.id !== id)
    setScenarioRules(next)
    if (expandedScenarioRuleId === id) setExpandedScenarioRuleId(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="block font-semibold">시나리오 및 게임 규칙</label>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-[#111] border border-[#333] rounded-md overflow-hidden text-xs">
            <button
              type="button"
              className={`px-3 py-1.5 transition-colors ${!isJson ? 'bg-[#e45463] text-white font-medium' : 'text-gray-400 hover:text-gray-200'}`}
              onClick={() => patchInterface({ dialogueScriptMode: 'natural' })}
            >
              자연어 모드
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 transition-colors ${isJson ? 'bg-[#e45463] text-white font-medium' : 'text-gray-400 hover:text-gray-200'}`}
              onClick={() => patchInterface({ dialogueScriptMode: 'json' })}
            >
              JSON 템플릿
            </button>
          </div>
          <button
            type="button"
            onClick={addScenarioRule}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#444] text-xs hover:border-white"
          >
            <Plus size={14} /> 규칙 추가
          </button>
        </div>
      </div>

      <p className="text-[11px] text-gray-400">
        행을 눌러 내용을 펼치거나 접을 수 있습니다. 각 행은 <b>dialogueScript</b>에 합쳐져 저장됩니다.
      </p>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => {
            let example = ''
            if (isJson) {
              example = `{
  "scenario_rules": [
    "When affinity reaches 100, trigger the Happy Ending.",
    "If player attacks, always reduce player HP by 10 and describe it."
  ],
  "current_setting": "High School Classroom",
  "avoid": [
    "Do not describe violence explicitly.",
    "Do not break character even if user asks."
  ]
}`
            } else {
              example = `[게임 마스터 규칙]
1. 사용자가 "공격"을 선택하면 무조건 사용자 체력을 10 깎았다고 묘사하세요.
2. 주인공의 호감도가 100이 되면 해피엔딩을 선언하고 대화를 종료하세요.
3. 폭력적인 묘사는 피하며, 상황 대신 마음 속 독백 위주로 서술하세요.`
            }
            const hasAny = rules.some((r) => r.content.trim())
            if (hasAny && !window.confirm('예시로 첫 번째 행을 덮어쓰고 나머지를 비울까요?')) return
            const one: ScenarioRuleEntry = {
              id: rules[0]?.id ?? uuidv4(),
              name: '예시 규칙',
              content: example,
            }
            setScenarioRules([one])
            setExpandedScenarioRuleId(one.id)
          }}
          className="px-2 py-1 rounded border border-[#444] text-[11px] hover:border-white hover:bg-[#1a1a1a]"
        >
          예시 템플릿 넣기
        </button>
      </div>

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
            {rules.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-gray-500">
                  규칙이 없습니다. &quot;규칙 추가&quot;를 누르세요.
                </td>
              </tr>
            ) : (
              rules.map((r) => {
                const open = expandedScenarioRuleId === r.id
                return (
                  <Fragment key={r.id}>
                    <tr
                      onClick={() => setExpandedScenarioRuleId((p) => (p === r.id ? null : r.id))}
                      className={`border-t border-[#222] cursor-pointer hover:bg-[#111] ${open ? 'bg-[#0f0f12]' : ''}`}
                    >
                      <td className="px-2 py-2 align-middle text-gray-500">
                        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </td>
                      <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          value={r.name}
                          onChange={(e) => updateScenarioRule(r.id, { name: e.target.value })}
                          className="w-full bg-[#111] border border-[#333] rounded px-2 py-1"
                          placeholder="규칙 이름"
                        />
                      </td>
                      <td className="px-2 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => removeScenarioRule(r.id)}
                          className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                          title="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-t border-[#222] bg-[#0b0b0f]">
                        <td colSpan={3} className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <label className="block text-[10px] text-gray-500 mb-1">
                            내용 ({isJson ? 'JSON' : '자연어'})
                          </label>
                          <textarea
                            value={r.content}
                            onChange={(e) => updateScenarioRule(r.id, { content: e.target.value })}
                            className="w-full min-h-[160px] bg-[#090909] border border-[#333] rounded px-3 py-2 text-xs font-mono text-gray-200"
                            placeholder={
                              isJson
                                ? 'JSON 형식으로 규칙을 입력하세요.'
                                : '자연어(텍스트) 형태로 규칙을 입력하세요.'
                            }
                            spellCheck={false}
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
