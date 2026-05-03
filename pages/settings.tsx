import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { kvGet, kvSet } from '@/lib/idbKV'
import GlobalUiLayersEditor from '@/components/GlobalUiLayersEditor'

const PROFILE_KEY = 'local-profile'

interface LocalProfile {
  email: string
  nickname: string
  gender: string
  image: string
}

export default function SettingsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [email, setEmail] = useState('')
  const [gender, setGender] = useState('남성')
  const [nickname, setNickname] = useState('')
  const [nicknameError, setNicknameError] = useState('')
  const [image, setImage] = useState('/default-profile.png')

  const generateRandomNickname = () => {
    const adjectives = ['사려깊은', '용감한', '수줍은', '우아한']
    const animals = ['고양이', '여우', '판다', '노린재']
    const number = Math.floor(Math.random() * 1000)
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${animals[Math.floor(Math.random() * animals.length)]}${number}`
  }

  useEffect(() => {
    void (async () => {
      try {
        const raw = await kvGet(PROFILE_KEY)
        if (raw) {
          const profile: LocalProfile = JSON.parse(raw)
          setEmail(profile.email ?? '')
          setNickname(profile.nickname ?? generateRandomNickname())
          setGender(profile.gender ?? '남성')
          setImage(profile.image ?? '/default-profile.png')
        } else {
          setNickname(generateRandomNickname())
        }
      } catch {
        setNickname(generateRandomNickname())
      }
    })()
  }, [])

  const checkNicknameDuplicate = () => {
    setNicknameError('')
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const saveProfile = async () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력해 주세요.')
      return
    }
    const profile: LocalProfile = {
      email,
      nickname: nickname.trim(),
      gender,
      image: image || '/default-profile.png',
    }
    try {
      await kvSet(PROFILE_KEY, JSON.stringify(profile))
      await kvSet('profile-nickname', profile.nickname)
    } catch (e) {
      console.error(e)
      alert('프로필을 저장하지 못했습니다.')
      return
    }
    alert('프로필이 저장되었습니다.')
    router.push('/mypage')
  }

  return (
    <div className="min-h-screen bg-[#1f1f1f] text-white px-6 py-8 pt-28 flex justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="relative w-24 h-24 mx-auto cursor-pointer" onClick={handleImageClick}>
          <Image
            src={image?.trim() ? image : '/default-profile.png'}
            alt="프로필"
            fill
            className="rounded-full object-cover"
            unoptimized={image.startsWith('data:')}
          />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>

        <div>
          <label className="block mb-1 text-sm">이메일 (로컬용 표시)</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="선택 입력"
            className="w-full px-4 py-2 bg-[#333] rounded text-white outline-none"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm">성별</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-4 py-2 bg-[#333] rounded text-white"
          >
            <option>남성</option>
            <option>여성</option>
            <option>기타</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm">닉네임</label>
          <div className="flex gap-2">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onBlur={checkNicknameDuplicate}
              className="flex-1 px-4 py-2 bg-[#333] rounded text-white"
            />
            <button
              type="button"
              onClick={() => {
                setNickname(generateRandomNickname())
                setNicknameError('')
              }}
              className="px-3 py-2 bg-white text-black text-sm rounded hover:bg-gray-300"
            >
              랜덤 생성
            </button>
          </div>
          {nicknameError && <p className="text-sm text-red-500 mt-1">{nicknameError}</p>}
        </div>

        <button
          onClick={saveProfile}
          className="w-full bg-white text-black font-semibold py-2 rounded hover:bg-gray-300 transition"
        >
          저장하기
        </button>

        <div className="border-t border-gray-700 pt-6 mt-6 space-y-4">
          <p className="text-sm text-gray-400">
            로컬 전용이며, 작성한 코드가 전체 화면에 영향을 줍니다. 캐릭터 생성 화면 사이드바의 같은 이름 탭에서도 편집할 수 있습니다.
          </p>
          <GlobalUiLayersEditor variant="settings" />
        </div>

        <div className="border-t border-gray-700 pt-6 mt-6">
          <h2 className="text-lg font-semibold text-white mb-2">API 설정 (로컬 전용)</h2>
          <p className="text-sm text-gray-400 mb-3">
            채팅 AI를 사용하려면 프로젝트 루트에 <code className="bg-[#333] px-1 rounded">.env.local</code> 파일을 만들고 아래 변수를 설정하세요. 사용하는 프로바이더만 넣으면 됩니다.
          </p>
          <pre className="text-xs text-gray-300 bg-[#222] p-4 rounded overflow-x-auto whitespace-pre">
{`# OpenAI (GPT)
OPENAI_API_KEY=sk-...

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...

# Google (Gemini)
NEXT_PUBLIC_GEMINI_API_KEY=...`}
          </pre>
          <p className="text-sm text-gray-400 mt-3">
            Temperature·Max tokens는 채팅 화면에서 「모델 선택」 버튼으로 설정할 수 있으며, 로컬에 저장됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
