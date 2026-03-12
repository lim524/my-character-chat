import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import BottomNav from '../components/BottomNav'
import TopNav from '../components/TopNav'
import '../styles/globals.css'
import { SearchProvider } from '@/context/SearchContext' // ✅ 추가

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const isChatPage = router.pathname.startsWith('/chat/')

  return (
    <SearchProvider>
      {!isChatPage && <TopNav />}
      <Component {...pageProps} />
      {!isChatPage && <BottomNav />}
    </SearchProvider>
  )
}
