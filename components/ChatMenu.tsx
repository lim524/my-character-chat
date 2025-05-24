import { User, Coins, BookOpen } from 'lucide-react'

interface ChatMenuProps {
  userName: string
  userDescription: string
  onUserChange: (field: 'name' | 'description', value: string) => void
  point: number
  lore: string
  onLoreChange: (value: string) => void
}

export default function ChatMenu({
  userName,
  userDescription,
  onUserChange,
  point,
  lore,
  onLoreChange,
}: ChatMenuProps) {
  return (
    <div className="w-full max-w-md bg-[#111] text-white p-4 space-y-6">
      {/* 포인트 표시 */}
      <div className="flex items-center gap-2 text-lg font-bold text-yellow-400">
        <Coins className="w-5 h-5" />
        보유 포인트: {point}P
      </div>

      {/* 사용자 설정 */}
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

      {/* 로어북 */}
      <div className="space-y-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-white">
          <BookOpen className="w-5 h-5" /> 로어북
        </h2>
        <textarea
          value={lore}
          onChange={(e) => onLoreChange(e.target.value)}
          placeholder="이 캐릭터에 대한 설정이나 배경 이야기를 입력하세요"
          rows={8}
          className="w-full bg-[#222] text-white p-2 rounded resize-none"
        />
        <p className="text-xs text-gray-400">
          AI가 이 내용을 참고하여 더 몰입감 있는 대화를 진행할 수 있어요.
        </p>
      </div>
    </div>
  )
}