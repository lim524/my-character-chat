// /pages/api/points/get.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 반드시 service_role 키 필요
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.query.userId as string
  if (!userId) return res.status(400).json({ error: 'userId is required' })

  const { data, error } = await supabase
    .from('user_points') // ← 여기 주의!
    .select('points')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('❌ Supabase 쿼리 실패:', error)
    return res.status(500).json({ error: 'Database error' })
  }

  return res.status(200).json({ points: data?.points ?? 0 })
}
