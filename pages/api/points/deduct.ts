// /pages/api/point/deduct.ts

import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 반드시 service role 키 사용
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ✅ 이 부분이 반드시 있어야 함
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { userId, amount } = req.body
  if (!userId || !amount) {
    return res.status(400).json({ error: 'userId 또는 amount 누락' })
  }

  const { data, error: fetchError } = await supabase
    .from('user_points')
    .select('points')
    .eq('user_id', userId)
    .single()

  if (fetchError || !data) {
    console.error('❌ 포인트 조회 실패:', fetchError)
    return res.status(500).json({ error: '포인트 조회 실패' })
  }

  if (data.points < amount) {
    return res.status(400).json({ error: '포인트 부족' })
  }

  const { error: updateError } = await supabase
    .from('user_points')
    .update({ points: data.points - amount })
    .eq('user_id', userId)

  if (updateError) {
    console.error('❌ 포인트 차감 실패:', updateError)
    return res.status(500).json({ error: '포인트 차감 실패' })
  }

  return res.status(200).json({ success: true, newPoint: data.points - amount })
}
