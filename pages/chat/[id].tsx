import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type Character = {
  name: string
  personality: string
  description: string
  situation: string
}

export default function ChatPage() {
  const router = useRouter()
  const { id } = router.query

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [characterInfo, setCharacterInfo] = useState<Character | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      const savedCharacters = localStorage.getItem('my-characters')
      if (savedCharacters) {
        const list = JSON.parse(savedCharacters)
        const found = list.find((char: Character) => char.name === id)
        if (found) setCharacterInfo(found)
      }

      const savedMessages = localStorage.getItem(`chat-${id}`)
      if (savedMessages) setMessages(JSON.parse(savedMessages))
    }
  }, [id])

  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      localStorage.setItem(`chat-${id}`, JSON.stringify(messages))
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, id])

  const sendMessage = async () => {
    if (!input.trim() || !characterInfo) return
    const newMessages: Message[] = [...messages, { role: 'user', content: input }]
    setMessages(newMessages)
    setInput('')

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: newMessages,
        characterInfo,
      }),
    })
    const data = await res.json()
    if (data.reply) {
      setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    }
  }

  return (
    <div className="flex flex-col h-screen p-4 bg-gradient-to-b from-blue-50 to-white">
      <div className="flex-1 overflow-y-auto space-y-4 p-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-2xl text-sm whitespace-pre-wrap shadow
                ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'}`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center mt-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="메시지를 입력하세요..."
          className="flex-1 px-4 py-3 border rounded-full focus:outline-none shadow-sm"
        />
        <button
          onClick={sendMessage}
          className="ml-2 bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 shadow-sm"
        >
          전송
        </button>
      </div>
    </div>
  )
}
