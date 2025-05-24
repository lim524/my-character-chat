import { User, Coins, BookOpen, X, PanelRightOpen, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface LoreEntry {
  id: string
  title: string
  enabled: boolean
}

interface ChatMenuProps {
  userName: string
  userDescription: string
  onUserChange: (field: 'name' | 'description', value: string) => void
  point: number
  lore: string
  onLoreChange: (value: string) => void
  onClose: () => void
}

export default function ChatMenu({
  userName,
  userDescription,
  onUserChange,
  point,
  lore,
  onLoreChange,
  onClose,
}: ChatMenuProps) {
  const [activeTab, setActiveTab] = useState<'user' | 'lore'>('user')
  const [loreList, setLoreList] = useState<LoreEntry[]>([])
  const [newLoreTitle, setNewLoreTitle] = useState('')

  const handleAddLore = () => {
    if (newLoreTitle.trim() === '') return
    setLoreList((prev) => [...prev, { id: crypto.randomUUID(), title: newLoreTitle.trim(), enabled: true }])
    setNewLoreTitle('')
  }

  const handleToggleLore = (id: string) => {
    setLoreList((prev) => prev.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item))
  }

  const handleRemoveLore = (id: string) => {
    setLoreList((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="w-full max-w-md bg-[#111] text-white p-4 space-y-6 h-screen overflow-y-auto relative">
      {/* 닫기 버튼 */}
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
        <X className="w-5 h-5" />
      </button>

      {/* 포인트 표시 */}
      <div className="flex items-center gap-2 text-lg font-bold text-yellow-400">
        <Coins className="w-5 h-5" />
        보유 포인트: {point}P
      </div>

      {/* 탭 버튼 */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setActiveTab('user')}
          className={`px-4 py-1 rounded-full text-sm font-medium ${
            activeTab === 'user' ? 'bg-white text-black' : 'bg-white/10 text-white'
          }`}
        >
          내 정보 수정
        </button>
        <button
          onClick={() => setActiveTab('lore')}
          className={`px-4 py-1 rounded-full text-sm font-medium ${
            activeTab === 'lore' ? 'bg-white text-black' : 'bg-white/10 text-white'
          }`}
        >
          로어북
        </button>
      </div>

      {/* 사용자 설정 탭 */}
      {activeTab === 'user' && (
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            <User className="w-5 h-5" /> 사용자 설정
          </h2>
          <input
            type="text"
            value={userName}
            onChange={(e) => onUserChange('name', e.target.value)}
            placeholder="사용자 이름"
            className="w-full bg-[#222] text-white p-2 rounded"
          />
          <textarea
            value={userDescription}
            onChange={(e) => onUserChange('description', e.target.value)}
            placeholder="사용자 설명 (최대 1000자)"
            maxLength={1000}
            rows={5}
            className="w-full bg-[#222] text-white p-2 rounded resize-none"
          />
        </div>
      )}

      {/* 로어북 탭 */}
      {activeTab === 'lore' && (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            <BookOpen className="w-5 h-5" /> 로어북
          </h2>
          <p className="text-xs text-gray-400">
            로어북 추가 후 그동안의 스토리를 내용 안에 적으면 캐릭터가 잊지 않고 기억해요.
          </p>
          <div className="flex gap-2">
            <input
              value={newLoreTitle}
              onChange={(e) => setNewLoreTitle(e.target.value)}
              placeholder="새 로어북 제목"
              className="flex-1 bg-[#222] text-white p-2 rounded"
            />
            <button
              onClick={handleAddLore}
              className="bg-white hover:bg-gray-200 text-black px-4 py-1 rounded"
            >
              추가
            </button>
          </div>

          <div className="space-y-2">
            {loreList.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-[#1c1c1e] p-2 rounded">
                <span className="text-sm text-white truncate max-w-[180px]">{item.title}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={() => handleToggleLore(item.id)}
                    className="w-4 h-4 accent-yellow-500"
                  />
                  <button onClick={() => handleRemoveLore(item.id)}>
                    <Trash2 className="w-4 h-4 text-red-500 hover:text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
