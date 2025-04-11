import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

interface Character {
  name: string
  personality: string
  description: string
  situation: string
  imageUrl: string
}

export default function Home() {
  const [name, setName] = useState('')
  const [personality, setPersonality] = useState('')
  const [description, setDescription] = useState('')
  const [situation, setSituation] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [characters, setCharacters] = useState<Character[]>([])
  const [editIndex, setEditIndex] = useState<number | null>(null)

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

  const addOrEditCharacter = () => {
    if (!name || !personality || !description) return

    const newCharacter = { name, personality, description, situation, imageUrl }

    if (editIndex !== null) {
      const updated = [...characters]
      updated[editIndex] = newCharacter
      setCharacters(updated)
      saveCharacters(updated)
      setEditIndex(null)
    } else {
      const updated = [...characters, newCharacter]
      setCharacters(updated)
      saveCharacters(updated)
    }

    setName('')
    setPersonality('')
    setDescription('')
    setSituation('')
    setImageUrl('')
  }

  const deleteCharacter = (index: number) => {
    const updated = [...characters]
    updated.splice(index, 1)
    setCharacters(updated)
    saveCharacters(updated)
  }

  const startEditCharacter = (index: number) => {
    const char = characters[index]
    setName(char.name)
    setPersonality(char.personality)
    setDescription(char.description)
    setSituation(char.situation)
    setImageUrl(char.imageUrl)
    setEditIndex(index)
  }

  const [loading, setLoading] = useState(false); // 로딩 상태 추가

const generateCharacterImage = async () => {
  if (!name || !personality || !description) {
    alert('이름, 성격, 특징을 입력해야 그림을 생성할 수 있어!');
    return;
  }

  setLoading(true); // 생성 시작할 때 로딩 시작

  const prompt = `${personality} 성격과 ${description} 특징을 가진 ${name} 캐릭터의 고퀄리티 일본 애니메이션 스타일 일러스트를 그려줘. 강렬한 선, 만화적 표현 들어가야 돼. 현실적인 웹툰풍으로 그려줘. 캐릭터는 한 명만 나와야 돼. 캐릭터 하나를 부각시켜줘`;

  try {
    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    if (data.imageUrl) {
      setImageUrl(data.imageUrl);
      alert('캐릭터 그림 생성 완료! ✨');
    } else {
      alert('그림 생성 실패...ㅠㅠ');
    }
  } catch (error) {
    console.error(error);
    alert('에러 발생!');
  } finally {
    setLoading(false); // 끝날 때 로딩 종료
  }
};

  
  return (
    <>
      <Head>
        <title>캐릭터 목록</title>
      </Head>
      <main style={{ padding: '2rem', maxWidth: 800, margin: 'auto', backgroundColor: '#111', color: '#eee', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '2rem' }}>내 캐릭터 목록</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
          <input placeholder="이름" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          <input placeholder="성격" value={personality} onChange={e => setPersonality(e.target.value)} style={inputStyle} />
          <input placeholder="특징" value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} />
          <input placeholder="상황 (선택)" value={situation} onChange={e => setSituation(e.target.value)} style={inputStyle} />
          <input placeholder="이미지 URL (선택)" value={imageUrl} onChange={e => setImageUrl(e.target.value)} style={inputStyle} />

          {loading && (
  <p style={{ color: 'orange', textAlign: 'center', marginBottom: '1rem' }}>
    그림 생성 중입니다... 잠시만 기다려주세요! 🖌️
  </p>
)}


          <button
            onClick={generateCharacterImage}
            style={{ padding: '0.6rem', borderRadius: 8, backgroundColor: '#f59e0b', color: 'white', border: 'none', cursor: 'pointer' }}
>
  캐릭터 그림 생성
            </button>

          <button onClick={addOrEditCharacter} style={buttonStyle}>
            {editIndex !== null ? '캐릭터 수정' : '캐릭터 추가'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {characters.map((char, i) => (
            <div key={i} style={cardStyle}>
              {char.imageUrl && (
                <img src={char.imageUrl} alt={char.name} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: '12px 12px 0 0' }} />
              )}
              <div style={{ padding: '1rem' }}>
                <h2 style={{ marginBottom: '0.5rem' }}>{char.name}</h2>
                <p style={{ fontSize: '0.9rem' }}><strong>성격:</strong> {char.personality}</p>
                <p style={{ fontSize: '0.9rem' }}><strong>특징:</strong> {char.description}</p>
                {char.situation && <p style={{ fontSize: '0.8rem', color: '#aaa' }}>#{char.situation}</p>}
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => router.push(`/chat/${encodeURIComponent(char.name)}`)} style={chatButton}>채팅</button>
                  <button onClick={() => startEditCharacter(i)} style={editButton}>수정</button>
                  <button onClick={() => deleteCharacter(i)} style={deleteButton}>삭제</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}

const inputStyle = { padding: '0.6rem', borderRadius: 8, border: '1px solid #444', backgroundColor: '#222', color: '#eee', fontSize: '1rem' }
const buttonStyle = { padding: '0.6rem', borderRadius: 8, backgroundColor: '#4f46e5', color: 'white', border: 'none', cursor: 'pointer' }
const deleteButton = { backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: 6 }
const chatButton = { backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: 6 }
const editButton = { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: 6 }
const cardStyle = { backgroundColor: '#1f1f1f', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }
