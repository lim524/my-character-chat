import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import ImageUploader from '@/components/ImageUploader'

interface Character {
  name: string
  personality: string
  description: string
  situation: string
  imageUrl: string
  source: 'openai' | 'huggingface'
}

export default function ChatSelect() {
  const [name, setName] = useState('')
  const [personality, setPersonality] = useState('')
  const [description, setDescription] = useState('')
  const [situation, setSituation] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [source, setSource] = useState<'openai' | 'huggingface'>('openai')
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('my-characters')
    if (saved) {
      setCharacters(JSON.parse(saved))
    }
  }, [])

  const saveCharacters = (newList: Character[]) => {
    localStorage.setItem('my-characters', JSON.stringify(newList))
  }

  const handleAddCharacter = () => {
    if (!name || !personality || !description || !imageUrl) return

    const newCharacter: Character = {
      name,
      personality,
      description,
      situation,
      imageUrl,
      source,
    }

    const updated = [...characters, newCharacter]
    setCharacters(updated)
    saveCharacters(updated)

    setName('')
    setPersonality('')
    setDescription('')
    setSituation('')
    setImageUrl('')
    setSource('openai')
  }

  const handleEditCharacter = (index: number) => {
    const char = characters[index]
    setName(char.name)
    setPersonality(char.personality)
    setDescription(char.description)
    setSituation(char.situation)
    setImageUrl(char.imageUrl)
    setSource(char.source || 'openai')

    const updated = [...characters]
    updated.splice(index, 1)
    setCharacters(updated)
    saveCharacters(updated)
  }

  const handleDeleteCharacter = (index: number) => {
    const updated = [...characters]
    updated.splice(index, 1)
    setCharacters(updated)
    saveCharacters(updated)
  }

  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const isTextArea = e.currentTarget.tagName === 'TEXTAREA'
    if (e.key === 'Enter' && !isTextArea) {
      e.preventDefault()
      handleAddCharacter()
    }
  }

  const goToChat = (name: string) => {
    router.push(`/chat/${encodeURIComponent(name)}`)
  }

  const generateCharacterImage = async () => {
    if (!name || !personality || !description) {
      alert('이름, 성격, 특징을 입력해야 그림을 생성할 수 있어!')
      return
    }

    setLoading(true)

    const prompt = `${personality} 성격과 ${description} 특징을 가진 ${name}, highly detailed anime-style portrait, cinematic lighting, masterpiece quality`

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      const data = await res.json()
      if (data.imageUrl) {
        setImageUrl(data.imageUrl)
        alert('🎉 캐릭터 그림 생성 완료!')
      } else {
        alert('그림 생성 실패...')
      }
    } catch (err) {
      console.error(err)
      alert('에러 발생!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      style={{
        padding: '2rem',
        maxWidth: 800,
        margin: 'auto',
        backgroundColor: '#111',
        color: '#eee',
        minHeight: '100vh',
      }}
    >
      <h1 style={{ marginBottom: '1.5rem' }}>소설 채팅용 캐릭터 선택</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
        <input placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleKeyPress} style={inputStyle} />
        <input placeholder="성격" value={personality} onChange={(e) => setPersonality(e.target.value)} onKeyDown={handleKeyPress} style={inputStyle} />
        <textarea placeholder="특징" value={description} onChange={(e) => setDescription(e.target.value)} onKeyDown={handleKeyPress} rows={4} style={textareaStyle} />

        {/* ✅ 초기 상황 설명 입력란 */}
        <label style={{ fontSize: '0.9rem', color: '#ccc' }}>
          💬 초기 상황 설정 (AI는 이 상황에 몰입해서 반응합니다)
        </label>
        <textarea
          placeholder="예: 늦은 밤, 혼자 남은 교실 안에서 창밖을 바라보고 있는 너에게 그녀가 조용히 다가왔다..."
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          onKeyDown={handleKeyPress}
          rows={3}
          style={textareaStyle}
        />

        <ImageUploader onUpload={(url) => setImageUrl(url)} />

        {/* ✨ 그림 생성 버튼 */}
        <button
          onClick={generateCharacterImage}
          style={{
            ...baseButton,
            backgroundColor: '#f59e0b',
            fontWeight: 'bold',
          }}
        >
          캐릭터 그림 생성
        </button>

        {loading && <p style={{ color: 'orange', textAlign: 'center' }}>이미지 생성 중입니다... 잠시만요!</p>}

        {imageUrl && (
          <img
            src={imageUrl}
            alt="미리보기"
            style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, marginTop: '1rem' }}
          />
        )}

        <select
          value={source}
          onChange={(e) => setSource(e.target.value as 'openai' | 'huggingface')}
          style={inputStyle}
        >
          <option value="openai"> 일반 캐릭터 (검열 있음)</option>
          <option value="huggingface"> NSFW 캐릭터 (검열 없음)</option>
        </select>

        <button onClick={handleAddCharacter} style={baseButton}>
          캐릭터 추가
        </button>
      </div>

      <hr style={{ margin: '2rem 0', borderColor: '#333' }} />
      <h2 style={{ marginBottom: '1rem' }}>생성된 캐릭터</h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {characters.map((char, i) => (
          <div key={i} style={cardStyle}>
            {char.imageUrl && (
              <img src={char.imageUrl} alt={char.name} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: '12px 12px 0 0' }} />
            )}
            <div style={{ padding: '1rem' }}>
              <h3>{char.name}</h3>
              <p><strong>성격:</strong> {char.personality}</p>
              <p><strong>특징:</strong> {char.description}</p>
              {char.situation && <p style={{ color: '#aaa' }}>#{char.situation}</p>}
              <p style={{ color: '#ccc', fontSize: '0.8rem' }}>엔진: {char.source === 'openai' ? 'OpenAI' : 'HuggingFace'}</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'space-between' }}>
                <button onClick={() => goToChat(char.name)} style={chatButton}>채팅</button>
                <button onClick={() => handleEditCharacter(i)} style={editButton}>수정</button>
                <button onClick={() => handleDeleteCharacter(i)} style={deleteButton}>삭제</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

// 스타일
const inputStyle = {
  padding: '0.6rem',
  borderRadius: 8,
  border: '1px solid #444',
  backgroundColor: '#222',
  color: '#eee',
  fontSize: '1rem',
} as const

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical' as const,
  fontFamily: 'inherit',
}

const baseButton = {
  padding: '0.5rem 1rem',
  borderRadius: '9999px',
  border: 'none',
  fontSize: '0.9rem',
  cursor: 'pointer',
  fontWeight: '500',
  transition: 'background-color 0.2s ease',
  color: 'white',
}

const chatButton = {
  ...baseButton,
  backgroundColor: '#3b82f6',
}

const editButton = {
  ...baseButton,
  backgroundColor: '#3b82f6',
}

const deleteButton = {
  ...baseButton,
  backgroundColor: '#ef4444',
}

const cardStyle = {
  backgroundColor: '#1f1f1f',
  borderRadius: 12,
  overflow: 'hidden',
  width: 250,
  boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
}
