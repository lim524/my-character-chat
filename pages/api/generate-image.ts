// pages/api/generate-image.ts

import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { prompt } = req.body
  if (typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt must be a string' })
  }
  const trimmedPrompt = prompt.trim()
  if (!trimmedPrompt) {
    return res.status(400).json({ error: 'prompt is required' })
  }
  if (trimmedPrompt.length > 4000) {
    return res.status(400).json({ error: 'prompt is too long' })
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not configured' })
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: trimmedPrompt,
        n: 1,
        size: '1024x1024',
      }),
    })

    if (!openaiRes.ok) {
      const errorData = await openaiRes.json()
      console.error('OpenAI 에러:', errorData)
      return res.status(500).json({ error: 'OpenAI API 호출 실패' })
    }

    const data = await openaiRes.json()
    const imageUrl = data.data[0].url
    res.status(200).json({ imageUrl })
  } catch (error) {
    console.error('이미지 생성 실패:', error)
    res.status(500).json({ error: '이미지 생성 실패' })
  }
}