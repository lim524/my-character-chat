import { useSearch } from '@/context/SearchContext'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FiSearch, FiBell, FiMenu } from 'react-icons/fi'
import SideMenu from './SideMenu'
import LoginModal from './LoginModal'
import supabase from '../lib/supabaseClient'

export default function TopNav() {
  const { toggleSearch } = useSearch()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setUserEmail(data.session?.user.email ?? null)
    }
    getSession()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
          backgroundColor: '#111',
          color: '#fff',
          borderBottom: '1px solid #333',
          zIndex: 50,
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <Image
          src="/logo/novelchat.png"
          alt="NovelChat"
          width={100}
          height={34}
          style={{ objectFit: 'contain' }}
          />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          {!userEmail ? (
            <button
              onClick={() => setLoginModalOpen(true)}
              style={{
                padding: '6px 12px',
                fontSize: '0.85rem',
                color: '#fff',
                backgroundColor: 'rgba(200, 200, 200, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '999px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(200, 200, 200, 0.1)')
              }
            >
              로그인
            </button>
          ) : (
            <button
              onClick={handleLogout}
              style={{
                padding: '6px 12px',
                fontSize: '0.85rem',
                color: '#fff',
                backgroundColor: 'rgba(200, 200, 200, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '999px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'rgba(200, 200, 200, 0.1)')
              }
            >
              로그아웃
            </button>
          )}
          
          <FiSearch size={20} onClick={toggleSearch} style={{ cursor: 'pointer' }} />
          <FiBell size={20} />
          <FiMenu size={22} style={{ cursor: 'pointer' }} onClick={() => setMenuOpen(true)} />
        </div>
      </header>

      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      {loginModalOpen && <LoginModal onClose={() => setLoginModalOpen(false)} />}
    </>
  )
}
