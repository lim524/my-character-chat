// pages/community/index.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '@/lib/supabaseClient'

type Post = {
  id: string
  title: string
  content: string
  created_at: string
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('글 목록 불러오기 실패:', error)
      } else {
        setPosts(data || [])
      }
    }

    fetchPosts()
  }, [])

  return (
    <div className="p-6 text-white bg-black min-h-screen">
      <h1 className="text-2xl font-bold mb-4">커뮤니티</h1>
      <button
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={() => router.push('/community/write')}
      >
        ✏️ 글 작성
      </button>

      {posts.map((post) => (
        <div
          key={post.id}
          onClick={() => router.push(`/community/post/${post.id}`)}
          className="p-4 bg-zinc-800 rounded mb-4 cursor-pointer hover:bg-zinc-700"
        >
          <h2 className="text-lg font-semibold">{post.title}</h2>
          <p className="text-sm text-gray-300 line-clamp-2">{post.content}</p>
          <p className="text-xs text-gray-500 mt-1">{new Date(post.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  )
}
