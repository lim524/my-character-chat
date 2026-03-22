import Link from 'next/link'
import { useRouter } from 'next/router'
import { Home, Sparkles, User, List } from 'lucide-react'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export default function SideMenu({ isOpen, onClose }: Props) {
  const router = useRouter()

  const handleCreate = () => {
    localStorage.removeItem('character-draft') // ✅ 수정 데이터 제거
    onClose() // ✅ 사이드 메뉴 닫기
    router.push('/create') // ✅ 생성 페이지로 이동
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        width: '220px',
        backgroundColor: '#1c1c1c',
        color: 'white',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease-in-out',
        zIndex: 100,
        padding: '1rem',
      }}
    >
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '1.5rem',
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          cursor: 'pointer',
        }}
      >
        &times;
      </button>

      <nav style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <Link
          href="/home"
          onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Home size={18} /> 홈
        </Link>

        {/* ✅ 수정된 생성 버튼 */}
        <button
          onClick={handleCreate}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
          }}
        >
          <Sparkles size={18} /> 생성
        </button>

        <Link
          href="/mypage"
          onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <User size={18} /> 마이페이지
        </Link>

        <Link
          href="/characters"
          onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <List size={18} /> 목록
        </Link>
      </nav>
    </div>
  )
}
