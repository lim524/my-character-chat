// pages/api/generate-image.ts

import { NextApiRequest, NextApiResponse } from 'next'

console.log('✅ 현재 서버가 읽은 API 키:', process.env.OPENAI_API_KEY)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { prompt } = req.body

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
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