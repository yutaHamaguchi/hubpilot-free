// ===========================================
// HubPilot Free - Structure Generation Function
// ===========================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StructureRequest {
  theme: string
  settings?: {
    clusterCount?: number
    targetAudience?: string
    tone?: string
  }
}

interface StructureResult {
  pillarPage: {
    title: string
    summary: string
    content: string
    internalLinks: any[]
  }
  clusterPages: Array<{
    id: string
    title: string
    summary: string
    wordCount: number
    qualityStatus: string
  }>
}

serve(async (req) => {
  // CORS プリフライトリクエスト処理
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { theme, settings = {} }: StructureRequest = await req.json()

    if (!theme || theme.trim().length === 0) {
      throw new Error('テーマが指定されていません')
    }

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

    console.log(`構造生成開始: ${theme}`)

    // DeepSeek APIで構造生成（優先）
    const structure = deepseekApiKey
      ? await generateStructureWithDeepSeek(theme, settings, deepseekApiKey)
      : await generateStructureWithOpenAI(theme, settings, openaiApiKey!)

    // プロジェクトをデータベースに保存
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        theme: theme,
        pillar_page: structure.pillarPage,
        cluster_pages: structure.clusterPages,
        settings: settings
      })
      .select()
      .single()

    if (projectError) {
      console.warn('プロジェクト保存エラー:', projectError)
      // エラーがあっても構造は返す
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...structure,
        projectId: project?.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('構造生成エラー:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

/**
 * DeepSeek APIで構造生成
 */
async function generateStructureWithDeepSeek(
  theme: string,
  settings: any,
  apiKey: string
): Promise<StructureResult> {
  const clusterCount = settings.clusterCount || 10
  const targetAudience = settings.targetAudience || '一般ユーザー'

  const prompt = `
あなたは日本のSEOエキスパートです。以下のテーマに基づいて、ピラー・クラスター戦略に最適化されたコンテンツ構造を作成してください。

【メインテーマ】: ${theme}
【対象読者】: ${targetAudience}
【クラスター記事数】: ${clusterCount}記事

【要件】:
1. ピラーページ（メイン記事）のタイトルと概要を作成
2. ${clusterCount}個のクラスター記事のタイトルと概要を作成
3. SEOキーワード戦略を考慮
4. 各記事が独立性を保ちつつ、ピラーページと関連性を持つ
5. 検索意図（情報収集、比較検討、購入意向）を考慮した構成

以下のJSON形式で回答してください：

{
  "pillarPage": {
    "title": "ピラーページのタイトル",
    "summary": "ピラーページの概要（100-150文字）"
  },
  "clusterPages": [
    {
      "title": "クラスター記事1のタイトル",
      "summary": "記事1の概要（50-80文字）"
    },
    {
      "title": "クラスター記事2のタイトル",
      "summary": "記事2の概要（50-80文字）"
    }
    // ... ${clusterCount}記事分
  ]
}

JSONのみを返してください。説明文は不要です。
`

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  try {
    // JSONを抽出（```json ``` で囲まれている場合があるため）
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/)
    const jsonString = jsonMatch ? jsonMatch[1] : content
    const aiResult = JSON.parse(jsonString)

    // 結果を標準形式に変換
    const pillarPage = {
      title: aiResult.pillarPage.title,
      summary: aiResult.pillarPage.summary,
      content: '',
      internalLinks: []
    }

    const clusterPages = aiResult.clusterPages.map((page: any, index: number) => ({
      id: `cluster-${index + 1}`,
      title: page.title,
      summary: page.summary,
      wordCount: 0,
      qualityStatus: '未生成'
    }))

    return { pillarPage, clusterPages }

  } catch (parseError) {
    console.error('JSON解析エラー:', parseError)
    console.error('AI応答:', content)
    throw new Error('AI応答の解析に失敗しました')
  }
}

/**
 * OpenAI APIで構造生成（フォールバック用）
 */
async function generateStructureWithOpenAI(
  theme: string,
  settings: any,
  apiKey: string
): Promise<StructureResult> {
  const clusterCount = settings.clusterCount || 10
  const targetAudience = settings.targetAudience || '一般ユーザー'

  const prompt = `
あなたは日本のSEOエキスパートです。「${theme}」というテーマで、ピラー・クラスター戦略に基づいたコンテンツ構造を作成してください。

対象読者: ${targetAudience}
クラスター記事数: ${clusterCount}記事

以下のJSON形式で回答してください：

{
  "pillarPage": {
    "title": "ピラーページのタイトル",
    "summary": "ピラーページの概要"
  },
  "clusterPages": [
    {
      "title": "クラスター記事のタイトル",
      "summary": "記事の概要"
    }
  ]
}
`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      ms: 2000,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  try {
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/)
    const jsonString = jsonMatch ? jsonMatch[1] : content
    const aiResult = JSON.parse(jsonString)

    const pillarPage = {
      title: aiResult.pillarPage.title,
      summary: aiResult.pillarPage.summary,
      content: '',
      internalLinks: []
    }

    const clusterPages = aiResult.clusterPages.map((page: any, index: number) => ({
      id: `cluster-${index + 1}`,
      title: page.title,
      summary: page.summary,
      wordCount: 0,
      qualityStatus: '未生成'
    }))

    return { pillarPage, clusterPages }

  } catch (parseError) {
    console.error('JSON解析エラー:', parseError)
    throw new Error('AI応答の解析に失敗しました')
  }
}
