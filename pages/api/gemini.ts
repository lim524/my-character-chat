// pages/api/gemini.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getGeminiResponse } from '@/lib/gemini'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { messages } = req.body
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages 배열이 필요합니다.' })
    }

    const reply = await getGeminiResponse(messages)
    res.status(200).json({ reply })
  } catch (err) {
    console.error('API Error:', err)
    res.status(500).json({ error: 'Gemini API 호출 실패' })
  }
}
