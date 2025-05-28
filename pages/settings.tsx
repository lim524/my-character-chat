// pages/settings.tsx
import { useState } from 'react'
import ImageUploader from '@/components/ImageUploader'
import { useRouter } from 'next/router'

export default function SettingsPage() {
  const router = useRouter()

  const [email] = useState('')
  const [gender, setGender] = useState('')
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('/default-profile.png')

  const saveProfile = () => {
    localStorage.setItem('profile-name', name)
    localStorage.setItem('profile-nickname', nickname)
    localStorage.setItem('profile-description', description)
    localStorage.setItem('profile-gender', gender)
    localStorage.setItem('profile-image', image)
    alert('프로필이 저장되었습니다.')
  }

  return (
    <div className="min-h-screen bg-[#1f1f1f] text-white px-6 py-8 flex justify-center">
      <div className="w-full max-w-md space-y-6">
        {/* 프로필 이미지 */}
        <div className="relative w-24 h-24 mx-auto">
          <img src={image} alt="프로필" className="rounded-full w-full h-full object-cover" />
          <div className="absolute bottom-0 right-0 bg-black/70 rounded-full p-1 cursor-pointer">
            📷
            <ImageUploader onUpload={(url) => setImage(url)} />
          </div>
        </div>

        {/* 이메일 */}
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

        {/* 이름 */}
        <div>
          <label className="block mb-1 text-sm">이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-[#333] rounded text-white"
          />
        </div>

        {/* 닉네임 */}
        <div>
          <label className="block mb-1 text-sm">닉네임</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-4 py-2 bg-[#333] rounded text-white"
          />
        </div>

        {/* 소개 */}
        <div>
          <label className="block mb-1 text-sm">소개</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="나를 소개하는 글을 적어보세요!"
            className="w-full px-4 py-2 bg-[#333] rounded text-white resize-none"
          />
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