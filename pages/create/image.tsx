import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { v4 as uuidv4 } from 'uuid'
import Image from 'next/image'
import TopNav from '@/components/TopNav'
import CreateStepTab from '@/components/CreateStepTab'
import { saveLocalCharacter, type LocalCharacter } from '@/lib/localStorage'

interface EmotionImage {
  id: string
  imageUrl: string
  label: string
}

export default function EmotionImagePage() {
  const [images, setImages] = useState<EmotionImage[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const draft = localStorage.getItem('character-draft')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        if (Array.isArray(parsed.emotionImages)) {
          setImages(parsed.emotionImages)
          return
        }
      } catch (e) {
        console.error('draft.emotionImages 파싱 오류', e)
      }
    }
    const saved = localStorage.getItem('emotionImages')
    if (saved) {
      try {
        setImages(JSON.parse(saved))
      } catch (e) {
        console.error('emotionImages 파싱 오류', e)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('emotionImages', JSON.stringify(images))
  }, [images])

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || images.length >= 80) return
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 최대 5MB입니다.')
      return
    }
    setLoading(true)
    const reader = new FileReader()
    reader.onload = () => {
      setImages((prev) => [...prev, { id: uuidv4(), imageUrl: reader.result as string, label: '' }])
      setLoading(false)
      e.target.value = ''
    }
    reader.onerror = () => {
      alert('이미지 읽기 실패')
      setLoading(false)
      e.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const handleLabelChange = (id: string, newLabel: string) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, label: newLabel } : img))
    )
  }

  const handleDelete = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  const handleSaveCharacter = () => {
    const draft = JSON.parse(localStorage.getItem('character-draft') || '{}')

    if (!draft.name || !draft.description || images.some((img) => !img.label)) {
      alert('필수 정보가 누락되었습니다.')
      return
    }

    const characterId = draft.id || uuidv4()
    const now = new Date().toISOString()

    const character: LocalCharacter = {
      id: characterId,
      name: draft.name,
      description: draft.description,
      personality: draft.personality ?? draft.occupation ?? '',
      situation: draft.situation ?? '',
      firstLine: draft.firstLine,
      imageUrl: images.length > 0 ? images[0].imageUrl : '',
      image_url: images.length > 0 ? images[0].imageUrl : undefined,
      isAdult: draft.isAdult === true,
      is_adult: draft.isAdult === true,
      tags: draft.tags ?? [],
      isPublic: draft.isPublic ?? true,
      is_public: draft.isPublic !== false,
      emotionImages: images,
      emotion_images: images,
      userName: draft.userName ?? '',
      user_name: draft.userName ?? '',
      userRole: draft.userRole ?? '',
      user_role: draft.userRole ?? '',
      userDescription: draft.userDescription ?? '',
      user_description: draft.userDescription ?? '',
      worldSetting: draft.worldSetting ?? '',
      world_setting: draft.worldSetting ?? '',
      details: {
        occupation: draft.occupation ?? '',
        birthplace: draft.birthplace ?? '',
        age: draft.age ?? '',
        trauma: draft.trauma ?? '',
        relationships: draft.relationships ?? '',
        goal: draft.goal ?? '',
        worldSetting: draft.worldSetting ?? '',
        situation: draft.situation ?? '',
      },
      protagonist: draft.protagonist ?? [],
      supporting: draft.supporting ?? [],
      createdAt: draft.createdAt ?? now,
      created_at: draft.createdAt ?? now,
    }

    try {
      saveLocalCharacter(character)
      localStorage.removeItem('character-draft')
      localStorage.removeItem('emotionImages')
      alert('캐릭터가 저장되었습니다.')
      router.push('/')
    } catch (err) {
      console.error('저장 실패:', err)
      alert('저장 실패')
    }
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="sticky top-0 z-50">
        <TopNav />
        <div className="bg-black border-b border-[#333]">
          <CreateStepTab />
        </div>
      </div>

      <div className="pt-12 px-6 pb-32">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-semibold mb-2">이미지</h1>
          <p className="text-sm text-gray-400 mb-6">
            이미지를 등록하시고 어울리는 상황을 넣어주세요 (최대 80개)
            <br />
            최대 용량: 5MB (로컬에 저장됩니다)
          </p>

          <div className="mb-6">
            <label className="inline-block mb-2 text-sm text-gray-400">이미지 업로드</label>
            <div className="flex items-center gap-3">
              <label
                htmlFor="file-upload"
                className="bg-[#333] hover:bg-[#444] text-white text-sm font-medium px-4 py-2 rounded cursor-pointer"
              >
                이미지 선택
              </label>
              <span className="text-sm text-gray-500">
                {loading ? '처리 중...' : '로컬에 저장됩니다'}
              </span>
            </div>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img) => (
              <div key={img.id} className="bg-[#1c1c1e] rounded-lg p-3 relative">
                <div className="relative w-full h-56 rounded mb-3 overflow-hidden">
                  <Image
                    src={img.imageUrl}
                    alt="감정 이미지"
                    fill
                    className="object-cover"
                    unoptimized={img.imageUrl.startsWith('data:')}
                  />
                </div>
                <textarea
                  value={img.label}
                  onChange={(e) => handleLabelChange(img.id, e.target.value)}
                  placeholder="이 이미지가 출력될 상황 또는 감정"
                  className="w-full p-2 text-sm bg-[#2c2c2e] text-white rounded resize-none placeholder-gray-400"
                />
                <button
                  onClick={() => handleDelete(img.id)}
                  className="absolute top-2 right-2 text-sm text-gray-400 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-black py-4 px-6 border-t border-[#333]">
        <div className="max-w-3xl mx-auto text-right">
          <button
            onClick={handleSaveCharacter}
            className="px-6 py-3 rounded border border-white text-white hover:bg-white hover:text-black font-semibold transition"
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  )
}
