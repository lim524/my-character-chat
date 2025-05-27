// ✅ pages/community/index.tsx - Lucide 통일 + 글 수정 포함 완료
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '@/lib/supabaseClient'
import { MessageSquare, Heart, Pencil, Megaphone, Trash2, Edit3, X } from 'lucide-react'

interface Post {
  id: string
  title: string
  content: string
  created_at: string
  user_id: string
  likes?: number
}

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    const { data } = await supabase.from('community_posts').select('*').order('created_at', { ascending: false })
    setPosts(data || [])
  }

  const handleSubmit = async () => {
    if (!userId || !title || !content) return
    const { error } = await supabase.from('community_posts').insert({
      title,
      content,
      user_id: userId,
    })
    if (!error) {
      setTitle(''); setContent('')
      fetchPosts()
    }
  }

  const openPost = async (post: Post) => {
    setSelectedPost(post)
    const { data } = await supabase.from('community_comments').select('*').eq('post_id', post.id).order('created_at', { ascending: true })
    setComments(data || [])
  }

  const addComment = async () => {
    if (!userId || !selectedPost || !newComment) return
    const { error } = await supabase.from('community_comments').insert({
      post_id: selectedPost.id,
      content: newComment,
      user_id: userId,
    })
    if (!error) {
      setNewComment('')
      const { data } = await supabase.from('community_comments').select('*').eq('post_id', selectedPost.id).order('created_at', { ascending: true })
      setComments(data || [])
    }
  }

  const deleteComment = async (id: string) => {
    await supabase.from('community_comments').delete().eq('id', id)
    setComments((prev) => prev.filter((c) => c.id !== id))
  }

  const deletePost = async (id: string) => {
    await supabase.from('community_posts').delete().eq('id', id)
    setSelectedPost(null)
    fetchPosts()
  }

  const startEdit = () => {
    if (!selectedPost) return
    setTitle(selectedPost.title)
    setContent(selectedPost.content)
    setIsEditing(true)
  }

  const handleUpdate = async () => {
    if (!selectedPost || !title || !content) return
    await supabase.from('community_posts').update({ title, content }).eq('id', selectedPost.id)
    setIsEditing(false)
    setSelectedPost(null)
    setTitle('')
    setContent('')
    fetchPosts()
  }

  return (
    <main className="bg-black text-white min-h-screen px-4 pt-24 pb-32">
      {!selectedPost && !isEditing && (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-pink-500" /> 커뮤니티
            </h1>
          </div>

          <div className="mb-6 space-y-2">
            <input
              className="w-full p-2 bg-zinc-800 rounded"
              placeholder="제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="w-full p-2 bg-zinc-800 rounded h-32"
              placeholder="내용"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-sm"
            >
              <Pencil className="w-4 h-4 inline" /> 등록
            </button>
          </div>

          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => openPost(post)}
                className="bg-zinc-900 hover:bg-zinc-800 transition rounded-xl p-4 cursor-pointer shadow-md"
              >
                <h2 className="text-base font-semibold line-clamp-1">{post.title}</h2>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{post.content}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-red-500" /> {post.likes ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4 text-blue-400" /> 댓글
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedPost && !isEditing && (
        <div>
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">{selectedPost.title}</h2>
          <p className="text-gray-400 text-sm mb-4">{new Date(selectedPost.created_at).toLocaleString()}</p>
          <p className="mb-6 whitespace-pre-wrap text-sm">{selectedPost.content}</p>

          {userId === selectedPost.user_id && (
            <div className="flex gap-2 mb-6">
              <button onClick={() => deletePost(selectedPost.id)} className="bg-red-600 px-3 py-1 text-sm rounded flex items-center gap-1">
                <Trash2 className="w-4 h-4" /> 삭제
              </button>
              <button onClick={startEdit} className="bg-yellow-500 px-3 py-1 text-sm rounded flex items-center gap-1 text-black">
                <Edit3 className="w-4 h-4" /> 수정
              </button>
              <button onClick={() => setSelectedPost(null)} className="bg-zinc-700 px-3 py-1 text-sm rounded flex items-center gap-1">
                <X className="w-4 h-4" /> 닫기
              </button>
            </div>
          )}

          <div className="space-y-3 mb-4">
            {comments.map((c) => (
              <div key={c.id} className="bg-zinc-800 p-3 rounded text-sm relative">
                <p>{c.content}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(c.created_at).toLocaleString()}</p>
                {c.user_id === userId && (
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="absolute top-2 right-2 text-xs text-red-400 hover:text-red-200"
                  >
                    삭제
                  </button>
                )}
              </div>
            ))}
          </div>

          <textarea
            className="w-full p-2 bg-zinc-800 rounded h-24 mb-2"
            placeholder="댓글을 입력하세요"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button
            onClick={addComment}
            className="px-4 py-2 bg-blue-600 rounded text-sm"
          >
            댓글 등록
          </button>
        </div>
      )}

      {isEditing && selectedPost && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold">글 수정</h2>
          <input
            className="w-full p-2 bg-zinc-800 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full p-2 bg-zinc-800 rounded h-32"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={handleUpdate} className="bg-green-600 px-4 py-2 rounded text-sm">저장</button>
            <button onClick={() => { setIsEditing(false); setTitle(''); setContent('') }} className="bg-gray-700 px-4 py-2 rounded text-sm">취소</button>
          </div>
        </div>
      )}
    </main>
  )
}
