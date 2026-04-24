import Image from 'next/image'
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

const handleStartChat = () => {
  onClose()
  setTimeout(() => {
    router.replace(`/chat/${character.id}`) // ✅ mode 쿼리 제거
    if (onStartChat) onStartChat()
  }, 10)
}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#111] text-white p-6 rounded-2xl w-[90%] max-w-md shadow-xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">&times;</button>
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-32 h-32">
            <Image
              src={character.imageUrl || '/default-profile.png'}
              alt={character.name}
              fill
              className="rounded-full object-cover border border-white"
            />
          </div>
          <h2 className="text-2xl font-bold">{character.name}</h2>
          <p className="text-sm text-gray-400">{character.description}</p>
          <div className="bg-[#1c1c1e] border border-[#333] rounded p-3 text-sm w-full whitespace-pre-wrap">
            {character.situation}
          </div>

          {/* 단일 버튼 */}
          <div className="w-full mt-4">
            <button
              onClick={handleStartChat}
              className="w-full bg-[#e45463] text-white hover:bg-[#d04352] transition rounded-xl py-3 text-sm font-bold shadow-lg shadow-[#e45463]/20"
            >
              채팅하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
