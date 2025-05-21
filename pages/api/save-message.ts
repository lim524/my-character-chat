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

  const { messages, mode, characterId } = req.body

  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: 'Invalid messages format' })
  }

  const userId = messages[0]?.user_id

  if (!userId || !characterId) {
    return res.status(400).json({ error: 'Missing userId or characterId' })
  }

  // ✅ 새로 대화 모드면 기존 메시지 삭제
  if (mode === 'new') {
    await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', userId)
      .eq('character_id', characterId)
  }

  // ✅ 새 메시지 저장
  const { error } = await supabase
    .from('chat_messages')
    .insert(messages)

  if (error) {
    console.error('❌ 메시지 저장 실패:', error)
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ success: true })
}
