// pages/api/points/update.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 서비스 키 필요 (보안주의)
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const { userId, change } = req.body

  if (!userId || typeof change !== 'number') {
    return res.status(400).json({ error: 'userId와 change는 필수입니다.' })
  }

  // 현재 포인트 불러오기
  const { data: existing, error: fetchError } = await supabase
    .from('user_points')
    .select('points')
    .eq('user_id', userId)
    .single()

  if (fetchError) return res.status(500).json({ error: fetchError.message })

  const newPoints = (existing?.points ?? 0) + change

  // 음수 허용 여부에 따라 조건 추가 가능
  if (newPoints < 0) {
    return res.status(400).json({ error: '포인트가 부족합니다.' })
  }

  // 포인트 업데이트
  const { error: updateError } = await supabase
    .from('user_points')
    .upsert({
      user_id: userId,
      points: newPoints,
      updated_at: new Date().toISOString(),
    })

  if (updateError) return res.status(500).json({ error: updateError.message })

  res.status(200).json({ success: true, newPoints })
}
