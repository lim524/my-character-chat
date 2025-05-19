// pages/api/claude.ts
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { messages } = req.body

  try {
    const result = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229', // 또는 claude-3-sonnet 등
        max_tokens: 1024,
        temperature: 0.7,
        messages,
      }),
    })

    const data = await result.json()
    const reply = data.content?.[0]?.text ?? '응답 실패'
    res.status(200).json({ reply })
  } catch (err) {
    console.error('Claude 연결 오류:', err)
    res.status(500).json({ error: 'Claude 연결 실패' })
  }
}
