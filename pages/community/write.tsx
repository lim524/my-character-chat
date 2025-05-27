// pages/community/write.tsx
import { useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '../../lib/supabaseClient'

export default function WritePost() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const router = useRouter()

  const handleSubmit = async () => {
    if (!title || !content) {
      alert('제목과 내용을 입력하세요.')
      return
    }

    const { error } = await supabase.from('community_posts').insert({
      title,
      content,
    })

    if (error) {
      alert('글 작성 실패: ' + error.message)
    } else {
      router.push('/community')
    }
  }

  return (
    <div className="p-6 text-white bg-black min-h-screen">
      <h1 className="text-2xl font-bold mb-4">글 작성</h1>

      <input
        className="w-full p-2 mb-4 bg-zinc-800 rounded"
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="w-full p-2 mb-4 bg-zinc-800 rounded h-40"
        placeholder="내용"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 rounded">
        등록
      </button>
    </div>
  )
}
