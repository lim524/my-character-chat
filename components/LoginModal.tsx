import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/router'
import { FcGoogle } from 'react-icons/fc'
import supabase from '../lib/supabaseClient'

interface LoginModalProps {
  onClose: () => void
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoginMode, setIsLoginMode] = useState(true)
  const router = useRouter()

  const handleEmailAuth = async () => {
    setError('')

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    if (isLoginMode) {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) {
        setError('로그인에 실패했습니다: ' + loginError.message)
      } else {
        onClose()
        router.reload()
      }
    } else {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setError('회원가입에 실패했습니다: ' + signUpError.message)
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (loginError) {
          setError('로그인에 실패했습니다: ' + loginError.message)
        } else {
          onClose()
          router.reload()
        }
      }
    }
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })

    if (error) {
      setError('Google 로그인 실패: ' + error.message)
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-[#111] text-white p-8 rounded-xl w-full max-w-sm shadow-xl relative">
        <h2 className="text-xl font-bold mb-6 text-center">로그인 / 회원가입</h2>

        <button
          className="bg-white text-black w-full py-2 rounded mb-4 flex items-center justify-center gap-2"
          onClick={handleGoogleLogin}
        >
          <FcGoogle className="text-xl" />
          Google 계정으로 시작하기
        </button>

        <div className="border-t border-gray-700 my-4" />

        <input
          type="email"
          placeholder="이메일 주소"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 bg-[#222] border border-gray-600 rounded mb-2"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 bg-[#222] border border-gray-600 rounded mb-4"
        />
        <button
          onClick={handleEmailAuth}
          className="bg-yellow-500 text-black w-full py-2 rounded"
        >
          {isLoginMode ? '이메일로 로그인' : '이메일로 회원가입'}
        </button>

        <p
          className="text-sm mt-4 text-center text-gray-400 cursor-pointer hover:underline"
          onClick={() => {
            setIsLoginMode(!isLoginMode)
            setError('')
          }}
        >
          {isLoginMode ? '회원가입' : '이미 계정이 있으신가요?'}
        </p>

        {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>,
    document.body
  )
}
