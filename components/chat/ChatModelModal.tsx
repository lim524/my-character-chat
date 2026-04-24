import type { ProviderId } from '@/lib/appSettings'
import { setChatParameters, setLastChatModelSelection } from '@/lib/appSettings'
import type { ChatModelItem } from './types'

export function ChatModelModal({
  open,
  onClose,
  models,
  selectedModel,
  setSelectedModel,
  setSelectedProvider,
  temperature,
  setTemperature,
  maxInputChars,
  setMaxInputChars,
  maxOutputChars,
  setMaxOutputChars,
}: {
  open: boolean
  onClose: () => void
  models: ChatModelItem[]
  selectedModel: string
  setSelectedModel: (id: string) => void
  setSelectedProvider: (p: ProviderId) => void
  temperature: number
  setTemperature: (n: number) => void
  maxInputChars: number
  setMaxInputChars: (n: number) => void
  maxOutputChars: number
  setMaxOutputChars: (n: number) => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1b1b1b] p-6 rounded-2xl w-full max-w-sm space-y-6 relative max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white text-center">AI 모델 · 옵션</h2>
        <div className="space-y-4">
          {models.map((model) => (
            <div
              key={model.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedModel(model.id)
                setSelectedProvider(model.provider as ProviderId)
                void setLastChatModelSelection({
                  provider: model.provider as ProviderId,
                  modelId: model.id,
                })
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedModel(model.id)
                  setSelectedProvider(model.provider as ProviderId)
                  void setLastChatModelSelection({
                    provider: model.provider as ProviderId,
                    modelId: model.id,
                  })
                }
              }}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                selectedModel === model.id ? 'bg-[#e45463]' : 'bg-[#2b2b2b]'
              }`}
            >
              <div className="flex items-center">
                <span className="mr-2">{model.icon}</span>
                <div className="flex flex-col">
                  <span className="text-white font-semibold">{model.label}</span>
                  <span className="text-xs text-gray-400">{model.description}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2 border-t border-gray-700 pt-4">
          <label className="block text-sm text-gray-300">Temperature (0~2)</label>
          <input
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={temperature}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              if (!Number.isNaN(v)) {
                const next = Math.max(0, Math.min(2, v))
                setTemperature(next)
                void setChatParameters({ temperature: next, maxInputChars, maxOutputChars })
              }
            }}
            className="w-full bg-[#222] text-white px-3 py-2 rounded"
          />
          <label className="block text-sm text-gray-300">Max input chars</label>
          <input
            type="number"
            min={100}
            max={200000}
            value={maxInputChars}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10)
              if (Number.isNaN(v)) return
              const safe = Math.max(100, Math.min(200000, v))
              setMaxInputChars(safe)
              void setChatParameters({ temperature, maxInputChars: safe, maxOutputChars })
            }}
            className="w-full bg-[#222] text-white px-3 py-2 rounded"
          />
          <label className="block text-sm text-gray-300">Max output chars</label>
          <input
            type="number"
            min={100}
            max={200000}
            value={maxOutputChars}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10)
              if (Number.isNaN(v)) return
              const safe = Math.max(100, Math.min(200000, v))
              setMaxOutputChars(safe)
              void setChatParameters({ temperature, maxInputChars, maxOutputChars: safe })
            }}
            className="w-full bg-[#222] text-white px-3 py-2 rounded"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-6 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-full text-sm"
        >
          닫기
        </button>
      </div>
    </div>
  )
}
