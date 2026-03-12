import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import CharacterProfileModal from '@/components/CharacterProfileModal'
import { getLocalCharacters, type LocalCharacter } from '@/lib/localStorage'
import { useSearch } from '@/context/SearchContext'

interface Character {
  id: string
  name: string
  personality: string
  description: string
  situation: string
  imageUrl: string
  isAdult?: boolean
  tags: string[]
  userName: string
}

function toDisplayCharacter(c: LocalCharacter): Character {
  const img = c.imageUrl ?? c.image_url
  const firstEmotion = c.emotionImages?.[0] ?? c.emotion_images?.[0]
  const imageUrl =
    (typeof img === 'string' && (img.startsWith('http') || img.startsWith('data:')))
      ? img
      : firstEmotion?.imageUrl ?? '/default-profile.png'
  return {
    id: c.id,
    name: c.name,
    personality: c.personality ?? '',
    description: c.description ?? '',
    situation: c.situation ?? '',
    imageUrl,
    isAdult: c.isAdult ?? c.is_adult ?? false,
    tags: Array.isArray(c.tags) ? c.tags.slice(0, 2) : [],
    userName: c.userName ?? c.user_name ?? '익명',
  }
}

export default function HomePage() {
  const router = useRouter()
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const { searchQuery, setSearchQuery, showSearch } = useSearch()

  useEffect(() => {
    const list = getLocalCharacters()
    const showPublic = list.filter((c) => c.is_public !== false && c.isPublic !== false)
    setCharacters(showPublic.map(toDisplayCharacter))
  }, [])

  const openProfile = (char: Character) => {
    setSelectedCharacter(char)
  }

  const goToChat = (id: string) => {
    setSelectedCharacter(null)
    router.push(`/chat/${encodeURIComponent(id)}`)
  }

  const filteredCharacters = characters.filter((char) =>
    char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    char.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  function CharacterCard({ char }: { char: Character }) {
    return (
      <div
        onClick={() => openProfile(char)}
        className="w-64 bg-[#222] rounded-2xl shadow-lg cursor-pointer hover:bg-[#242428] transition-all relative flex flex-col pb-3"
        style={{ minWidth: '256px' }}
      >
        <div className="relative w-full h-56 rounded-t-2xl overflow-hidden">
          <Image
            src={char.imageUrl}
            alt={char.name}
            fill
            className="object-cover"
            priority
            unoptimized={char.imageUrl.startsWith('data:')}
          />
        </div>
        <div className="flex flex-col px-4 pt-3">
          <div className="font-bold text-base mb-1 line-clamp-1">{char.name}</div>
          <div className="text-xs text-gray-300 mb-2 line-clamp-1">{char.description}</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {char.tags.map((tag) => (
              <span
                key={tag}
                className="bg-[#33384b] text-xs text-[#e1e7ff] font-semibold px-3 py-1 rounded-lg"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="text-xs text-gray-400">@{char.userName}</div>
        </div>
      </div>
    )
  }

  return (
    <main className="bg-black text-white min-h-screen px-4 pt-28 pb-32">
      {showSearch && (
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="캐릭터 검색..."
            className="w-full px-4 py-2 rounded bg-[#1c1c1c] text-white border border-[#444] placeholder-gray-500"
          />
        </div>
      )}

      <h2 className="text-xl font-bold mb-4">캐릭터</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {filteredCharacters.map((char) => (
          <CharacterCard key={char.id} char={char} />
        ))}
      </div>

      {selectedCharacter && (
        <CharacterProfileModal
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
          onStartChat={() => goToChat(selectedCharacter.id)}
        />
      )}
    </main>
  )
}
