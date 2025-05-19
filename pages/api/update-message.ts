// pages/api/update-message.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id, content } = req.body

  if (!id || !content) {
    return res.status(400).json({ error: 'Missing id or content' })
  }

  const { error } = await supabase
    .from('chat_messages')
    .update({ content }) // ✅ 오직 content 필드만 수정
    .eq('id', id)

  if (error) {
    console.error('❌ 메시지 수정 실패:', error)
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ success: true })
}
