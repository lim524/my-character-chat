// pages/settings.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '@/lib/supabaseClient'
import ImageUploader from '@/components/ImageUploader'

export default function SettingsPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [gender, setGender] = useState('남성')
  const [nickname, setNickname] = useState('')
  const [nicknameError, setNicknameError] = useState('')
  const [checking, setChecking] = useState(false)
  const [image, setImage] = useState('/default-profile.png')

  const generateRandomNickname = () => {
    const adjectives = ['사려깊은', '용감한', '수줍은', '우아한']
    const animals = ['고양이', '여우', '판다', '노린재']
    const number = Math.floor(Math.random() * 1000)
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${animals[Math.floor(Math.random() * animals.length)]}${number}`
  }

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (data?.user) {
        setEmail(data.user.email || '')
        setUserId(data.user.id)

        const { data: userProfile } = await supabase
          .from('users')
          .select('nickname, gender, image')
          .eq('id', data.user.id)
          .single()

        if (userProfile) {
          const loadedNickname = userProfile.nickname || localStorage.getItem('profile-nickname') || generateRandomNickname()
          setNickname(loadedNickname)
          setGender(userProfile.gender || '남성')
          setImage(userProfile.image || '/default-profile.png')
        } else {
          const fallbackNickname = localStorage.getItem('profile-nickname') || generateRandomNickname()
          setNickname(fallbackNickname)
          setImage('/default-profile.png')
        }
      }
    }
    fetchUser()
  }, [])

  const checkNicknameDuplicate = async () => {
    if (!nickname || !userId) return
    setChecking(true)
    const { data, error } = await supabase
      .from('users')
      .select('nickname')
      .eq('nickname', nickname)
      .neq('id', userId)

    if (error) {
      setNicknameError('중복 확인 실패')
    } else if (data.length > 0) {
      setNicknameError('이미 사용 중인 닉네임입니다.')
    } else {
      setNicknameError('')
    }
    setChecking(false)
  }

  const saveProfile = async () => {
    if (nicknameError) {
      alert('닉네임 중복을 해결해주세요.')
      return
    }
    if (!userId) {
      alert('사용자 인증 정보가 없습니다.')
      return
    }

    const { error } = await supabase
      .from('users')
      .update({
        nickname,
        gender,
        image: image || '/default-profile.png',
      })
      .eq('id', userId)

    if (error) {
      console.error('❌ 프로필 저장 실패:', error)
      alert('저장 실패: ' + error.message)
    } else {
      localStorage.setItem('profile-nickname', nickname)
      alert('프로필이 저장되었습니다.')
      location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-[#1f1f1f] text-white px-6 py-8 pt-28 flex justify-center">
      <div className="w-full max-w-md space-y-6">
        {/* 프로필 이미지 업로드 */}
        <div className="relative w-24 h-24 mx-auto">
          <img src={image || '/default-profile.png'} alt="프로필" className="rounded-full w-full h-full object-cover" />
          <div className="absolute bottom-0 right-0 bg-black/70 rounded-full p-1 cursor-pointer">
            <ImageUploader onUpload={(url) => setImage(url)} />
          </div>
        </div>

        {/* 이메일 (읽기 전용) */}
        <div>
          <label className="block mb-1 text-sm">이메일</label>
          <input
            value={email}
            readOnly
            className="w-full px-4 py-2 bg-[#333] rounded text-white outline-none"
          />
        </div>

        {/* 성별 */}
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

        {/* 닉네임 + 랜덤 생성 */}
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
                const random = generateRandomNickname()
                setNickname(random)
                setNicknameError('')
              }}
              className="px-3 py-2 bg-white text-black text-sm rounded hover:bg-gray-300"
            >
              랜덤 생성
            </button>
          </div>
          {nicknameError && <p className="text-sm text-red-500 mt-1">{nicknameError}</p>}
        </div>

        {/* 저장 버튼 */}
        <button
          onClick={saveProfile}
          className="w-full bg-white text-black font-semibold py-2 rounded hover:bg-gray-300 transition"
        >
          저장하기
        </button>
      </div>
    </div>
  )
}
