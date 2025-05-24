import { User, Coins, BookOpen, X, Menu, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface LoreEntry {
  id: string
  title: string
  content: string
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
  const [newLoreContent, setNewLoreContent] = useState('')
  const [showLoreModal, setShowLoreModal] = useState(false)

  const handleAddLore = () => {
    if (newLoreTitle.trim() === '' || newLoreContent.trim() === '') return
    setLoreList((prev) => [...prev, {
      id: crypto.randomUUID(),
      title: newLoreTitle.trim(),
      content: newLoreContent.trim(),
      enabled: true,
    }])
    setNewLoreTitle('')
    setNewLoreContent('')
    setShowLoreModal(false)
  }

  const handleToggleLore = (id: string) => {
    setLoreList((prev) => prev.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item))
  }

  const handleRemoveLore = (id: string) => {
    setLoreList((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="w-full max-w-md bg-[#1a1a1a] text-white p-5 space-y-6 h-screen overflow-y-auto relative">
      {/* 닫기 버튼 */}
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
        <X className="w-5 h-5" />
      </button>

      {/* 포인트 표시 */}
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-100">
        <Coins className="w-5 h-5 text-yellow-400" />
        보유 포인트: <span className="text-yellow-400">{point}P</span>
      </div>

      {/* 탭 버튼 */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setActiveTab('user')}
          className={`px-4 py-1 rounded-full text-sm font-medium transition ${
            activeTab === 'user' ? 'bg-gray-100 text-black' : 'bg-gray-700 text-gray-300'
          }`}
        >
          내 정보 수정
        </button>
        <button
          onClick={() => setActiveTab('lore')}
          className={`px-4 py-1 rounded-full text-sm font-medium transition ${
            activeTab === 'lore' ? 'bg-gray-100 text-black' : 'bg-gray-700 text-gray-300'
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
            className="w-full bg-[#2a2a2a] text-white placeholder-gray-500 p-2 rounded border border-gray-600"
          />
          <textarea
            value={userDescription}
            onChange={(e) => onUserChange('description', e.target.value)}
            placeholder="사용자 설명 (최대 1000자)"
            maxLength={1000}
            rows={5}
            className="w-full bg-[#2a2a2a] text-white placeholder-gray-500 p-2 rounded resize-none border border-gray-600"
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
            중요한 스토리 내용을 입력하세요
          </p>
          <button
            onClick={() => setShowLoreModal(true)}
            className="bg-gray-100 hover:bg-gray-300 text-black px-4 py-1 rounded text-sm font-medium"
          >
            + 새 로어북 추가
          </button>

          <div className="space-y-2">
            {loreList.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-[#2a2a2a] text-white p-2 rounded border border-gray-700">
                <div className="text-left">
                  <div className="font-semibold text-sm text-white">{item.title}</div>
                  <div className="text-xs text-gray-400 max-w-[180px] truncate">{item.content}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={() => handleToggleLore(item.id)}
                    className="w-4 h-4 accent-gray-400"
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

      {/* 로어북 작성 모달 */}
      {showLoreModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1e1e1e] text-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">로어북 작성</h3>
              <button onClick={() => setShowLoreModal(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-300">제목</label>
              <input
                value={newLoreTitle}
                onChange={(e) => setNewLoreTitle(e.target.value)}
                className="w-full bg-[#2a2a2a] text-white placeholder-gray-500 p-2 rounded border border-gray-600"
                placeholder="로어북 제목"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-300">내용</label>
              <textarea
                value={newLoreContent}
                onChange={(e) => setNewLoreContent(e.target.value)}
                rows={6}
                maxLength={1000}
                className="w-full bg-[#2a2a2a] text-white placeholder-gray-500 p-2 rounded border border-gray-600"
                placeholder="ex) 이서아는 그를 사랑하고 있다."
              />
            </div>
            <button
              onClick={handleAddLore}
              className="w-full bg-gray-100 hover:bg-gray-300 text-black py-2 rounded-full font-semibold"
            >
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  )
}