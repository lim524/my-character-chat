// components/PointBadge.tsx
import { useEffect, useState } from 'react'
import supabase from '../lib/supabaseClient'
import { Coins } from 'lucide-react'

export default function PointBadge() {
  const [points, setPoints] = useState<number | null>(null)

  useEffect(() => {
    const fetchPoints = async () => {
      const { data } = await supabase.auth.getSession()
      const userId = data.session?.user?.id
      if (!userId) return

      const res = await fetch(`/api/points/get?userId=${userId}`)
      const json = await res.json()
      setPoints(json.points ?? 0)
    }

    fetchPoints()
  }, [])

  if (points === null) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',         // ✅ 살짝 위로 띄움
      right: '1.5rem',          // ✅ 오른쪽 하단
      backgroundColor: '#2a2a2a',
      padding: '10px 16px',     // ✅ 패딩 확대
      borderRadius: '9999px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '1rem',         // ✅ 글씨 약간 키움
      fontWeight: 'bold',
      color: '#ffd700',
      zIndex: 100,
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
    }}>
      <Coins size={20} />        {/* ✅ 아이콘도 키움 */}
      {points}P
    </div>
  )
}
