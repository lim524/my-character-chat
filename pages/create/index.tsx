import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import TopNav from '@/components/TopNav'
import CreateStepTab from '@/components/CreateStepTab'

export default function ProfileTab() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [firstLine, setFirstLine] = useState('')
  const [personality, setPersonality] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const router = useRouter()

  // 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('character-draft')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setName(parsed.name || '')
        setDescription(parsed.description || '')
        setFirstLine(parsed.firstLine || '')
        setPersonality(parsed.personality || '')
      } catch (e) {
        console.error('character-draft 파싱 실패', e)
      }
    }
    setIsLoaded(true)
  }, [])

  // 저장하기
  useEffect(() => {
    if (!isLoaded) return
    const prev = localStorage.getItem('character-draft')
    const parsed = prev ? JSON.parse(prev) : {}
    const updated = {
      ...parsed,
      name,
      description,
      firstLine,
      personality,
    }
    localStorage.setItem('character-draft', JSON.stringify(updated))
  }, [name, description, firstLine, personality, isLoaded])

  const handleNext = () => {
    router.push('/create/setting')
  }

  if (!isLoaded) return null

  return (
    <div className="bg-[#0d0d0d] min-h-screen text-white">
      <TopNav />
      <div className="bg-[#111] border-b border-[#333]">
        <CreateStepTab />
      </div>

      <div className="p-6 pt-12 max-w-2xl mx-auto space-y-10">
        {/* 소설 제목 */}
        <div>
          <label className="block mb-2 text-sm font-semibold text-white">소설 제목</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="소설 제목을 입력해 주세요."
            className="w-full bg-[#1c1c1e] border border-[#333] p-3 rounded text-white placeholder-gray-500"
          />
          <div className="text-right text-xs text-gray-400 mt-1">{name.length}/100</div>
        </div>

        {/* 프로필 */}
        <div>
          <label className="block mb-2 text-sm font-semibold text-white">프로필</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            placeholder="소설에 대한 간략한 소개를 입력해 주세요."
            className="w-full bg-[#1c1c1e] border border-[#333] p-3 rounded text-white resize-none placeholder-gray-500"
          />
          <div className="text-right text-xs text-gray-400 mt-1">{description.length}/300</div>
        </div>

        {/* 다음 버튼 */}
        <div className="text-center pt-6">
          <button
            onClick={handleNext}
            className="px-6 py-3 rounded border border-white text-white hover:bg-white hover:text-black font-semibold transition"
          >
            다음단계 →
          </button>
        </div>
      </div>
    </div>
  )
}
