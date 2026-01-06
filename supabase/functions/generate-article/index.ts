// ===========================================
// HubPilot Free - Article Generation Function
// ===========================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ArticleRequest {
  title: string
  headings: Array<{
    id: string
    text: string
    level: number
  }>
  targetWordCount: number
  settings: {
    tone?: string
    targetAudience?: string
    keywords?: string[]
  }
}

interface ArticleResult {
  content: string
  wordCount: number
  generationTime: number
  success: boolean
  aiProvider: string
}

serve(async (req) => {
  // CORS プリフライトリクエスト処理
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 入力検証
    const requestData = await req.json()
    const validatedInput = validateArticleRequest(requestData)

    // AI API呼び出し
    const article = await generateArticleWithAI(validatedInput)

    // レスポンス形式統一
    return new Response(
      JSON.stringify({
        success: true,
        content: article.content,
        wordCount: article.wordCount,
        generationTime: article.generationTime,
        aiProvider: article.aiProvider
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('記事生成エラー:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        errorCode: getErrorCode(error)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

/**
 * 新規: 入力検証
 * 要件: 4.1, 7.1
 */
function validateArticleRequest(data: any): ArticleRequest {
  // 基本的な型チェック
  if (!data || typeof data !== 'object') {
    throw new Error('リクエストデータが不正です')
  }

  // タイトル検証
  if (!data.title || typeof data.title !== 'string') {
    throw new Error('記事タイトルが必要です')
  }

  if (data.title.trim().length === 0) {
    throw new Error('記事タイトルが空です')
  }

  if (data.title.length > 200) {
    throw new Error('記事タイトルが長すぎます（最大200文字）')
  }

  // 見出し検証
  if (!Array.isArray(data.headings)) {
    data.headings = []
  }

  // 各見出しの検証
  data.headings.forEach((heading: any, index: number) => {
    if (!heading || typeof heading !== 'object') {
      throw new Error(`見出し[${index}]の形式が不正です`)
    }

    if (!heading.text || typeof heading.text !== 'string') {
      throw new Error(`見出し[${index}]のテキストが必要です`)
    }

    if (heading.text.trim().length === 0) {
      throw new Error(`見出し[${index}]のテキストが空です`)
    }

    if (!heading.level || typeof heading.level !== 'number') {
      heading.level = 2 // デフォルト値
    }

    if (heading.level < 1 || heading.level > 6) {
      throw new Error(`見出し[${index}]のレベルが不正です（1-6の範囲で指定）`)
    }

    if (!heading.id) {
      heading.id = `h${index + 1}`
    }
  })

  // 目標文字数検証
  if (!data.targetWordCount || typeof data.targetWordCount !== 'number') {
    data.targetWordCount = 2000 // デフォルト値
  }

  if (data.targetWordCount < 500) {
    throw new Error('目標文字数は500文字以上である必要があります')
  }

  if (data.targetWordCount > 10000) {
    throw new Error('目標文字数は10,000文字以下である必要があります')
  }

  // 設定検証
  if (!data.settings || typeof data.settings !== 'object') {
    data.settings = {}
  }

  // トーン検証
  if (data.settings.tone && typeof data.settings.tone !== 'string') {
    data.settings.tone = 'です・ます調'
  }

  // 対象読者検証
  if (data.settings.targetAudience && typeof data.settings.targetAudience !== 'string') {
    data.settings.targetAudience = '一般ユーザー'
  }

  // キーワード検証
  if (data.settings.keywords && !Array.isArray(data.settings.keywords)) {
    data.settings.keywords = []
  }

  // XSS対策：HTMLタグの除去
  data.title = sanitizeInput(data.title)
  data.headings.forEach((heading: any) => {
    heading.text = sanitizeInput(heading.text)
  })

  if (data.settings.tone) {
    data.settings.tone = sanitizeInput(data.settings.tone)
  }

  if (data.settings.targetAudience) {
    data.settings.targetAudience = sanitizeInput(data.settings.targetAudience)
  }

  return data as ArticleRequest
}

/**
 * 入力サニタイゼーション
 */
function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''

  // HTMLタグを除去
  const sanitized = input.replace(/<[^>]*>/g, '')

  // 特殊文字をエスケープ
  return sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
}

/**
 * 新規: エラーコード取得
 * 要件: 4.5, 6.1, 6.2, 6.3, 6.4, 6.5
 */
function getErrorCode(error: Error): string {
  const message = error.message.toLowerCase()

  if (message.includes('api key') || message.includes('unauthorized')) {
    return 'API_KEY_ERROR'
  }
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'NETWORK_ERROR'
  }
  if (message.includes('timeout')) {
    return 'TIMEOUT_ERROR'
  }
  if (message.includes('rate limit') || message.includes('quota')) {
    return 'RATE_LIMIT_ERROR'
  }
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return 'VALIDATION_ERROR'
  }
  if (message.includes('supabase') || message.includes('database')) {
    return 'DATABASE_ERROR'
  }

  return 'UNKNOWN_ERROR'
}

/**
 * AI APIを使用した記事生成
 * 要件: 4.2
 */
async function generateArticleWithAI(request: ArticleRequest): Promise<ArticleResult> {
  // API キー取得
  const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY')
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

  if (!deepseekApiKey && !openaiApiKey) {
    throw new Error('AI API キーが設定されていません')
  }

  try {
    // DeepSeek APIで記事生成（優先）
    if (deepseekApiKey) {
      return await generateWithDeepSeek(request, deepseekApiKey)
    } else {
      return await generateWithOpenAI(request, openaiApiKey!)
    }
  } catch (deepseekError) {
    console.warn('DeepSeek失敗、OpenAIにフォールバック:', deepseekError)

    // フォールバック: OpenAI
    if (!openaiApiKey) {
      throw deepseekError
    }

    const result = await generateWithOpenAI(request, openaiApiKey)
    result.aiProvider = 'openai_fallback'
    return result
  }
}

/**
 * DeepSeek APIで記事生成（最適化版）
 * 要件: 4.2
 */
async function generateWithDeepSeek(
  request: ArticleRequest,
  apiKey: string
): Promise<ArticleResult> {
  const prompt = buildOptimizedPrompt(request)
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
      max_tokens: Math.ceil(request.targetWordCount * 2.5), // 余裕を持って2.5倍
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('DeepSeek APIからの無効なレスポンス')
  }

  const content = data.choices[0].message.content
  const generationTime = Math.round((Date.now() - startTime) / 1000)
  const wordCount = content.length

  return {
    content,
    wordCount,
    generationTime,
    success: true,
    aiProvider: 'deepseek'
  }
}

/**
 * OpenAI APIで記事生成（フォールバック用）
 * 要件: 4.2
 */
async function generateWithOpenAI(
  request: ArticleRequest,
  apiKey: string
): Promise<ArticleResult> {
  const prompt = buildOptimizedPrompt(request)
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
      max_tokens: Math.ceil(request.targetWordCount * 2),
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('OpenAI APIからの無効なレスポンス')
  }

  const content = data.choices[0].message.content
  const generationTime = Math.round((Date.now() - startTime) / 1000)
  const wordCount = content.length

  return {
    content,
    wordCount,
    generationTime,
    success: true,
    aiProvider: 'openai'
  }
}

/**
 * 最適化されたプロンプト生成
 * 要件: 4.2
 */
function buildOptimizedPrompt(request: ArticleRequest): string {
  const { title, headings, targetWordCount, settings } = request

  let prompt = `あなたは日本のSEOエキスパートライターです。以下の条件で高品質な記事を作成してください：

【記事タイトル】: ${title}
【目標文字数】: ${targetWordCount}文字
【対象読者】: ${settings.targetAudience || '一般ユーザー'}
【文体】: ${settings.tone || 'です・ます調'}
`

  // 見出し構造がある場合
  if (headings && headings.length > 0) {
    prompt += `
【見出し構造】:
${headings.map(h => `${'#'.repeat(h.level)} ${h.text}`).join('\n')}
`
  }

  // キーワードがある場合
  if (settings.keywords && settings.keywords.length > 0) {
    prompt += `
【SEOキーワード】: ${settings.keywords.join(', ')}
`
  }

  prompt += `
【要件】:
- 自然で読みやすい日本語
- SEOキーワードを適切に配置（過度な詰め込みは避ける）
- 論理的な構成と流れ
- 専門性と信頼性を重視（E-E-A-T）
- 読者に価値ある情報を提供
- 適切な見出し構造を使用

【禁止事項】:
- キーワードの過度な繰り返し
- 内容の薄い記事
- コピーコンテンツ
- 不自然な日本語
- HTMLタグの使用

記事をMarkdown形式で作成してください。見出しは「##」または「###」を使用してください。
`

  return prompt
}
