import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import BottomNav from '../components/BottomNav'
import TopNav from '../components/TopNav'
import '../styles/globals.css'
import PointBadge from '../components/PointBadge'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const isChatPage = router.pathname.startsWith('/chat/')

  return (
    <>
      {!isChatPage && <TopNav />}
      <Component {...pageProps} />
      {!isChatPage && <BottomNav />}
      <PointBadge /> 
    </>
  )
}
