import { useSearch } from '@/context/SearchContext'
import Image from 'next/image'
import { useState } from 'react'
import Link from 'next/link'
import { FiSearch, FiMenu } from 'react-icons/fi'
import SideMenu from './SideMenu'

export default function TopNav() {
  const { toggleSearch } = useSearch()
  const [menuOpen, setMenuOpen] = useState(false)

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
            src="/logo/sumiai.png"
            alt="NovelChat"
            width={100}
            height={34}
            style={{ objectFit: 'contain' }}
          />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <FiSearch size={20} onClick={toggleSearch} style={{ cursor: 'pointer' }} />
          <FiMenu size={22} style={{ cursor: 'pointer' }} onClick={() => setMenuOpen(true)} />
        </div>
      </header>

      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
