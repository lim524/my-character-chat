import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 서비스 키 사용
)

export const config = {
  api: {
    bodyParser: false, // 파일 업로드는 multipart/form-data 사용
  },
}

import formidable from 'formidable'
import fs from 'fs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const form = new formidable.IncomingForm()

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('❌ Form parsing error:', err)
      return res.status(500).json({ error: 'Form parsing failed' })
    }

    const file = files.file?.[0]
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const fileContent = fs.readFileSync(file.filepath)
    const safeName = file.originalFilename?.replace(/\s+/g, '_').replace(/[^\w.-]/gi, '') || 'uploaded.png'
    const fileName = `emotion-${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('emotion-images')
      .upload(fileName, fileContent, {
        contentType: file.mimetype || 'image/png',
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('❌ Upload error:', uploadError)
      return res.status(500).json({ error: 'Upload failed' })
    }

    // ✅ URL을 직접 생성
    const publicUrl = `https://whhzgmbuqpsjhhkoywif.supabase.co/storage/v1/object/public/emotion-images/${fileName}`

    return res.status(200).json({ url: publicUrl })
  })
}
