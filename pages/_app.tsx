import type { AppProps } from 'next/app'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import BottomNav from '../components/BottomNav'
import TopNav from '../components/TopNav'
import '../styles/globals.css'
import { SearchProvider } from '@/context/SearchContext'
import { ThemeProvider } from '@/context/ThemeContext'

const GlobalUiLayersRuntime = dynamic(() => import('@/components/GlobalUiLayersRuntime'), {
  ssr: false,
})

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const isChatPage = router.pathname.startsWith('/chat/')

  return (
    <ThemeProvider>
      <GlobalUiLayersRuntime />
      <SearchProvider>
        {!isChatPage && <TopNav />}
        <Component {...pageProps} />
        {!isChatPage && <BottomNav />}
      </SearchProvider>
    </ThemeProvider>
  )
}

