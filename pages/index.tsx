import PointBadge from '@/components/PointBadge'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Eye, Heart } from 'lucide-react'
import CharacterProfileModal from '@/components/CharacterProfileModal'
import { createClient } from '@supabase/supabase-js'

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
}

export default function HomePage() {
  const router = useRouter()
  const [characters, setCharacters] = useState<Character[]>([])
  const [activeTab, setActiveTab] = useState<'recommend' | 'ranking'>('recommend')
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)

  useEffect(() => {
    const fetchCharacters = async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('id, name, personality, description, situation, image_url')
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
        likes: 0, // ← 임시 기본값
        views: 0,
      }))

      setCharacters(processed)
    }

    fetchCharacters()
  }, [])

  const openProfile = (char: Character) => {
    setSelectedCharacter(char)
  }

  const goToChat = (id: string) => {
    setSelectedCharacter(null)
    router.push(`/chat/${encodeURIComponent(id)}`)
  }

  return (
    <main className="bg-black text-white min-h-screen px-4 pt-28 pb-32">
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

      {activeTab === 'recommend' && (
        <>
          <h2 className="text-xl font-bold mb-4">추천 캐릭터</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {characters.slice(0, 10).map((char) => (
              <div
                key={char.id}
                onClick={() => openProfile(char)}
                className="w-48 shrink-0 rounded-2xl overflow-hidden bg-zinc-900 cursor-pointer hover:bg-zinc-800"
              >
                <div className="relative w-full h-[200px] bg-black">
                    <Image
                      src={char.imageUrl}
                      alt={char.name}
                      fill
                      className="object-cover rounded-none"
                    />
                  </div>
                  <div className="p-3">
                  <h3 className="text-white font-semibold text-sm">{char.name}</h3>
                  <p className="text-xs text-gray-400">{char.description}</p>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-red-500" />
                      {char.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {char.views}
                    </span>
                  </div>
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
            {[...characters]
              .sort((a, b) => b.likes - a.likes)
              .map((char, i) => (
                <div
                  key={char.id}
                  onClick={() => openProfile(char)}
                  className="bg-white/10 backdrop-blur-md p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-white/20"
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
                  <div>
                    <h3 className="font-semibold text-white text-sm">{char.name}</h3>
                    <p className="text-xs text-gray-400">{char.description}</p>
                  </div>
                  <div className="ml-auto text-right text-xs text-gray-400 flex flex-col items-end gap-1">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-red-500" />
                      {char.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {char.views}
                    </span>
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
    <PointBadge />
    </main>

  )
}
