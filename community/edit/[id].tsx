// pages/community/edit/[id].tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '@/lib/supabaseClient'

export default function EditPost() {
  const router = useRouter()
  const { id } = router.query
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    if (!id) return
    supabase.from('community_posts').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setTitle(data.title)
        setContent(data.content)
      }
    })
  }, [id])

  const handleUpdate = async () => {
    const { error } = await supabase.from('community_posts').update({ title, content }).eq('id', id)
    if (error) {
      alert('수정 실패: ' + error.message)
    } else {
      router.push(`/community/post/${id}`)
    }
  }

  return (
    <div className="p-6 text-white bg-black min-h-screen">
      <h1 className="text-2xl font-bold mb-4">글 수정</h1>
      <input
        className="w-full p-2 mb-4 bg-zinc-800 rounded"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="w-full p-2 mb-4 bg-zinc-800 rounded h-40"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button onClick={handleUpdate} className="px-4 py-2 bg-green-600 rounded">저장</button>
    </div>
  )
}
