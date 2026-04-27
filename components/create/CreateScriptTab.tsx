import { Fragment, type Dispatch, type SetStateAction } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2, Upload, FolderOpen } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import type { InterfaceConfig, RegexScriptEntry, RegexScriptType } from '@/lib/interfaceConfig'

const scriptTypeLabels: Record<RegexScriptType, string> = {
  modify_input: 'Modify Input (사용자 입력)',
  modify_output: 'Modify Output (캐릭터 출력)',
  modify_request: 'Modify Request (전송 데이터)',
  modify_display: 'Modify Display (표시만)',
}

export function CreateScriptTab({
  iface,
  patchInterface,
  expandedRegexScriptId,
  setExpandedRegexScriptId,
  scriptFileImportRef,
  scriptFolderImportRef,
  onScriptFiles,
}: {
  iface: InterfaceConfig
  patchInterface: (patch: Partial<InterfaceConfig>) => void
  expandedRegexScriptId: string | null
  setExpandedRegexScriptId: Dispatch<SetStateAction<string | null>>
  scriptFileImportRef: React.RefObject<HTMLInputElement | null>
  scriptFolderImportRef: React.RefObject<HTMLInputElement | null>
  onScriptFiles: (files: FileList | null) => void
}) {
  const scripts = iface.regexScripts ?? []

  const addRegexScript = () => {
    const next: RegexScriptEntry = {
      id: uuidv4(),
      name: '새 규칙',
      scriptType: 'modify_display',
      pattern: '',
      replacement: '',
      enabled: true,
    }
    patchInterface({ regexScripts: [...scripts, next] })
    setExpandedRegexScriptId(next.id)
  }

  const updateRegexScript = (id: string, patch: Partial<RegexScriptEntry>) => {
    patchInterface({
      regexScripts: scripts.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })
  }

  const removeRegexScript = (id: string) => {
    if (!window.confirm('이 정규식 스크립트를 삭제할까요?')) return
    patchInterface({ regexScripts: scripts.filter((s) => s.id !== id) })
    if (expandedRegexScriptId === id) setExpandedRegexScriptId(null)
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block mb-2 font-semibold">백그라운드 임베딩</label>
        <p className="text-[11px] text-gray-400 mb-2 leading-relaxed">
          RisuAI의 Background embedding과 같이, 채팅 요청 시 <b>시스템·백그라운드 컨텍스트에 항상 붙는</b> 텍스트입니다.
          세계관 고정 규칙, 출력 형식, 금지 사항 등을 넣을 수 있습니다. (실제 병합은 /chat 연동 시 적용)
        </p>
        <textarea
          value={iface.backgroundEmbedding ?? ''}
          onChange={(e) => patchInterface({ backgroundEmbedding: e.target.value })}
          className="w-full min-h-[140px] bg-[#090909] border border-[#333] rounded px-3 py-2 text-xs font-mono text-gray-200"
          placeholder="예: 항상 3인칭 서술로 응답한다. HTML 태그는 사용하지 않는다."
          spellCheck={false}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <label className="block font-semibold">정규식 스크립트 (Regex Script)</label>
            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
              RisuAI와 동일한 개념: <b>IN</b>(정규식)에 맞는 문자열을 <b>OUT</b>(치환문)으로 바꿉니다. Modify Display는
              채팅 로그는 그대로 두고 화면에만 다르게 보이게 할 때 씁니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={scriptFileImportRef}
              type="file"
              accept="*/*,.json,.txt,.risuai,.risum,application/json"
              multiple
              className="hidden"
              onChange={(ev) => {
                onScriptFiles(ev.target.files)
                ev.target.value = ''
              }}
            />
            <input
              ref={scriptFolderImportRef}
              type="file"
              accept="*/*,.json,.txt,.risuai,.risum,application/json"
              {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
              multiple
              className="hidden"
              onChange={(ev) => {
                onScriptFiles(ev.target.files)
                ev.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => scriptFileImportRef.current?.click()}
              className="p-2 rounded-md border border-[#444] text-gray-300 hover:border-white"
              title="파일들 가져오기 (JSON, Text, RisuAI)"
            >
              <Upload size={14} />
            </button>
            <button
              type="button"
              onClick={() => scriptFolderImportRef.current?.click()}
              className="p-2 rounded-md border border-[#444] text-gray-300 hover:border-white"
              title="폴더 가져오기"
            >
              <FolderOpen size={14} />
            </button>
            <button
              type="button"
              onClick={addRegexScript}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#444] text-xs hover:border-white"
            >
              <Plus size={14} /> 규칙 추가
            </button>
          </div>
        </div>

        <ul className="text-[10px] text-gray-500 space-y-0.5 list-disc list-inside">
          <li>Modify Input — 사용자가 보낸 메시지를 API 전에 수정</li>
          <li>Modify Output — 모델 응답을 저장/후처리 전에 수정</li>
          <li>Modify Request — 전송 직전 전체 채팅 데이터 수정</li>
          <li>Modify Display — 표시 텍스트만 바꾸고 저장 데이터는 유지</li>
        </ul>

        <div className="border border-[#333] rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-[#111] text-gray-400">
              <tr>
                <th className="w-8 px-2 py-2 text-left" />
                <th className="px-2 py-2 text-left min-w-[80px]">이름</th>
                <th className="px-2 py-2 text-left min-w-[140px]">타입</th>
                <th className="px-2 py-2 text-center w-14">사용</th>
                <th className="w-10 px-2 py-2 text-right" />
              </tr>
            </thead>
            <tbody>
              {scripts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    규칙이 없습니다. &quot;규칙 추가&quot;를 눌러 행을 눌러 IN/OUT을 설정하세요.
                  </td>
                </tr>
              ) : (
                scripts.map((s) => {
                  const open = expandedRegexScriptId === s.id
                  return (
                    <Fragment key={s.id}>
                      <tr
                        onClick={() => setExpandedRegexScriptId((p) => (p === s.id ? null : s.id))}
                        className={`border-t border-[#222] cursor-pointer hover:bg-[#111] ${open ? 'bg-[#0f0f12]' : ''}`}
                      >
                        <td className="px-2 py-2 align-middle text-gray-500">
                          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </td>
                        <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            value={s.name}
                            onChange={(e) => updateRegexScript(s.id, { name: e.target.value })}
                            className="w-full bg-[#111] border border-[#333] rounded px-2 py-1"
                            placeholder="이름"
                          />
                        </td>
                        <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={s.scriptType}
                            onChange={(e) =>
                              updateRegexScript(s.id, {
                                scriptType: e.target.value as RegexScriptType,
                              })
                            }
                            className="w-full min-w-0 bg-[#111] border border-[#333] rounded px-2 py-1 text-[10px]"
                          >
                            {(Object.keys(scriptTypeLabels) as RegexScriptType[]).map((k) => (
                              <option key={k} value={k}>
                                {scriptTypeLabels[k]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={s.enabled}
                            onChange={(e) => updateRegexScript(s.id, { enabled: e.target.checked })}
                            className="align-middle"
                          />
                        </td>
                        <td className="px-2 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => removeRegexScript(s.id)}
                            className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                            title="삭제"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                      {open && (
                        <tr className="border-t border-[#222] bg-[#0b0b0f]">
                          <td colSpan={5} className="px-3 py-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-1">
                                IN (정규식 · Matches)
                              </label>
                              <input
                                value={s.pattern}
                                onChange={(e) => updateRegexScript(s.id, { pattern: e.target.value })}
                                className="w-full bg-[#090909] border border-[#333] rounded px-2 py-1.5 text-xs font-mono"
                                placeholder="예: \\[status\\]"
                                spellCheck={false}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-1">
                                OUT (치환 · Replacement)
                              </label>
                              <textarea
                                value={s.replacement}
                                onChange={(e) => updateRegexScript(s.id, { replacement: e.target.value })}
                                className="w-full min-h-[88px] bg-[#090909] border border-[#333] rounded px-2 py-1.5 text-xs font-mono"
                                placeholder="매칭된 부분을 이 문자열로 바꿉니다. $1, $2 …"
                                spellCheck={false}
                              />
                            </div>
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
    </div>
  )
}
