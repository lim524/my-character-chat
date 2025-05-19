import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function MyPage() {
  const [safetyFilter, setSafetyFilter] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const savedFilter = localStorage.getItem('safety-filter')
    if (savedFilter !== null) {
      setSafetyFilter(savedFilter === 'true')
    }
  }, [])

  const toggleFilter = () => {
    const newValue = !safetyFilter
    setSafetyFilter(newValue)
    localStorage.setItem('safety-filter', newValue.toString())
  }

  const handleLogout = () => {
    // 실제 구현 시 Auth 연동 필요
    alert('로그아웃 되었습니다')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#1f1f1f] text-white px-4 py-6 flex justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">프로필</h1>

        {/* 프로필 카드 */}
        <div className="bg-[#2a2a2a] rounded-lg p-4 flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative w-12 h-12">
            <Image
              src="/default-profile.png"
              alt="프로필"
              fill
              className="rounded-full object-cover"
            />
          </div>
            <p className="text-lg font-semibold">사려깊은노린재802</p>
          </div>
          <button className="text-sm bg-gray-700 px-3 py-1 rounded hover:bg-gray-600">
            관리
          </button>
        </div>

        {/* 크리에이터 활동 */}
        <div className="bg-[#2a2a2a] rounded-lg mb-6">
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700">
            <span>내 팔로워 0</span>
            <span>›</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3">
            <span>팔로우 중 0</span>
            <span>›</span>
          </div>
        </div>

        {/* 설정 버튼들 */}
        <div className="flex flex-col space-y-4">
          <button
            onClick={toggleFilter}
            className="bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded"
          >
            세이프티 필터: {safetyFilter ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => router.push('/characters')}
            className="bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded"
          >
            캐릭터 관리
          </button>

          <button
            onClick={() => router.push('/settings')}
            className="bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded"
          >
            설정
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}
