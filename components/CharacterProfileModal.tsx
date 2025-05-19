import React from 'react'
import { useRouter } from 'next/router'

type Character = {
  id: string  // ← 반드시 포함되어야 함
  name: string
  personality: string
  description: string
  situation: string
  imageUrl: string
}

interface Props {
  character: Character
  onClose: () => void
  onStartChat?: () => void // 선택적 콜백도 유지 가능
}

export default function CharacterProfileModal({ character, onClose, onStartChat }: Props) {
  const router = useRouter()

const handleStartChat = (mode: 'new' | 'continue') => {
  router.push(`/chat/${character.id}?mode=${mode}`)
  if (onStartChat) onStartChat()
}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#111] text-white p-6 rounded-2xl w-[90%] max-w-md shadow-xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">&times;</button>
<div className="flex flex-col items-center space-y-4">
  <img src={character.imageUrl} alt={character.name} className="w-32 h-32 rounded-full object-cover border border-white" />
  <h2 className="text-2xl font-bold">{character.name}</h2>
  <p className="text-sm text-gray-400">{character.description}</p>
  <div className="bg-[#1c1c1e] border border-[#333] rounded p-3 text-sm w-full whitespace-pre-wrap">
    {character.situation}
  </div>

  {/* 두 개의 버튼 */}
  <div className="flex gap-3 w-full mt-4">
    {/* 이어하기 버튼 */}
    <button
      onClick={() => handleStartChat('continue')}
      className="flex-1 border border-gray-500 text-gray-300 hover:bg-gray-800 transition rounded py-2 text-sm"
    >
      이어서 대화하기
    </button>

    {/* 새로 시작 버튼 */}
    <button
      onClick={() => handleStartChat('new')}
      className="flex-1 bg-white text-black hover:bg-gray-200 transition rounded py-2 text-sm font-semibold"
    >
      새로 대화하기
    </button>
  </div>
</div>

      </div>
    </div>
  )
}
