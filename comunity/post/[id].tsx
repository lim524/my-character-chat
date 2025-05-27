import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '@/lib/supabaseClient'

export default function PostDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const [post, setPost] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  // 사용자 정보 가져오기
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? null)
    })
  }, [])

  // 글 + 댓글 불러오기
  useEffect(() => {
    if (!id) return
    const fetchData = async () => {
      const { data: postData } = await supabase
        .from('community_posts')
        .select('*')
        .eq('id', id)
        .single()
      setPost(postData)

      const { data: commentData } = await supabase
        .from('community_comments')
        .select('*')
        .eq('post_id', id)
        .order('created_at', { ascending: true })
      setComments(commentData || [])
    }
    fetchData()
  }, [id])

  const handleDeletePost = async () => {
    if (!confirm('정말 이 글을 삭제하시겠습니까?')) return
    const { error } = await supabase.from('community_posts').delete().eq('id', id)
    if (!error) router.push('/community')
  }

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return
    const { error } = await supabase.from('community_comments').insert({
      post_id: id,
      content: newComment,
    })
    if (!error) {
      setNewComment('')
      const { data } = await supabase
        .from('community_comments')
        .select('*')
        .eq('post_id', id)
        .order('created_at', { ascending: true })
      setComments(data || [])
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return
    const { error } = await supabase.from('community_comments').delete().eq('id', commentId)
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    }
  }

  if (!post) return <div className="text-white p-6">불러오는 중...</div>

  return (
    <div className="p-6 text-white bg-black min-h-screen">
      <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
      <p className="text-sm text-gray-400 mb-4">{new Date(post.created_at).toLocaleString()}</p>
      <p className="whitespace-pre-wrap mb-6">{post.content}</p>

      {/* 수정/삭제 버튼 */}
      {userId === post.user_id && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => router.push(`/community/edit/${post.id}`)}
            className="px-4 py-2 bg-yellow-500 text-black rounded"
          >
            수정
          </button>
          <button
            onClick={handleDeletePost}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            삭제
          </button>
        </div>
      )}

      <h2 className="text-lg font-bold mb-2">💬 댓글</h2>
      <div className="space-y-3 mb-4">
        {comments.map((c) => (
          <div key={c.id} className="bg-zinc-800 p-3 rounded text-sm relative">
            <p className="whitespace-pre-wrap">{c.content}</p>
            <p className="text-xs text-gray-500 mt-1">{new Date(c.created_at).toLocaleString()}</p>
            {userId === c.user_id && (
              <button
                onClick={() => handleDeleteComment(c.id)}
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
        onClick={handleCommentSubmit}
        className="px-4 py-2 bg-blue-600 rounded"
      >
        등록
      </button>
    </div>
  )
}
