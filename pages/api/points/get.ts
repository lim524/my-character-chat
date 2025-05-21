import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query
  const { data, error } = await supabase
    .from('user_points')
    .select('points')
    .eq('user_id', userId)
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json({ points: data?.points ?? 0 })
}
