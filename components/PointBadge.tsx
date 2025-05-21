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
      bottom: '1rem',
      left: '1rem',
      backgroundColor: '#2a2a2a',
      padding: '6px 12px',
      borderRadius: '9999px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '0.8rem',
      fontWeight: 'bold',
      color: '#ffd700',
      zIndex: 100,
    }}>
      <Coins size={16} /> {points}P
    </div>
  )
}

