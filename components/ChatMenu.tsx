import { User, Coins, BookOpen, X, PanelRightOpen } from 'lucide-react'
import { useState } from 'react'

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
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            <BookOpen className="w-5 h-5" /> 로어북
          </h2>
          <p className="text-xs text-gray-400">
            로어북 추가 후 그동안의 스토리를 내용 안에 적으면 캐릭터가 잊지 않고 기억해요.
          </p>
          <textarea
            value={lore}
            onChange={(e) => onLoreChange(e.target.value)}
            placeholder="이 캐릭터에 대한 설정이나 배경 이야기를 입력하세요"
            rows={10}
            maxLength={1000}
            className="w-full bg-[#222] text-white p-2 rounded resize-none"
          />
          <button
            onClick={() => {}} // 저장 처리 로직 연결 예정
            className="w-full mt-2 bg-yellow-500 hover:bg-yellow-400 text-black py-2 rounded-full text-sm font-semibold"
          >
            저장
          </button>
        </div>
      )}
    </div>
  )
}
