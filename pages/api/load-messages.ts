import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId, characterId } = req.body
  if (!userId || !characterId) {
    return res.status(400).json({ error: 'Missing userId or characterId' })
  }

  const { data, error } = await supabase
  .from('chat_messages')
  .select('id, role, content, created_at')  // 또는 필요한 필드 예: 'id, role, content, created_at'
  .eq('user_id', userId)
  .eq('character_id', characterId)
  .order('created_at', { ascending: true })

  if (error || !data) {
    console.error('❌ 메시지 불러오기 실패:', error)
    return res.status(500).json({ error: '메시지 불러오기 실패' })
  }

  const mergedMessages = data
  return res.status(200).json({ messages: mergedMessages })
}
