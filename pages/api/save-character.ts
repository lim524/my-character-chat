// pages/api/save-character.ts

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

  const { character } = req.body

  console.log('📦 요청받은 캐릭터 데이터:', character)

  // 🔍 디버깅 로그 추가
  if (!character) {
    console.error('❌ character가 undefined입니다.')
    return res.status(400).json({ error: 'Missing character' })
  }
  if (!character.id) {
    console.error('❌ character.id가 없습니다.')
    return res.status(400).json({ error: 'Missing character.id' })
  }
  if (!character.userId) {
    console.error('❌ character.userId가 없습니다.')
    return res.status(400).json({ error: 'Missing character.userId' })
  }

  const { details = {} } = character

  const { error } = await supabase.from('characters').upsert({
    id: character.id,
    user_id: character.userId,
    name: character.name,
    is_adult: character.isAdult,
    description: character.description || '',
    personality: character.personality || '',
    situation: character.situation || '',
    first_line: character.firstLine || '',
    tags: character.tags || [],
    is_public: character.isPublic ?? true,
    is_censored: character.isCensored ?? true,
    image_url: character.imageUrl || '',
    user_name: character.userName || '',
    user_role: character.userRole || '',
    user_description: character.userDescription || '',
    world_setting: details.worldSetting || '',
    occupation: details.occupation || '',
    birthplace: details.birthplace || '',
    age: details.age || '',
    trauma: details.trauma || '',
    relationships: details.relationships || '',
    goal: details.goal || '',
    protagonist: character.protagonist || [],
    supporting: character.supporting || [],
    emotion_images: character.emotionImages || [],
    details: details,
    created_at: character.createdAt || new Date().toISOString()
  })

  if (error) {
    console.error('❌ [SUPABASE SAVE ERROR]', error)
    return res.status(500).json({ error: 'Failed to save character' })
  }

  return res.status(200).json({ success: true })
}
