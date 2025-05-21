// pages/api/save-message.ts
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

  const { messages } = req.body

  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body: messages must be array' })
  }

  const { error } = await supabase
    .from('chat_messages')
    .insert(messages)  // ✅ 배열로 한 번에 insert (row마다 필드 포함됨)

  if (error) {
    console.error('❌ 메시지 저장 실패:', error)
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ success: true })
}
