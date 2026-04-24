import { Fragment, type Dispatch, type SetStateAction } from 'react'
import { Plus, Trash2, Upload, Download, FolderOpen } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import type { CharacterDraft, LoreEntry } from '@/lib/interfaceConfig'

export function CreateLorebookTab({
  draft,
  patchDraft,
  expandedLoreId,
  setExpandedLoreId,
  lorebookGlobalImportRef,
  lorebookFolderImportRef,
  lorebookSingleImportRef,
  lorebookImportTargetId,
  setLorebookImportTargetId,
  onLorebookFiles,
}: {
  draft: CharacterDraft
  patchDraft: (patch: Partial<CharacterDraft>) => void
  expandedLoreId: string | null
  setExpandedLoreId: Dispatch<SetStateAction<string | null>>
  lorebookGlobalImportRef: React.RefObject<HTMLInputElement | null>
  lorebookFolderImportRef: React.RefObject<HTMLInputElement | null>
  lorebookSingleImportRef: React.RefObject<HTMLInputElement | null>
  lorebookImportTargetId: string | null
  setLorebookImportTargetId: Dispatch<SetStateAction<string | null>>
  onLorebookFiles: (files: FileList | null, targetId?: string | null) => void
}) {
  const entries = (draft.loreEntries as LoreEntry[] | undefined) ?? []

  const setEntries = (next: LoreEntry[]) => {
    patchDraft({ loreEntries: next })
  }

  const addEntry = () => {
    const next: LoreEntry = {
      id: uuidv4(),
      name: 'New Lore',
      keys: '',
      order: 100,
      prompt: '',
      alwaysActive: false,
      multipleKeys: false,
      useRegex: false,
    }
    setEntries([...(entries || []), next])
  }

  const updateEntry = (id: string, patch: Partial<LoreEntry>) => {
    setEntries(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  const removeEntry = (id: string, ev: React.MouseEvent) => {
    ev.stopPropagation()
    setEntries(entries.filter((e) => e.id !== id))
    if (expandedLoreId === id) setExpandedLoreId(null)
  }

  const toggleExpanded = (id: string) => {
    setExpandedLoreId((prev) => (prev === id ? null : id))
  }

  const numberInputClass =
    'w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-xs [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

  const exportEntries = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'lorebook.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const onSingleImportFile = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0]
    const targetId = lorebookImportTargetId
    if (!file || !targetId) return
    onLorebookFiles(ev.target.files, targetId)
    setLorebookImportTargetId(null)
    ev.target.value = ''
  }

  const exportEntry = (entry: LoreEntry) => {
    const blob = new Blob([JSON.stringify(entry, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${(entry.name || 'lore').replace(/[^a-zA-Z0-9가-힣_-]/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const startSingleImport = (id: string) => {
    setLorebookImportTargetId(id)
    setTimeout(() => lorebookSingleImportRef.current?.click(), 0)
  }


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">로어북</span>
        <div className="flex items-center gap-2">
          <input
            ref={lorebookGlobalImportRef}
            type="file"
            accept=".json,.txt,.risuai,application/json"
            multiple
            className="hidden"
            onChange={(ev) => {
              onLorebookFiles(ev.target.files)
              ev.target.value = ''
            }}
          />
          <input
            ref={lorebookFolderImportRef}
            type="file"
            accept=".json,.txt,.risuai,application/json"
            {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
            multiple
            className="hidden"
            onChange={(ev) => {
              onLorebookFiles(ev.target.files)
              ev.target.value = ''
            }}
          />
          <input
            ref={lorebookSingleImportRef}
            type="file"
            accept=".json,.txt,.risuai,application/json"
            className="hidden"
            onChange={onSingleImportFile}
          />
          <button
            type="button"
            onClick={() => lorebookGlobalImportRef.current?.click()}
            className="p-2 rounded-md border border-[#333] hover:border-white text-gray-300"
            title="파일들 가져오기 (JSON, Text, RisuAI)"
          >
            <Upload size={14} />
          </button>
          <button
            type="button"
            onClick={() => lorebookFolderImportRef.current?.click()}
            className="p-2 rounded-md border border-[#333] hover:border-white text-gray-300"
            title="폴더 가져오기"
          >
            <FolderOpen size={14} />
          </button>
          <button
            type="button"
            onClick={exportEntries}
            className="p-2 rounded-md border border-[#333] hover:border-white text-gray-300"
            title="전체보내기"
          >
            <Download size={14} />
          </button>
          <button
            type="button"
            onClick={addEntry}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-[#444] text-xs hover:border-white"
          >
            <Plus size={12} /> 새 로어북
          </button>
        </div>
      </div>

      <div className="border border-[#333] rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-[#111] text-gray-300">
            <tr>
              <th className="px-3 py-2 text-left">이름</th>
              <th className="px-3 py-2 text-right w-28"> </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <Fragment key={e.id}>
                <tr
                  onClick={() => toggleExpanded(e.id)}
                  className={`border-t border-[#222] cursor-pointer hover:bg-[#111] ${expandedLoreId === e.id ? 'bg-[#0f0f12]' : ''}`}
                >
                  <td className="px-3 py-2 font-medium">{e.name || '(이름 없음)'}</td>
                  <td className="px-3 py-2 text-right" onClick={(ev) => ev.stopPropagation()}>
                    <span className="inline-flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation()
                          startSingleImport(e.id)
                        }}
                        className="p-1 rounded hover:bg-[#222] text-gray-400 hover:text-white"
                        title="가져오기"
                      >
                        <Upload size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation()
                          exportEntry(e)
                        }}
                        className="p-1 rounded hover:bg-[#222] text-gray-400 hover:text-white"
                        title="보내기"
                      >
                        <Download size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(ev) => removeEntry(e.id, ev)}
                        className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                        title="삭제"
                      >
                        <Trash2 size={12} />
                      </button>
                    </span>
                  </td>
                </tr>
                {expandedLoreId === e.id && (
                  <tr className="border-t border-[#222] bg-[#0b0b0f]">
                    <td colSpan={2} className="px-4 py-4 align-top">
                      <div className="space-y-4" onClick={(ev) => ev.stopPropagation()}>
                        <div>
                          <label className="block mb-2 text-xs font-semibold">이름</label>
                          <input
                            value={e.name}
                            onChange={(ev) => updateEntry(e.id, { name: ev.target.value })}
                            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block mb-2 text-xs font-semibold">활성화 키</label>
                          <input
                            value={e.keys}
                            onChange={(ev) => updateEntry(e.id, { keys: ev.target.value })}
                            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-xs"
                            placeholder="대화에 이 글자가 보이면 활성 · 멀티플 키 켜면 쉼표·줄바꿈으로 여러 개"
                          />
                          <p className="mt-1.5 text-[10px] text-gray-500 leading-relaxed">
                            <b>비워 두면</b> 최근 대화와 관계없이 항상 AI 시스템 프롬프트에 포함됩니다. 세계관·고정 설정에
                            쓰기 좋습니다. 특정 단어가 나올 때만 넣고 싶으면 키를 입력하세요.
                          </p>
                        </div>
                        <div>
                          <label className="block mb-2 text-xs font-semibold">배치 순서</label>
                          <input
                            type="number"
                            value={e.order}
                            onChange={(ev) => updateEntry(e.id, { order: Number(ev.target.value) || 0 })}
                            className={numberInputClass}
                          />
                        </div>
                        <div>
                          <label className="block mb-2 text-xs font-semibold">프롬프트</label>
                          <textarea
                            value={e.prompt}
                            onChange={(ev) => updateEntry(e.id, { prompt: ev.target.value })}
                            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-xs min-h-[80px]"
                            placeholder="실제 캐릭터 프롬프트"
                          />
                        </div>
                        <div className="flex flex-col gap-2 text-xs text-gray-200">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={e.alwaysActive}
                              onChange={(ev) => updateEntry(e.id, { alwaysActive: ev.target.checked })}
                            />
                            언제나 활성화
                          </label>
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={e.multipleKeys}
                              onChange={(ev) => updateEntry(e.id, { multipleKeys: ev.target.checked })}
                            />
                            멀티플 키
                          </label>
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={e.useRegex}
                              onChange={(ev) => updateEntry(e.id, { useRegex: ev.target.checked })}
                            />
                            정규식 사용
                          </label>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={2} className="px-3 py-4 text-center text-gray-500">
                  로어가 없습니다. &quot;새 로어북&quot; 버튼으로 추가하세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-gray-500 leading-relaxed px-0.5">
        채팅 API는 <b>최근 12개 메시지</b>를 이어 붙여 보고, 키가 들어 있는 로어만 시스템에 넣습니다. 항상 활성은
        키 없이 포함됩니다. (고정 동작, 별도 설정 없음)
      </p>
    </div>
  )
}
