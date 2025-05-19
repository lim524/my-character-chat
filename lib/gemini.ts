export async function getGeminiResponse(
    messages: { role: 'user' | 'assistant'; content: string }[],
    model: 'gemini-2.5-flash-preview-04-17' | 'gemini-2.5-pro-preview-03-25' = 'gemini-2.5-flash-preview-04-17'
  ) {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) throw new Error('❌ Gemini API 키가 설정되지 않았습니다.')
  
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  
    // 메시지 포맷 구성 (Gemini는 role: 'user' | 'model' 형태여야 함)
    const contents = messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))
  
    console.log('✅ Gemini 요청:', contents)
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      })
  
      const data = await response.json()
      console.log('📦 Gemini 응답:', data)
  
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!response.ok || !text) {
        throw new Error(`Gemini 응답 실패: ${JSON.stringify(data)}`)
      }
  
      return text.split('\n').filter((line: string) => line.trim())
    } catch (error) {
      console.error('❌ Gemini 내부 오류:', error)
      throw error
    }
  }
  