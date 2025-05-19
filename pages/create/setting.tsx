// /create/setting.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import CreateStepTab from '@/components/CreateStepTab'
import TopNav from '@/components/TopNav'

export default function LoreBookTab() {
  const [situation, setSituation] = useState('')
  const [worldSetting, setWorldSetting] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const router = useRouter()

  // 초기 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('character-draft')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const details = parsed.details || {}
        setSituation(details.situation || parsed.situation || '')
        setWorldSetting(details.worldSetting || parsed.worldSetting || '')
      } catch (e) {
        console.error('character-draft 파싱 실패', e)
      }
    }
    setIsLoaded(true)
  }, [])

  // 저장
  useEffect(() => {
    if (!isLoaded) return
    const prev = localStorage.getItem('character-draft')
    const parsed = prev ? JSON.parse(prev) : {}
    const updated = {
      ...parsed,
      situation,
      worldSetting,
      details: {
        ...(parsed.details || {}),
        situation,
        worldSetting,
      },
    }
    localStorage.setItem('character-draft', JSON.stringify(updated))
  }, [situation, worldSetting, isLoaded])

  const handleNext = () => {
    router.push('/create/moresetting')
  }

  if (!isLoaded) return null

  return (
    <div className="bg-[#0d0d0d] min-h-screen text-white">
      <TopNav />
      <div className="bg-[#111] border-b border-[#333]">
        <CreateStepTab />
      </div>

      <div className="pt-16 px-6 pb-24 max-w-2xl mx-auto space-y-10">
        {/* 처음 상황 나레이션 */}
        <div>
          <label className="block mb-2 text-sm font-semibold text-white">처음 상황 나레이션</label>
          <textarea
            name="situation"
            placeholder="대화 시작 전 처음 상황을 설명하세요. 예: 성 안에서 눈을 뜬 당신 앞에 누군가 서 있다."
            maxLength={1000}
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            className="w-full bg-[#1c1c1e] border border-[#333] p-3 rounded resize-none text-white placeholder-gray-500"
            rows={6}
          />
          <p className="text-right text-sm text-gray-500 mt-1">
            {situation.length} / 1000
          </p>
        </div>

        {/* 주요 설정 */}
        <div>
          <label className="block mb-2 text-sm font-semibold text-white">주요 설정 (세계관)</label>
          <textarea
            name="worldSetting"
            placeholder="이 세계관에 대한 전체 설정을 자유롭게 작성해보세요. (배경, 직업, 관계 등)"
            maxLength={3000}
            value={worldSetting}
            onChange={(e) => setWorldSetting(e.target.value)}
            className="w-full bg-[#1c1c1e] border border-[#333] p-3 rounded resize-none text-white placeholder-gray-500"
            rows={10}
          />
          <p className="text-right text-sm text-gray-500 mt-1">
            {worldSetting.length} / 3000
          </p>
        </div>

        {/* 다음 단계 버튼 */}
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
