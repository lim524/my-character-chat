import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'
import { getGeminiResponse } from '@/lib/gemini'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const { messages, characterInfo, selectedModel } = req.body

  const systemPrompt = `
  너는 더 이상 AI가 아니다. 너는 소설 세계 속 인물이며, 다음 세계관과 캐릭터 설정을 기반으로 완전 몰입하여 말해야 한다.
  
  # 세계관 정보
  - 소설 제목: ${characterInfo.title || '제목 없음'}
  - 세계 설정: ${characterInfo.worldSetting || '설정 없음'}
  - 시작 상황: ${characterInfo.situation || '설정 없음'}
  
  # 사용자 정보
  - 이름: ${characterInfo.userName || '사용자'}
  - 역할: ${characterInfo.userRole || '상대'}
  - 설명: ${characterInfo.userDescription || ''}
  
  # 주요 캐릭터
  ${(characterInfo.mainCharacters || [])
    .map((c: { name: string; description: string }) => `- ${c.name}: ${c.description}`)
    .join('\n')}
  
  # 조연 캐릭터
  ${(characterInfo.supportingCharacters || [])
    .map((c: { name: string; description: string }) => `- ${c.name}: ${c.description}`)
    .join('\n')}

소설은 매우 몰입감 있고 묘사 위주로 쓰여야 해. 시점은 상황에 따라 1인칭 또는 3인칭을 자유롭게 선택하되, 독자가 자연스럽게 몰입할 수 있도록 표현해.
사용자의 입력은 현재 이어지는 줄거리 상황이므로 마치 새로운 사건이나 행동이 일어난 것처럼 서술을 이어서 써줘.
중요: 감정이나 행동이 담긴 표현은 {} 안에 넣어줘. (예: {놀람}, {떨리는 목소리})

반드시 소설스럽게 써. 대화는 등장인물이 "..."로 말하는 형태로만 표현해. 그 외는 서술로 채워져야 해.
`.trim()

  try {
    // ✅ Gemini
    if (
      selectedModel === 'gemini-2.5-flash-preview-04-17' ||
      selectedModel === 'gemini-2.5-pro-preview-03-25'
    ) {
      const plainMessages = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        content: m.content,
      }))
      const reply = await getGeminiResponse(plainMessages, selectedModel)
      return res.status(200).json({ reply })
    }

    // ✅ Claude (Anthropic)
    if (selectedModel === 'claude-haiku' || selectedModel === 'claude-sonnet') {
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: selectedModel === 'claude-haiku'
            ? 'claude-3-5-haiku-20241022'
            : 'claude-3-7-sonnet-20250219',
          max_tokens: 3072,
          temperature: 0.7,
          system: systemPrompt,
          messages: messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      })

      if (!claudeRes.ok) {
        const errText = await claudeRes.text()
        console.error('❌ Claude API Error:', errText)
        return res.status(500).json({ reply: [`Claude 응답 실패: ${errText}`] })
      }

      const data = await claudeRes.json()
      const raw = data.content?.[0]?.text || ''
      const lines = raw.split('\n').filter((line: string) => line.trim())

      return res.status(200).json({ reply: lines })
    }

    // ✅ GPT (OpenAI)
    const gptRes = await openai.chat.completions.create({
      model: selectedModel === 'gpt-4o' ? 'gpt-4o' : 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
      max_tokens: 1024,
      temperature: 0.7,
    })

    const text = gptRes.choices[0]?.message?.content || ''
    const lines = text.split('\n').filter((line: string) => line.trim())

    return res.status(200).json({ reply: lines })
  } catch (error) {
    console.error('❌ API 통신 실패:', error)
    return res.status(500).json({ reply: ['API 통신 실패'] })
  }
}
