import { useState } from 'react'

export default function ImageUploader({ onUpload }: { onUpload: (url: string) => void }) {
  const [loading, setLoading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'mychat_upload') // ← preset 이름
    formData.append('folder', 'characters') // Cloudinary 폴더

    const res = await fetch('https://api.cloudinary.com/v1_1/dz87b8il7/image/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    onUpload(data.secure_url)
    setLoading(false)
  }

  return (
    <div>
      <label
        style={{
          display: 'inline-block',
          padding: '0.6rem 1.2rem',
          borderRadius: '9999px',
          backgroundColor: '#ec4899', // 🎀 pink-500
          color: 'white',
          fontWeight: 'bold',
          cursor: 'pointer',
          width: 'fit-content',
          transition: 'background-color 0.2s ease',
        }}
        onMouseOver={(e) => {
          (e.target as HTMLLabelElement).style.backgroundColor = '#f472b6' // pink-400
        }}
        onMouseOut={(e) => {
          (e.target as HTMLLabelElement).style.backgroundColor = '#ec4899'
        }}
      >
        📁 이미지 업로드
        <input type="file" accept="image/*" onChange={handleUpload} hidden />
      </label>

      {loading && (
        <p style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '0.4rem' }}>
          업로드 중...
        </p>
      )}
    </div>
  )
}
