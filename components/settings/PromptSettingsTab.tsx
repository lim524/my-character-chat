import React, { useState, useRef } from 'react'
import { Plus, Upload, Download, X, Trash2, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import type { PromptBundle } from '@/lib/appSettings'
import { 
  parseExternalPromptBundle, 
  parseZipToBundles
} from '@/lib/externalImportUtils'
import { useTranslation } from '@/context/LanguageContext'

interface Props {
  promptBundles: PromptBundle[]
  setPromptBundlesState: React.Dispatch<React.SetStateAction<PromptBundle[]>>
}

export function PromptSettingsTab({ promptBundles, setPromptBundlesState }: Props) {
  const { t } = useTranslation()
  const promptImportRef = useRef<HTMLInputElement | null>(null)
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null)
  const [promptDraft, setPromptDraft] = useState<PromptBundle | null>(null)

  const downloadJson = (filename: string, data: unknown) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }


  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold">{t('promptsTab.heading')}</h2>
        <p className="text-sm text-gray-400 mt-2">
          {t('promptsTab.intro')}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => {
            const id = uuidv4()
            setEditingPromptId(id)
            setPromptDraft({
              id,
              name: '',
              description: '',
              enabled: true,
              mainPrompt: '',
              characterPrompt: '',
              jailbreakPrompt: '',
              systemPromptAppend: '',
            })
          }}
          className="inline-flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded hover:bg-[#333] transition"
        >
          <Plus className="w-4 h-4" />
          {t('promptsTab.create')}
        </button>
        <button
          onClick={() => promptImportRef.current?.click()}
          className="inline-flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded hover:bg-[#333] transition"
        >
          <Upload className="w-4 h-4" />
          Import
        </button>
        <button
          onClick={() => downloadJson('prompts-bundles.json', promptBundles)}
          className="inline-flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded hover:bg-[#333] transition"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
        <input
          ref={promptImportRef}
          type="file"
          accept="*/*,.json,.txt,.zip,.charx,.risum"
          className="hidden"
          multiple
          onChange={async (e) => {
            const files = e.target.files
            if (!files || files.length === 0) return
            const newBundles: PromptBundle[] = []
            for (let i = 0; i < files.length; i++) {
              const file = files[i]
              const fileName = file.name.toLowerCase()

              if (fileName.endsWith('.zip') || fileName.endsWith('.charx') || fileName.endsWith('.risum')) {
                try {
                  const { prompts } = await parseZipToBundles(file)
                  newBundles.push(...prompts)
                } catch (err) {
                  console.error(`Failed to parse ${file.name} as zip/charx/risum:`, err)
                }
                continue
              }

              if (fileName.endsWith('.json')) {
                try {
                  const text = await file.text()
                  const json = JSON.parse(text)
                  const arr = Array.isArray(json) ? json : [json]
                  arr.forEach((x: unknown) => {
                    const p = parseExternalPromptBundle(x, file.name)
                    if (p) newBundles.push(p)
                  })
                } catch (err) {
                  console.error(`Failed to parse ${file.name}:`, err)
                }
              } else if (fileName.endsWith('.txt')) {
                try {
                  const text = await file.text()
                  newBundles.push({
                    id: uuidv4(),
                    name: file.name.replace('.txt', ''),
                    description: t('promptsTab.importHint'),
                    enabled: true,
                    mainPrompt: text,
                    characterPrompt: '',
                    jailbreakPrompt: '',
                    systemPromptAppend: '',
                  })
                } catch (err) {
                  console.error(`Failed to read ${file.name}:`, err)
                }
              }
            }
            if (newBundles.length > 0) {
              setPromptBundlesState(prev => [...prev, ...newBundles])
            }
            e.target.value = ''
          }}
        />
      </div>

      {editingPromptId && promptDraft ? (
        <div className="bg-[#202020] border border-[#333] rounded-lg p-4 space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div className="font-semibold">{t('promptsTab.editTitle')}</div>
            <button
              className="text-gray-400 hover:text-white"
              onClick={() => {
                setEditingPromptId(null)
                setPromptDraft(null)
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">{t('promptsTab.name')}</label>
              <input
                value={promptDraft.name}
                onChange={(e) => setPromptDraft({ ...promptDraft, name: e.target.value })}
                className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#444] rounded-lg text-white"
              />
            </div>
            <div className="flex items-end justify-between gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={promptDraft.enabled}
                  onChange={() => setPromptDraft({ ...promptDraft, enabled: !promptDraft.enabled })}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#e45463]"
                />
                {t('promptsTab.enabled')}
              </label>
              <button
                onClick={() => downloadJson(`prompt-bundle-${promptDraft.id}.json`, promptDraft)}
                className="text-sm px-3 py-2 bg-[#2a2a2a] border border-[#444] rounded hover:bg-[#333] transition"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">{t('promptsTab.description')}</label>
            <textarea
              value={promptDraft.description}
              onChange={(e) => setPromptDraft({ ...promptDraft, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#444] rounded-lg text-white resize-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Main Prompt</label>
            <textarea
              value={promptDraft.mainPrompt}
              onChange={(e) => setPromptDraft({ ...promptDraft, mainPrompt: e.target.value })}
              rows={5}
              className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#444] rounded-lg text-white font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Character Prompt</label>
            <textarea
              value={promptDraft.characterPrompt}
              onChange={(e) => setPromptDraft({ ...promptDraft, characterPrompt: e.target.value })}
              rows={5}
              className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#444] rounded-lg text-white font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Jailbreak</label>
            <textarea
              value={promptDraft.jailbreakPrompt}
              onChange={(e) => setPromptDraft({ ...promptDraft, jailbreakPrompt: e.target.value })}
              rows={5}
              className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#444] rounded-lg text-white font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">{t('promptsTab.systemPrompt')}</label>
            <textarea
              value={promptDraft.systemPromptAppend}
              onChange={(e) => setPromptDraft({ ...promptDraft, systemPromptAppend: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#444] rounded-lg text-white font-mono text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setPromptBundlesState((prev) => {
                  const exists = prev.some((b) => b.id === promptDraft.id)
                  return exists
                    ? prev.map((b) => (b.id === promptDraft.id ? promptDraft : b))
                    : [promptDraft, ...prev]
                })
                setEditingPromptId(null)
                setPromptDraft(null)
              }}
              className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition"
            >
              {t('promptsTab.save')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {promptBundles.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-10 bg-[#222] rounded-xl border border-dashed border-[#444]">
              {t('promptsTab.empty')}
            </div>
          ) : (
            promptBundles.map((b) => (
              <div key={b.id} className="bg-[#202020] border border-[#333] rounded-xl p-4 hover:border-[#444] transition-colors group">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold truncate text-white group-hover:text-[#e45463] transition-colors">
                      {b.name || t('common.unnamed')}
                    </div>
                    <div className="text-xs text-gray-500 line-clamp-2 mt-0.5">{b.description || t('common.noDescription')}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() =>
                        setPromptBundlesState((prev) =>
                          prev.map((x) => (x.id === b.id ? { ...x, enabled: !x.enabled } : x))
                        )
                      }
                      className="p-1.5 text-gray-400 hover:text-white transition-colors"
                      title={b.enabled ? t('promptsTab.toggleOn') : t('promptsTab.toggleOff')}
                    >
                      {b.enabled ? <ToggleRight className="w-6 h-6 text-[#e45463]" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingPromptId(b.id)
                        setPromptDraft(b)
                      }}
                      className="p-1.5 text-gray-400 hover:text-white transition-colors"
                      title={t('promptsTab.titleEdit')}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => downloadJson(`prompt-bundle-${b.id}.json`, b)}
                      className="p-1.5 text-gray-400 hover:text-white transition-colors"
                      title={t('promptsTab.exportTitle')}
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={() => {
                        if (!confirm(t('promptsTab.confirmDelete'))) return
                        setPromptBundlesState((prev) => prev.filter((x) => x.id !== b.id))
                      }}
                      className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                      title={t('promptsTab.deleteTitle')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
