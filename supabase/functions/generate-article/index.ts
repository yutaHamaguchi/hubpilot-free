// ===========================================
// HubPilot Free - Article Generation Function
// ===========================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ArticleRequest {
  theme: string
  headings: string[]
  settings: {
    projectId?: string
    targetLength?: number
    targetAudience?: string
    tone?: string
  }
}

interface ArticleResult {
  content: string
  wordCount: number
  generationTime: number
}

serve(async (req) => {
  // CORS プリフライトリクエスト処理
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { theme, headings, settings }: ArticleRequest = await req.json()

    // Supabaseクライアント初期化
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // API キー取得
    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY')
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

    if (!deepseekApiKey && !openaiApiKey) {
      throw new Error('AI API キーが設定されていません')
    }

    const results = []

    // 各見出しごとに記事を生成
    for (let i = 0; i < headings.length; i++) {
      try {
        console.log(`記事生成開始: ${i + 1}/${headings.length} - ${headings[i]}`)

        // DeepSeek APIで記事生成（優先）
        const article = deepseekApiKey
          ? await generateWithDeepSeek(theme, headings[i], settings, deepseekApiKey)
          : await generateWithOpenAI(theme, headings[i], settings, openaiApiKey!)

        // データベースに保存
        const { data, error } = await supabase
          .from('articles')
          .insert({
            project_id: settings.projectId,
            title: headings[i],
            content: article.content,
            word_count: article.wordCount,
            ai_provider: deepseekApiKey ? 'deepseek' : 'openai',
            generation_time: article.generationTime,
            status: 'completed'
          })
          .select()
          .single()

        if (error) throw error

        results.push(data)

        // リアルタイム更新（進捗状況）
        if (settings.projectId) {
          await supabase
            .from('generation_logs')
            .update({
              current_article: i + 1,
              status: 'in_progress',
              updated_at: new Date().toISOString()
            })
            .eq('project_id', settings.projectId)
        }

      } catch (deepseekError) {
        console.warn('DeepSeek失敗、OpenAIにフォールバック:', deepseekError)

        // フォールバック: OpenAI
        if (!openaiApiKey) {
          throw deepseekError
        }

        const article = await generateWithOpenAI(theme, headings[i], settings, openaiApiKey)

        const { data, error } = await supabase
          .from('articles')
          .insert({
            project_id: settings.projectId,
            title: headings[i],
            content: article.content,
            word_count: article.wordCount,
            ai_provider: 'openai_fallback',
            generation_time: article.generationTime,
            status: 'completed'
          })
          .select()
          .single()

        if (error) throw error
        results.push(data)
      }
    }

    // 最終ステータス更新
    if (settings.projectId) {
      await supabase
        .from('generation_logs')
        .update({
          status: 'completed',
          current_article: headings.length,
          updated_at: new Date().toISOString()
        })
        .eq('project_id', settings.projectId)
    }

    return new Response(
      JSON.stringify({ success: true, articles: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('記事生成エラー:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

/**
 * DeepSeek APIで記事生成
 */
async function generateWithDeepSeek(
  theme: string,
  heading: string,
  settings: any,
  apiKey: string
): Promise<ArticleResult> {
  const prompt = `
あなたは日本のSEOエキスパートライターです。以下の条件で高品質な記事を作成してください：

【メインテーマ】: ${theme}
【記事タイトル/見出し】: ${heading}
【目標文字数】: ${settings.targetLength || 2000}文字
【対象読者】: ${settings.targetAudience || '一般ユーザー'}
【トーン】: ${settings.tone || 'です・ます調'}

【要件】:
- 自然で読みやすい日本語
- SEOキーワードを適切に配置（過度な詰め込みは避ける）
- 論理的な構成と流れ
- 専門性と信頼性を重視（E-E-A-T）
- 読者に価値ある情報を提供
- 適切な見出し構造（H2, H3を使用）

【禁止事項】:
- キーワードの過度な繰り返し
- 内容の薄い記事
- コピーコンテンツ
- 不自然な日本語

記事をMarkdown形式で作成してください。見出しは「##」または「###」を使用してください。
`

  const startTime = Date.now()

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: Math.ceil((settings.targetLength || 2000) * 2), // 余裕を持って2倍
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content
  const generationTime = Math.round((Date.now() - startTime) / 1000)
  const wordCount = content.length

  return {
    content,
    wordCount,
    generationTime
  }
}

/**
 * OpenAI APIで記事生成（フォールバック用）
 */
async function generateWithOpenAI(
  theme: string,
  heading: string,
  settings: any,
  apiKey: string
): Promise<ArticleResult> {
  const prompt = `
あなたは日本のSEOエキスパートライターです。以下の条件で高品質な記事を作成してください：

【メインテーマ】: ${theme}
【記事タイトル/見出し】: ${heading}
【目標文字数】: ${settings.targetLength || 2000}文字
【対象読者】: ${settings.targetAudience || '一般ユーザー'}

【要件】:
- 自然で読みやすい日本語
- SEO最適化
- 論理的な構成
- 専門性と信頼性を重視
- です・ます調

記事をMarkdown形式で作成してください：
`

  const startTime = Date.now()

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: Math.ceil((settings.targetLength || 2000) * 2),
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content
  const generationTime = Math.round((Date.now() - startTime) / 1000)
  const wordCount = content.length

  return {
    content,
    wordCount,
    generationTime
  }
}
