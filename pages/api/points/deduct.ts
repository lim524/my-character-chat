// /pages/api/point/deduct.ts
import { NextApiRequest, NextApiResponse } from 'next'
import supabase from '@/lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { userId, amount } = req.body
  if (!userId || !amount) return res.status(400).json({ error: 'userId 또는 amount 누락' })

  const { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('point')
    .eq('id', userId)
    .single()

  if (fetchError) return res.status(500).json({ error: '포인트 조회 실패' })

  if (userData.point < amount) {
    return res.status(400).json({ error: '포인트 부족' })
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ point: userData.point - amount })
    .eq('id', userId)

  if (updateError) return res.status(500).json({ error: '포인트 차감 실패' })

  return res.status(200).json({ success: true, newPoint: userData.point - amount })
}

