import React, { useState, useEffect } from 'react'
import { X, MessageSquare, Box, Settings } from 'lucide-react'
import { 
  getPromptBundles, 
  setPromptBundles, 
  getModuleBundles, 
  setModuleBundles,
  type PromptBundle,
  type ModuleBundle
} from '@/lib/appSettings'
import { PromptSettingsTab } from '../settings/PromptSettingsTab'
import { ModuleSettingsTab } from '../settings/ModuleSettingsTab'

interface Props {
  open: boolean
  onClose: () => void
}

export function ChatSettingsModal({ open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'prompts' | 'modules'>('prompts')
  const [promptBundles, setPromptBundlesState] = useState<PromptBundle[]>([])
  const [moduleBundles, setModuleBundlesState] = useState<ModuleBundle[]>([])

  useEffect(() => {
    if (open) {
      void (async () => {
        setPromptBundlesState(await getPromptBundles())
        setModuleBundlesState(await getModuleBundles())
      })()
    }
  }, [open])

  const handleSaveAll = async () => {
    await setPromptBundles(promptBundles)
    await setModuleBundles(moduleBundles)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#333] bg-[#1f1f1f]">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#e45463]" />
            <h2 className="text-lg font-bold text-white">시스템 설정</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex min-h-0">
          {/* Sidebar */}
          <div className="w-48 border-r border-[#333] bg-[#181818] p-2 flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('prompts')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'prompts'
                  ? 'bg-[#e45463] text-white shadow-lg shadow-[#e45463]/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#252525]'
              }`}
            >
              <MessageSquare size={18} />
              프롬프트
            </button>
            <button
              onClick={() => setActiveTab('modules')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'modules'
                  ? 'bg-[#e45463] text-white shadow-lg shadow-[#e45463]/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#252525]'
              }`}
            >
              <Box size={18} />
              모듈
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#1a1a1a]">
            {activeTab === 'prompts' && (
              <PromptSettingsTab 
                promptBundles={promptBundles}
                setPromptBundlesState={setPromptBundlesState}
              />
            )}
            {activeTab === 'modules' && (
              <ModuleSettingsTab 
                moduleBundles={moduleBundles}
                setModuleBundlesState={setModuleBundlesState}
                isChatMode={true}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#333] bg-[#1f1f1f] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSaveAll}
            className="px-6 py-2 bg-white text-black text-sm font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-95"
          >
            설정 저장 및 적용
          </button>
        </div>
      </div>
    </div>
  )
}
