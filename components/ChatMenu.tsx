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
    <div className="w-full max-w-md bg-white text-black p-4 space-y-6 h-screen overflow-y-auto relative">
      {/* 닫기 버튼 */}
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black">
        <X className="w-5 h-5" />
      </button>

      {/* 포인트 표시 */}
      <div className="flex items-center gap-2 text-lg font-bold text-black">
        <Coins className="w-5 h-5" />
        보유 포인트: {point}P
      </div>

      {/* 탭 버튼 */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setActiveTab('user')}
          className={`px-4 py-1 rounded-full text-sm font-medium ${
            activeTab === 'user' ? 'bg-black text-white' : 'bg-gray-200 text-black'
          }`}
        >
          내 정보 수정
        </button>
        <button
          onClick={() => setActiveTab('lore')}
          className={`px-4 py-1 rounded-full text-sm font-medium ${
            activeTab === 'lore' ? 'bg-black text-white' : 'bg-gray-200 text-black'
          }`}
        >
          로어북
        </button>
      </div>

      {/* 사용자 설정 탭 */}
      {activeTab === 'user' && (
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <User className="w-5 h-5" /> 사용자 설정
          </h2>
          <input
            type="text"
            value={userName}
            onChange={(e) => onUserChange('name', e.target.value)}
            placeholder="사용자 이름"
            className="w-full bg-black text-white p-2 rounded"
          />
          <textarea
            value={userDescription}
            onChange={(e) => onUserChange('description', e.target.value)}
            placeholder="사용자 설명 (최대 1000자)"
            maxLength={1000}
            rows={5}
            className="w-full bg-black text-white p-2 rounded resize-none"
          />
        </div>
      )}

      {/* 로어북 탭 */}
      {activeTab === 'lore' && (
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <BookOpen className="w-5 h-5" /> 로어북
          </h2>
          <p className="text-xs text-gray-500">
            로어북 추가 후 그동안의 스토리를 내용 안에 적으면 캐릭터가 잊지 않고 기억해요.
          </p>
          <button
            onClick={() => setShowLoreModal(true)}
            className="bg-white border border-gray-400 hover:bg-gray-100 text-black px-4 py-1 rounded text-sm"
          >
            + 새 로어북 추가
          </button>

          <div className="space-y-2">
            {loreList.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-black text-white p-2 rounded">
                <span className="text-sm truncate max-w-[180px]">{item.title}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={() => handleToggleLore(item.id)}
                    className="w-4 h-4 accent-black"
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-black text-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">로어북 작성</h3>
              <button onClick={() => setShowLoreModal(false)}>
                <X className="w-5 h-5 text-gray-300 hover:text-white" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">제목 <span className="text-gray-400 text-xs">ex) 안녕친구들</span></label>
              <input
                value={newLoreTitle}
                onChange={(e) => setNewLoreTitle(e.target.value)}
                className="w-full bg-white text-black p-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">내용 <span className="text-gray-400 text-xs">ex) 첫눈이 내리는 날, 벤치에서 사랑을 고백했다.</span></label>
              <textarea
                value={newLoreContent}
                onChange={(e) => setNewLoreContent(e.target.value)}
                rows={6}
                maxLength={1000}
                className="w-full bg-white text-black p-2 rounded"
              />
            </div>
            <button
              onClick={handleAddLore}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black py-2 rounded-full font-semibold"
            >
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
