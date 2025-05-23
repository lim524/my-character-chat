import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '@/lib/supabaseClient'

interface Character {
  id: string
  name: string
  description: string
  imageUrl: string
  createdAt: string
  user_id?: string
  isPublic?: boolean
  isCensored?: boolean
}

export default function CharacterList() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUserId(data?.user?.id || null)
    }
    getUser()
  }, [])

  useEffect(() => {
    const fetchCharacters = async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ 캐릭터 불러오기 실패:', error)
      } else {
        setCharacters(data || [])
      }
    }

    fetchCharacters()
  }, [])

  const handleEdit = async (id: string) => {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      alert('캐릭터를 불러오지 못했습니다.')
      return
    }

    const draft = {
      id: data.id,
      name: data.name,
      description: data.description,
      firstLine: data.first_line,
      personality: data.personality,
      tags: data.tags || [],
      isPublic: data.is_public ?? true,
      isCensored: data.is_censored ?? true,
      imageUrl: data.image_url || '',
      emotionImages: data.emotion_images || [],
      userName: data.user_name || '',
      userRole: data.user_role || '',
      userDescription: data.user_description || '',
      situation: data.situation || '',
      occupation: data.details?.occupation || '',
      birthplace: data.details?.birthplace || '',
      age: data.details?.age || '',
      trauma: data.details?.trauma || '',
      relationships: data.details?.relationships || '',
      goal: data.details?.goal || '',
      worldSetting: data.world_setting || '',
      details: {
        occupation: data.details?.occupation || '',
        birthplace: data.details?.birthplace || '',
        age: data.details?.age || '',
        trauma: data.details?.trauma || '',
        relationships: data.details?.relationships || '',
        goal: data.details?.goal || '',
        worldSetting: data.world_setting || '',
        situation: data.situation || '',
      },
      protagonist: data.protagonist || [],
      supporting: data.supporting || [],
    }

    localStorage.setItem('character-draft', JSON.stringify(draft))
    router.push('/create')
  }

  const handleDelete = async (id: string) => {
    const confirmed = confirm('정말 이 캐릭터를 삭제하시겠습니까?')
    if (!confirmed) return

    const { error } = await supabase.from('characters').delete().eq('id', id)

    if (error) {
      alert('삭제 중 오류가 발생했습니다.')
      console.error('❌ 삭제 실패:', error)
      return
    }

    setCharacters((prev) => prev.filter((char) => char.id !== id))
  }

  const filteredCharacters = characters.filter((char) =>
    char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    char.description.toLowerCase().includes(searchTerm.toLowerCase())
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
                className="flex items-start gap-4 bg-[#1c1c1e] rounded-lg p-4"
              >
                <img
                  src={char.imageUrl || '/default-profile.png'}
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

                  {char.user_id === userId && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(char.id)}
                        className="text-sm px-4 py-1 rounded-full bg-white text-black hover:bg-gray-300 transition"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(char.id)}
                        className="text-sm px-4 py-1 rounded-full border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
