import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  getLocalCharacters,
  deleteLocalCharacter,
  type LocalCharacter,
} from '@/lib/localStorage'
import CharacterProfileModal from '@/components/CharacterProfileModal'

interface Character {
  id: string
  name: string
  description: string
  imageUrl: string
  createdAt: string
  personality: string
  situation: string
}

function toListCharacter(c: LocalCharacter): Character {
  const img = c.imageUrl ?? c.image_url
  const firstEmotion = c.emotionImages?.[0] ?? c.emotion_images?.[0]
  const imageUrl =
    typeof img === 'string' && (img.startsWith('http') || img.startsWith('data:'))
      ? img
      : firstEmotion?.imageUrl ?? '/default-profile.png'
  return {
    id: c.id,
    name: c.name ?? '',
    description: c.description ?? '',
    imageUrl,
    createdAt: c.created_at ?? c.createdAt ?? new Date().toISOString(),
    personality: c.personality ?? '',
    situation: c.situation ?? '',
  }
}

export default function CharacterList() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const router = useRouter()

  const loadCharacters = () => {
    setCharacters(getLocalCharacters().map(toListCharacter))
  }

  useEffect(() => {
    loadCharacters()
  }, [])

  const handleEdit = (id: string) => {
    const list = getLocalCharacters()
    const char = list.find((c) => c.id === id)
    if (!char) {
      alert('캐릭터를 불러오지 못했습니다.')
      return
    }
    const draft = {
      id: char.id,
      name: char.name,
      description: char.description ?? '',
      firstLine: char.firstLine ?? '',
      personality: char.personality ?? '',
      tags: char.tags ?? [],
      isPublic: char.isPublic ?? char.is_public ?? true,
      isCensored: true,
      imageUrl: char.imageUrl ?? char.image_url ?? '',
      emotionImages: char.emotionImages ?? char.emotion_images ?? [],
      userName: char.userName ?? char.user_name ?? '',
      userRole: char.userRole ?? char.user_role ?? '',
      userDescription: char.userDescription ?? char.user_description ?? '',
      situation: char.situation ?? '',
      worldSetting: char.worldSetting ?? char.world_setting ?? '',
      details: char.details ?? {},
      protagonist: char.protagonist ?? [],
      supporting: char.supporting ?? [],
    }
    try {
      localStorage.setItem('character-draft', JSON.stringify(draft))
    } catch (e) {
      console.error(e)
      alert(
        '편집용 임시 데이터를 저장하지 못했습니다. 캐릭터·이미지 용량이 너무 크면 브라우저 저장 한도를 넘을 수 있습니다.'
      )
      return
    }
    router.push('/create')
  }

  const handleDelete = (id: string) => {
    if (!confirm('정말 이 캐릭터를 삭제하시겠습니까?')) return
    deleteLocalCharacter(id)
    setCharacters((prev) => prev.filter((char) => char.id !== id))
  }

  const q = searchTerm.toLowerCase()
  const filteredCharacters = characters.filter(
    (char) =>
      (char.name ?? '').toLowerCase().includes(q) ||
      (char.description ?? '').toLowerCase().includes(q)
  )

  return (
    <div className="bg-[#111] text-white min-h-screen px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">캐릭터 목록</h1>

        <div className="mb-4">
          <input
            type="text"
            placeholder="캐릭터 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded bg-[#222] border border-[#444] text-sm text-white placeholder-gray-400"
          />
        </div>

        {filteredCharacters.length === 0 ? (
          <p className="text-gray-400">검색 결과가 없습니다.</p>
        ) : (
          <ul className="space-y-4">
            {filteredCharacters.map((char) => (
              <li
                key={char.id}
                onClick={() => setSelectedCharacter(char)}
                className="flex items-start gap-4 bg-[#1c1c1e] rounded-lg p-4 cursor-pointer hover:bg-[#2a2a2a]"
              >
                <img
                  src={char.imageUrl}
                  alt={char.name}
                  className="w-14 h-14 rounded-full object-cover border border-[#333]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base font-semibold">{char.name}</span>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2">{char.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    생성일: {new Date(char.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(char.id)
                      }}
                      className="text-sm px-4 py-1 rounded-full bg-white text-black hover:bg-gray-300 transition"
                    >
                      수정
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(char.id)
                      }}
                      className="text-sm px-4 py-1 rounded-full border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {selectedCharacter && (
          <CharacterProfileModal
            character={selectedCharacter}
            onClose={() => setSelectedCharacter(null)}
            onStartChat={() => {
              setSelectedCharacter(null)
              router.push(`/chat/${encodeURIComponent(selectedCharacter.id)}`)
            }}
          />
        )}
      </div>
    </div>
  )
}
