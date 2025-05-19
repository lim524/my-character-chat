import Link from 'next/link'
import { useRouter } from 'next/router'

export default function BottomNav() {
  return null
  const { pathname } = useRouter()

  const linkStyle = (path: string) => ({
    flex: 1,
    textAlign: 'center' as const,
    padding: '0.75rem 0',
    color: pathname.startsWith(path) ? '#ffffff' : '#ccc',
    fontWeight: pathname.startsWith(path) ? 'bold' : 'normal',
    fontSize: '0.95rem',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
  })

  const dividerStyle = {
    width: '1px',
    height: '1.2rem',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    margin: '0 0.75rem',
  }

  return (
    <nav style={{
      position: 'fixed',
      bottom: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(30, 30, 30, 0.75)',
      borderRadius: '2rem',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      width: '90%',
      maxWidth: 400,
      padding: '0.5rem 1rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 50,
      backdropFilter: 'blur(8px)',
    }}>
      <Link href="/home" legacyBehavior>
        <a style={linkStyle('/home')}>홈</a>
      </Link>

      <div style={dividerStyle} />

      <Link href="/" legacyBehavior>
      <a style={linkStyle('/')}>생성</a>
      </Link>


      <div style={dividerStyle} />

      <Link href="/mypage" legacyBehavior>
        <a style={linkStyle('/mypage')}>마이페이지</a>
      </Link>
    </nav>
  )
}
