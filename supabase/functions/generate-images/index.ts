// ===========================================
// HubPilot Free - Image Generation Function
// ===========================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImageGenerationRequest {
  articleId: string
  title: string
  content: string
  generateHero: boolean
  generateIllustrations: boolean
  illustrationCount: number
  provider?: 'dalle3' | 'stability' | 'auto'
}

interface GeneratedImage {
  type: 'hero' | 'illustration'
  url: string
  storagePath: string
  prompt: string
  provider: string
  cost: number
  width: number
  height: number
  altText: string
  position?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      articleId,
      title,
      content,
      generateHero = true,
      generateIllustrations = true,
      illustrationCount = 3,
      provider = 'auto'
    }: ImageGenerationRequest = await req.json()

    // Supabaseクライアント初期化
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const generatedImages: GeneratedImage[] = []
    let totalCost = 0

    // プロバイダー選択
    const selectedProvider = await selectProvider(provider, supabase)

    console.log(`画像生成開始: ${title}`)
    console.log(`プロバイダー: ${selectedProvider}`)

    // 1. ヒーロー画像生成
    if (generateHero) {
      try {
        const heroPrompt = await generateHeroPrompt(title, content)
        const heroImage = await generateImage({
          prompt: heroPrompt,
          type: 'hero',
          provider: selectedProvider,
          size: '1024x1792'
        })

        // Supabase Storageにアップロード
        const storagePath = `hero/${articleId}/${Date.now()}.png`
        const imageUrl = await uploadImageToStorage(supabase, heroImage.imageData, storagePath)

        const image: GeneratedImage = {
          type: 'hero',
          url: imageUrl,
          storagePath,
          prompt: heroPrompt,
          provider: selectedProvider,
          cost: heroImage.cost,
          width: 1024,
          height: 1792,
          altText: `${title}のヒーロー画像`
        }

        generatedImages.push(image)
        totalCost += heroImage.cost

        // データベースに保存
        await saveImageToDatabase(supabase, articleId, image)

        console.log(`✅ ヒーロー画像生成完了: ${imageUrl}`)

      } catch (error) {
        console.error('ヒーロー画像生成エラー:', error)
        // エラーでも続行
      }
    }

    // 2. 説明画像生成
    if (generateIllustrations) {
      const sections = extractSections(content)
      const targetSections = sections.slice(0, illustrationCount)

      for (let i = 0; i < targetSections.length; i++) {
        try {
          const section = targetSections[i]
          const illustrationPrompt = await generateIllustrationPrompt(
            section.heading,
            section.content
          )

          const illustration = await generateImage({
            prompt: illustrationPrompt,
            type: 'illustration',
            provider: selectedProvider,
            size: '1024x1024'
          })

          // Supabase Storageにアップロード
          const storagePath = `illustrations/${articleId}/${Date.now()}_${i}.png`
          const imageUrl = await uploadImageToStorage(
            supabase,
            illustration.imageData,
            storagePath
          )

          const image: GeneratedImage = {
            type: 'illustration',
            url: imageUrl,
            storagePath,
            prompt: illustrationPrompt,
            provider: selectedProvider,
            cost: illustration.cost,
            width: 1024,
            height: 1024,
            altText: `${section.heading}の説明画像`,
            position: i + 1
          }

          generatedImages.push(image)
          totalCost += illustration.cost

          // データベースに保存
          await saveImageToDatabase(supabase, articleId, image)

          console.log(`✅ 説明画像${i + 1}生成完了: ${imageUrl}`)

          // レート制限対策（1秒待機）
          await new Promise(resolve => setTimeout(resolve, 1000))

        } catch (error) {
          console.error(`説明画像${i + 1}生成エラー:`, error)
          // エラーでも続行
        }
      }
    }

    // コスト記録
    await recordCost(supabase, articleId, selectedProvider, generatedImages.length, totalCost)

    console.log(`🎉 画像生成完了: ${generatedImages.length}枚, コスト: $${totalCost.toFixed(4)}`)

    return new Response(
      JSON.stringify({
        success: true,
        images: generatedImages,
        totalCost: parseFloat(totalCost.toFixed(4)),
        provider: selectedProvider
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('画像生成エラー:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

/**
 * プロバイダー選択
 */
async function selectProvider(
  preferredProvider: string,
  supabase: any
): Promise<'dalle3' | 'stability'> {
  if (preferredProvider === 'dalle3' || preferredProvider === 'stability') {
    return preferredProvider
  }

  // 自動選択：月間コストをチェック
  const { data } = await supabase.rpc('get_monthly_image_cost')
  const monthlyCost = data || 0

  // 月間コストが$30未満ならDALL-E 3、それ以降はStability AI
  return monthlyCost < 30 ? 'dalle3' : 'stability'
}

/**
 * ヒーロー画像プロンプト生成
 */
async function generateHeroPrompt(title: string, content: string): Promise<string> {
  const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY')
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

  const apiKey = deepseekApiKey || openaiApiKey
  const apiUrl = deepseekApiKey
    ? 'https://api.deepseek.com/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'

  if (!apiKey) {
    // APIキーがない場合はデフォルトプロンプト
    return `Professional hero image for a blog post about "${title}", modern and eye-catching design, high quality, photorealistic`
  }

  const summary = content.substring(0, 500) // 最初の500文字

  const systemPrompt = `あなたは画像生成プロンプトの専門家です。記事の内容から、DALL-E 3やStable Diffusionで使用する最適な英語プロンプトを生成します。`

  const userPrompt = `
記事タイトル: ${title}
記事内容の要約: ${summary}

上記の記事に最適なヒーロー画像を生成するための、画像生成AI用の英語プロンプトを作成してください。

要件:
- プロフェッショナルで視覚的に魅力的
- 記事のテーマを明確に表現
- 1024x1792サイズに適した縦長の構図
- テキストは含めない
- 写実的またはイラスト風（記事の内容に応じて）
- 日本人向けの記事なので、必要に応じてアジア系の人物を含める

英語プロンプトのみを出力してください（説明は不要）:
`

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: deepseekApiKey ? 'deepseek-chat' : 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Prompt generation failed: ${response.status}`)
    }

    const data = await response.json()
    const prompt = data.choices[0].message.content.trim()

    console.log('生成されたヒーロープロンプト:', prompt)
    return prompt

  } catch (error) {
    console.error('プロンプト生成エラー:', error)
    // フォールバック
    return `Professional hero image for "${title}", modern design, high quality`
  }
}

/**
 * 説明画像プロンプト生成
 */
async function generateIllustrationPrompt(
  sectionHeading: string,
  sectionContent: string
): Promise<string> {
  const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY')
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

  const apiKey = deepseekApiKey || openaiApiKey
  const apiUrl = deepseekApiKey
    ? 'https://api.deepseek.com/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'

  if (!apiKey) {
    return `Illustration for "${sectionHeading}", simple and clear, infographic style`
  }

  const systemPrompt = `あなたは画像生成プロンプトの専門家です。記事のセクション内容から、説明用画像の英語プロンプトを生成します。`

  const userPrompt = `
セクション見出し: ${sectionHeading}
セクション内容: ${sectionContent.substring(0, 300)}

このセクションを視覚的に説明する画像の英語プロンプトを作成してください。

要件:
- セクション内容を分かりやすく表現
- シンプルで明確
- 1024x1024サイズの正方形に適した構図
- インフォグラフィック風またはイラスト風
- ビジネス向けのプロフェッショナルなスタイル

英語プロンプトのみを出力してください:
`

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: deepseekApiKey ? 'deepseek-chat' : 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Prompt generation failed: ${response.status}`)
    }

    const data = await response.json()
    const prompt = data.choices[0].message.content.trim()

    console.log('生成された説明画像プロンプト:', prompt)
    return prompt

  } catch (error) {
    console.error('プロンプト生成エラー:', error)
    return `Illustration for "${sectionHeading}", simple and clear`
  }
}

/**
 * 画像生成（DALL-E 3 or Stability AI）
 */
async function generateImage(options: {
  prompt: string
  type: 'hero' | 'illustration'
  provider: 'dalle3' | 'stability'
  size: string
}): Promise<{ imageData: Uint8Array; cost: number }> {
  if (options.provider === 'dalle3') {
    return generateWithDALLE3(options.prompt, options.size)
  } else {
    return generateWithStability(options.prompt, options.size)
  }
}

/**
 * DALL-E 3で画像生成
 */
async function generateWithDALLE3(
  prompt: string,
  size: string
): Promise<{ imageData: Uint8Array; cost: number }> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: size === '1024x1792' ? '1024x1792' : '1024x1024',
      quality: size === '1024x1792' ? 'hd' : 'standard',
      response_format: 'url'
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`DALL-E 3 API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const imageUrl = data.data[0].url

  // 画像をダウンロード
  const imageResponse = await fetch(imageUrl)
  const imageData = new Uint8Array(await imageResponse.arrayBuffer())

  // コスト計算
  const cost = size === '1024x1792' ? 0.080 : 0.040

  return { imageData, cost }
}

/**
 * Stability AIで画像生成
 */
async function generateWithStability(
  prompt: string,
  size: string
): Promise<{ imageData: Uint8Array; cost: number }> {
  const stabilityApiKey = Deno.env.get('STABILITY_API_KEY')

  if (!stabilityApiKey) {
    throw new Error('Stability API key not configured')
  }

  // サイズ変換
  const [width, height] = size.split('x').map(Number)

  const response = await fetch(
    'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stabilityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text_prompts: [
          {
            text: prompt,
            weight: 1
          }
        ],
        cfg_scale: 7,
        width: width,
        height: height,
        steps: 30,
        samples: 1,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Stability API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const base64Image = data.artifacts[0].base64

  // Base64をUint8Arrayに変換
  const imageData = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0))

  // コスト（Stabilityは約$0.01/画像）
  const cost = 0.01

  return { imageData, cost }
}

/**
 * Supabase Storageに画像をアップロード
 */
async function uploadImageToStorage(
  supabase: any,
  imageData: Uint8Array,
  storagePath: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('hubpilot-images')
    .upload(storagePath, imageData, {
      contentType: 'image/png',
      upsert: false
    })

  if (error) throw error

  // 公開URLを取得
  const { data: urlData } = supabase.storage
    .from('hubpilot-images')
    .getPublicUrl(storagePath)

  return urlData.publicUrl
}

/**
 * データベースに画像情報を保存
 */
async function saveImageToDatabase(
  supabase: any,
  articleId: string,
  image: GeneratedImage
) {
  const { error } = await supabase
    .from('article_images')
    .insert({
      article_id: articleId,
      image_type: image.type,
      image_url: image.url,
      storage_path: image.storagePath,
      prompt: image.prompt,
      generation_provider: image.provider,
      generation_cost: image.cost,
      width: image.width,
      height: image.height,
      alt_text: image.altText,
      position: image.position || 0
    })

  if (error) throw error
}

/**
 * コスト記録
 */
async function recordCost(
  supabase: any,
  articleId: string,
  provider: string,
  imageCount: number,
  totalCost: number
) {
  // プロジェクトIDを取得
  const { data: article } = await supabase
    .from('articles')
    .select('project_id')
    .eq('id', articleId)
    .single()

  if (!article) return

  await supabase
    .from('image_generation_costs')
    .insert({
      project_id: article.project_id,
      provider: provider,
      image_count: imageCount,
      total_cost: totalCost
    })
}

/**
 * 記事からセクションを抽出
 */
function extractSections(content: string): Array<{ heading: string; content: string }> {
  const sections: Array<{ heading: string; content: string }> = []

  // H2またはH3見出しでセクションを分割
  const matches = content.matchAll(/^(##|###)\s+(.+)$/gm)
  const headings = Array.from(matches)

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i][2].trim()
    const startPos = headings[i].index! + headings[i][0].length
    const endPos = headings[i + 1]?.index || content.length

    const sectionContent = content.substring(startPos, endPos).trim()

    if (sectionContent.length > 100) { // 100文字以上のセクションのみ
      sections.push({ heading, content: sectionContent })
    }
  }

  return sections
}
