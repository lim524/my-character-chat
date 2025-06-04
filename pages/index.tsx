import PointBadge from '@/components/PointBadge'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Heart } from 'lucide-react'
import CharacterProfileModal from '@/components/CharacterProfileModal'
import { createClient } from '@supabase/supabase-js'
import { useSearch } from '@/context/SearchContext'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface RawCharacter {
  id: string
  name: string
  personality: string
  description: string
  situation: string
  image_url?: string
  is_adult?: boolean
  tags?: string[] // 예시: tags 필드 (string[])
  author?: string // 예시: author
}

interface Character {
  id: string
  name: string
  personality: string
  description: string
  situation: string
  imageUrl: string
  likes: number
  views: number
  isAdult?: boolean
  tags: string[]
  author: string
}

export default function HomePage() {
  const router = useRouter()
  const [characters, setCharacters] = useState<Character[]>([])
  const [activeTab, setActiveTab] = useState<'recommend' | 'ranking'>('recommend')
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const { searchQuery, setSearchQuery, showSearch } = useSearch()
  const [safetyFilter, setSafetyFilter] = useState(true)

  useEffect(() => {
    const fetchCharacters = async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('id, name, personality, description, situation, image_url, is_adult, tags, author')
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ 캐릭터 불러오기 실패:', error)
        return
      }

      const processed = (data || []).map((char: RawCharacter) => ({
        id: char.id,
        name: char.name,
        personality: char.personality,
        description: char.description,
        situation: char.situation,
        imageUrl: char.image_url?.startsWith('http')
          ? char.image_url
          : '/default-profile.png',
        likes: Math.floor(Math.random() * 800), // 샘플용, 실제는 DB 컬럼 사용
        views: Math.floor(Math.random() * 1000),
        isAdult: char.is_adult ?? false,
        tags: Array.isArray(char.tags) ? char.tags : [],
        author: char.author ?? '익명',
      }))

      setCharacters(processed)
    }

    const filter = localStorage.getItem('safety-filter')
    setSafetyFilter(filter === 'true')

    fetchCharacters()
  }, [])

  const openProfile = (char: Character) => {
    setSelectedCharacter(char)
  }

  const goToChat = (id: string) => {
    setSelectedCharacter(null)
    router.push(`/chat/${encodeURIComponent(id)}`)
  }

  const filteredCharacters = characters.filter((char) => {
    const matchesSearch =
      char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.description.toLowerCase().includes(searchQuery.toLowerCase())

    const allowBySafety = !safetyFilter || !char.isAdult // 세이프티 ON이면 성인물 제외

    return matchesSearch && allowBySafety
  })

  // ----- 카드 UI만 리디자인 시작 -----
  function CharacterCard({ char, rank }: { char: Character; rank?: number }) {
    return (
      <div
        onClick={() => openProfile(char)}
        className="w-60 shrink-0 bg-[#1a1a1a] rounded-xl shadow-lg cursor-pointer hover:bg-[#232323] transition-all relative flex flex-col"
        style={{ minWidth: '240px' }}
      >
        {/* 이미지 및 오른쪽 상단 뱃지 */}
        <div className="relative w-full h-56 rounded-t-xl overflow-hidden">
          <Image
            src={char.imageUrl}
            alt={char.name}
            fill
            className="object-cover"
          />
          {/* 우상단 카운트 뱃지(예: 조회수) */}
          <span className="absolute top-2 right-2 bg-black/70 text-white text-xs font-semibold rounded-full px-3 py-1">
            {char.views}
          </span>
          {/* 랭킹이면 좌상단 랭킹 넘버 */}
          {typeof rank === 'number' && (
            <span className="absolute top-2 left-2 bg-indigo-500/80 text-white text-xs font-semibold rounded-full px-2 py-1">
              {rank + 1}
            </span>
          )}
        </div>
        {/* 아래 텍스트 블럭 */}
        <div className="flex flex-col px-4 pt-3 pb-4 flex-1">
          <div className="font-bold text-base mb-1 line-clamp-1">{char.name}</div>
          <div className="text-xs text-gray-400 mb-2 line-clamp-1">{char.description}</div>
          {/* 태그 */}
          <div className="flex flex-wrap gap-1 mb-2">
            {char.tags?.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="bg-[#222] text-xs text-indigo-200 font-semibold px-2 py-0.5 rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between mt-auto">
            <span className="text-xs text-gray-500">@{char.author}</span>
            <span className="flex items-center text-xs text-gray-400 gap-1">
              <Heart className="w-4 h-4 text-pink-400" />
              {char.likes}
            </span>
          </div>
        </div>
      </div>
    )
  }
  // ----- 카드 UI만 리디자인 끝 -----

  return (
    <>
      <main className="bg-black text-white h-screen px-4 pt-28 pb-32">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('recommend')}
            className={`px-4 py-1 rounded-full text-sm font-medium ${
              activeTab === 'recommend' ? 'bg-white text-black' : 'bg-white/10 text-white'
            }`}
          >
            추천
          </button>
          <button
            onClick={() => setActiveTab('ranking')}
            className={`px-4 py-1 rounded-full text-sm font-medium ${
              activeTab === 'ranking' ? 'bg-white text-black' : 'bg-white/10 text-white'
            }`}
          >
            랭킹
          </button>
        </div>

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

        {activeTab === 'recommend' && (
          <>
            <h2 className="text-xl font-bold mb-4">추천 캐릭터</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {filteredCharacters.slice(0, 10).map((char) => (
                <CharacterCard key={char.id} char={char} />
              ))}
            </div>
          </>
        )}

        {activeTab === 'ranking' && (
          <>
            <h2 className="text-xl font-bold mb-4">인기 랭킹</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {[...filteredCharacters]
                .sort((a, b) => b.likes - a.likes)
                .map((char, i) => (
                  <CharacterCard key={char.id} char={char} rank={i} />
                ))}
            </div>
          </>
        )}

        {selectedCharacter && (
          <CharacterProfileModal
            character={selectedCharacter}
            onClose={() => setSelectedCharacter(null)}
            onStartChat={() => goToChat(selectedCharacter.id)}
          />
        )}
      </main>
      <PointBadge />
    </>
  )
}
