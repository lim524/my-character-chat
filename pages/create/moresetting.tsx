// pages/create/moresetting.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import CreateStepTab from '@/components/CreateStepTab'
import TopNav from '@/components/TopNav'
import { EyeOff, Users } from 'lucide-react' 

export default function MoresettingPage() {
  const [isPublic, setIsPublic] = useState(true)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const [isAdult, setIsAdult] = useState(false)


  const [userName, setUserName] = useState('')
  const [userDescription, setUserDescription] = useState('')

  const [protagonist, setProtagonist] = useState([{ name: '', description: '' }])
  const [supporting, setSupporting] = useState([{ name: '', description: '' }])

  const [isLoaded, setIsLoaded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('character-draft')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setIsPublic(parsed.isPublic ?? true)
        setTags(parsed.tags || [])
        setUserName(parsed.userName || '')
        setUserDescription(parsed.userDescription || '')
        setProtagonist(parsed.protagonist || [{ name: '', description: '' }])
        setSupporting(parsed.supporting || [{ name: '', description: '' }])
        setIsAdult(parsed.isAdult ?? false)  
      } catch (e) {
        console.error('character-draft 파싱 실패', e)
      }
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    const prev = localStorage.getItem('character-draft')
    const parsed = prev ? JSON.parse(prev) : {}
    const updated = {
      ...parsed,
      isPublic,
      tags,
      userName,
      userDescription,
      protagonist,
      supporting,
      isAdult,
    }
    localStorage.setItem('character-draft', JSON.stringify(updated))
  }, [isPublic, tags, userName, userDescription, protagonist, supporting, isLoaded, isAdult])

  const handleNext = () => {
    router.push('/create/image')
  }

  const handleAddTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
    }
    setTagInput('')
  }

  const handleCharacterChange = (
    type: 'protagonist' | 'supporting',
    index: number,
    field: 'name' | 'description',
    value: string
  ) => {
    const update = type === 'protagonist' ? [...protagonist] : [...supporting]
    update[index][field] = value
    type === 'protagonist' ? setProtagonist(update) : setSupporting(update)
  }

  const handleAddCharacter = (type: 'protagonist' | 'supporting') => {
    const current = type === 'protagonist' ? protagonist : supporting
    if (current.length >= 10) return
    const updated = [...current, { name: '', description: '' }]
    type === 'protagonist' ? setProtagonist(updated) : setSupporting(updated)
  }

  const handleRemoveCharacter = (type: 'protagonist' | 'supporting', index: number) => {
    const current = type === 'protagonist' ? [...protagonist] : [...supporting]
    current.splice(index, 1)
    type === 'protagonist' ? setProtagonist(current) : setSupporting(current)
  }

  const tagOptions = ['냉정함', '다정함', '츤데레', '마법사용자', '전사', '아이돌', '학자', '도적']

  if (!isLoaded) return null

  return (
    <div className="bg-[#0d0d0d] min-h-screen text-white">
      <TopNav />
      <div className="bg-[#111] border-b border-[#333]">
        <CreateStepTab />
      </div>

      <div className="pt-16 px-6 pb-16 max-w-2xl mx-auto space-y-10">
        {/* 공개 여부 */}
        <div>
          <label className="block mb-2 text-sm font-semibold">공개 여부</label>
          <div className="flex gap-4">
            <button
              onClick={() => setIsPublic(true)}
              className={`px-4 py-2 rounded border transition font-semibold ${
                isPublic ? 'border-white text-black bg-white' : 'border-white text-white'
              }`}
            >
              공개
            </button>
            <button
              onClick={() => setIsPublic(false)}
              className={`px-4 py-2 rounded border transition font-semibold ${
                !isPublic ? 'border-white text-black bg-white' : 'border-white text-white'
              }`}
            >
              비공개
            </button>
          </div>
        </div>

        {/* 선정적 콘텐츠 포함 여부 */}
        <div>
          <label className="block mb-2 text-sm font-semibold">
            선정적인 콘텐츠 포함 여부 <span className="text-red-500">*</span>
          </label>

          <div className="bg-[#1c1c1e] border border-[#333] rounded-lg p-4 space-y-3">
            <div
              onClick={() => setIsAdult(false)}
              className={`flex items-center gap-3 p-3 rounded cursor-pointer transition border ${
                !isAdult ? 'bg-[#333] border-white' : 'border-[#444] hover:border-white'
              }`}
            >
              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                  style={{ borderColor: !isAdult ? '#fff' : '#666' }}>
                {!isAdult && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <p className="text-white font-semibold">모든 이용자가 사용 가능해요</p>
              </div>
              </div>
            </div>

            <div
              onClick={() => setIsAdult(true)}
              className={`flex items-center gap-3 p-3 rounded cursor-pointer transition border ${
                isAdult ? 'bg-[#333] border-white' : 'border-[#444] hover:border-white'
              }`}
            >
              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                  style={{ borderColor: isAdult ? '#fff' : '#666' }}>
                {isAdult && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
              </div>
              <div>
               <div className="flex items-center gap-2">
              <EyeOff className="w-5 h-5" />
              <p className="text-white font-semibold">성인 이용자만 사용 가능해요</p>
            </div>
            </div>
            </div>
          </div>
        </div>

        {/* 태그 선택 */}
        <div>
          <label className="block mb-2 text-sm font-semibold">태그 선택</label>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddTag()
              }
            }}
            placeholder="태그를 입력 후 엔터를 누르세요"
            className="w-full bg-[#1c1c1e] border border-[#333] p-3 rounded text-white placeholder-gray-500 mb-4"
          />
          <div className="flex flex-wrap gap-2">
            {tags.length === 0
              ? tagOptions.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setTags([...tags, tag])}
                    className="px-3 py-1 rounded-full text-sm border border-white text-white hover:bg-white hover:text-black transition"
                  >
                    #{tag}
                  </button>
                ))
              : tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="px-3 py-1 rounded-full text-sm border border-white text-white hover:bg-white hover:text-black transition"
                  >
                    #{tag} ✕
                  </button>
                ))}
          </div>
        </div>

        <p className="text-sm text-gray-400 mt-2">
          ※ 주연, 조연은 각각 4명까지 캐릭터를 생성할 수 있습니다.
        </p>

        {/* 주연 캐릭터 */}
        <div className="space-y-4">
          <label className="block text-sm font-semibold">주요 캐릭터 설정</label>
          {protagonist.map((char, index) => (
            <div key={index} className="space-y-2 border border-[#333] p-4 rounded">
              <input
                value={char.name}
                onChange={(e) => handleCharacterChange('protagonist', index, 'name', e.target.value)}
                placeholder="주연 캐릭터 이름"
                className="w-full bg-[#1c1c1e] border border-[#444] p-2 rounded text-white"
              />
              <textarea
                value={char.description}
                onChange={(e) => handleCharacterChange('protagonist', index, 'description', e.target.value)}
                maxLength={500}
                placeholder="설명 (500자)"
                className="w-full bg-[#1c1c1e] border border-[#444] p-2 rounded text-white resize-none"
                rows={2}
              />
              {protagonist.length > 1 && (
                <button onClick={() => handleRemoveCharacter('protagonist', index)} className="text-red-400 text-sm underline">
                  삭제
                </button>
              )}
            </div>
          ))}
          {protagonist.length < 4 && (
            <button onClick={() => handleAddCharacter('protagonist')} className="text-sm text-white border border-white px-4 py-2 rounded hover:bg-white hover:text-black transition">
              + 주연 캐릭터 추가
            </button>
          )}
        </div>

        {/* 조연 캐릭터 */}
        <div className="space-y-4">
          <label className="block text-sm font-semibold">조연 캐릭터 설정</label>
          {supporting.map((char, index) => (
            <div key={index} className="space-y-2 border border-[#333] p-4 rounded">
              <input
                value={char.name}
                onChange={(e) => handleCharacterChange('supporting', index, 'name', e.target.value)}
                placeholder="조연 캐릭터 이름"
                className="w-full bg-[#1c1c1e] border border-[#444] p-2 rounded text-white"
              />
              <textarea
                value={char.description}
                onChange={(e) => handleCharacterChange('supporting', index, 'description', e.target.value)}
                maxLength={300}
                placeholder="설명 (300자)"
                className="w-full bg-[#1c1c1e] border border-[#444] p-2 rounded text-white resize-none"
                rows={2}
              />
              {supporting.length > 1 && (
                <button onClick={() => handleRemoveCharacter('supporting', index)} className="text-red-400 text-sm underline">
                  삭제
                </button>
              )}
            </div>
          ))}
          {supporting.length < 4 && (
            <button onClick={() => handleAddCharacter('supporting')} className="text-sm text-white border border-white px-4 py-2 rounded hover:bg-white hover:text-black transition">
              + 조연 캐릭터 추가
            </button>
          )}
        </div>

        {/* 다음 단계 */}
        <div className="text-center pt-10">
          <button onClick={handleNext} className="px-6 py-3 rounded border border-white text-white hover:bg-white hover:text-black font-semibold transition">
            다음단계 →
          </button>
        </div>
      </div>
    </div>
  )
}
