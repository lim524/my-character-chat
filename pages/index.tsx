import PointBadge from '@/components/PointBadge'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Eye, Heart } from 'lucide-react'
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
        .select('id, name, personality, description, situation, image_url, is_adult')
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
        likes: 0,
        views: 0,
        isAdult: char.is_adult ?? false,
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
                <div
                  key={char.id}
                  onClick={() => openProfile(char)}
                  className="w-56 shrink-0 rounded-2xl overflow-hidden bg-[#1a1a1a] shadow-lg cursor-pointer hover:bg-[#232323] transition-all duration-150"
                  style={{ minWidth: '224px' }}
                >
                  {/* 카드 상단 이미지 */}
                  <div className="relative w-full h-44 bg-black">
                    <Image
                      src={char.imageUrl}
                      alt={char.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {/* 하단 내용 */}
                  <div className="p-4 flex flex-col h-[170px]">
                    <h3 className="text-white font-bold text-base mb-1 line-clamp-1">{char.name}</h3>
                    <div className="flex items-center text-gray-400 text-xs mb-2 gap-4">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4 text-red-400" />
                        {char.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4 text-gray-300" />
                        {char.views}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 flex-1 mb-2">{char.description}</p>
                    {/* 작성자 등 추가 정보 넣고 싶으면 여기에 추가 */}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'ranking' && (
          <>
            <h2 className="text-xl font-bold mb-4">인기 랭킹</h2>
            <div className="space-y-3">
              {[...filteredCharacters]
                .sort((a, b) => b.likes - a.likes)
                .map((char, i) => (
                  <div
                    key={char.id}
                    onClick={() => openProfile(char)}
                    className="bg-[#1a1a1a] shadow-md p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-[#232323] transition-all duration-150"
                  >
                    <span className="text-lg font-bold w-6">{i + 1}</span>
                    <div className="relative w-14 h-14">
                      <Image
                        src={char.imageUrl}
                        alt={char.name}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-sm mb-1">{char.name}</h3>
                      <div className="flex items-center text-gray-400 text-xs gap-4 mb-1">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4 text-red-400" />
                          {char.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4 text-gray-300" />
                          {char.views}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-1">{char.description}</p>
                    </div>
                  </div>
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
