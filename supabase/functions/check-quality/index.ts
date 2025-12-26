// ===========================================
// HubPilot Free - Quality Check Function
// ===========================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QualityCheckRequest {
  articleId: string
  content: string
  title: string
}

interface QualityCheckResult {
  overallScore: number
  checks: {
    contentQuality: CheckResult
    structure: CheckResult
    grammar: CheckResult
    seo: CheckResult
    readability: CheckResult
  }
  issues: Issue[]
  suggestions: string[]
}

interface CheckResult {
  score: number
  status: 'excellent' | 'good' | 'fair' | 'poor'
  details: string
}

interface Issue {
  severity: 'critical' | 'warning' | 'info'
  category: string
  message: string
  line?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { articleId, content, title }: QualityCheckRequest = await req.json()

    // Supabaseクライアント初期化
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 品質チェック実行
    const qualityResult = performQualityCheck(content, title)

    // 記事のステータスを更新
    let newStatus = 'draft'
    if (qualityResult.overallScore >= 80) {
      newStatus = 'approved'
    } else if (qualityResult.overallScore >= 60) {
      newStatus = 'needs_review'
    } else {
      newStatus = 'needs_revision'
    }

    await supabase
      .from('articles')
      .update({
        status: newStatus,
        seo_score: qualityResult.checks.seo.score
      })
      .eq('id', articleId)

    return new Response(
      JSON.stringify({
        success: true,
        quality: qualityResult,
        newStatus
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('品質チェックエラー:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

/**
 * 品質チェックを実行
 */
function performQualityCheck(content: string, title: string): QualityCheckResult {
  const issues: Issue[] = []
  const suggestions: string[] = []

  // 1. コンテンツ品質チェック
  const contentQuality = checkContentQuality(content, issues, suggestions)

  // 2. 構造チェック
  const structure = checkStructure(content, issues, suggestions)

  // 3. 文法チェック
  const grammar = checkGrammar(content, issues, suggestions)

  // 4. SEOチェック
  const seo = checkSEO(content, title, issues, suggestions)

  // 5. 可読性チェック
  const readability = checkReadability(content, issues, suggestions)

  // 総合スコア計算
  const overallScore = Math.round(
    (contentQuality.score * 0.3 +
     structure.score * 0.2 +
     grammar.score * 0.2 +
     seo.score * 0.2 +
     readability.score * 0.1)
  )

  return {
    overallScore,
    checks: {
      contentQuality,
      structure,
      grammar,
      seo,
      readability
    },
    issues,
    suggestions
  }
}

/**
 * コンテンツ品質チェック
 */
function checkContentQuality(content: string, issues: Issue[], suggestions: string[]): CheckResult {
  let score = 100
  const wordCount = content.length

  // 文字数チェック
  if (wordCount < 500) {
    score -= 40
    issues.push({
      severity: 'critical',
      category: 'content',
      message: '記事が短すぎます（500文字未満）'
    })
    suggestions.push('最低500文字以上の記事を作成してください。')
  } else if (wordCount < 1000) {
    score -= 20
    issues.push({
      severity: 'warning',
      category: 'content',
      message: '記事が少し短いです（1000文字未満）'
    })
    suggestions.push('1000文字以上を目標にしましょう。')
  }

  // 重複コンテンツチェック（簡易版）
  const sentences = content.split(/[。！？]/).filter(s => s.trim().length > 10)
  const uniqueSentences = new Set(sentences)
  const duplicateRatio = 1 - (uniqueSentences.size / sentences.length)

  if (duplicateRatio > 0.2) {
    score -= 20
    issues.push({
      severity: 'warning',
      category: 'content',
      message: '重複した内容が多く含まれています'
    })
    suggestions.push('重複を避け、より多様な表現を使用しましょう。')
  }

  // 情報の深さチェック（専門用語の使用度合い）
  const technicalTerms = content.match(/[ぁ-ん]{4,}|[ァ-ヴ]{4,}/g) || []
  if (technicalTerms.length < 5 && wordCount > 1000) {
    score -= 10
    suggestions.push('専門的な用語や詳細な説明を追加して、記事の深みを増しましょう。')
  }

  const status = getStatus(score)
  const details = `文字数: ${wordCount}文字、重複率: ${(duplicateRatio * 100).toFixed(1)}%`

  return { score, status, details }
}

/**
 * 構造チェック
 */
function checkStructure(content: string, issues: Issue[], suggestions: string[]): CheckResult {
  let score = 100

  // 見出しチェック
  const h2Count = (content.match(/^##\s+/gm) || []).length
  const h3Count = (content.match(/^###\s+/gm) || []).length

  if (h2Count < 2) {
    score -= 30
    issues.push({
      severity: 'critical',
      category: 'structure',
      message: 'H2見出しが不足しています'
    })
    suggestions.push('最低2つ以上のH2見出しを設定しましょう。')
  }

  if (h2Count > 10) {
    score -= 15
    issues.push({
      severity: 'warning',
      category: 'structure',
      message: 'H2見出しが多すぎます'
    })
    suggestions.push('いくつかの見出しをH3に変更することを検討しましょう。')
  }

  // リストの使用チェック
  const hasList = /^[-*]\s+/m.test(content) || /^\d+\.\s+/m.test(content)
  if (!hasList) {
    score -= 10
    suggestions.push('箇条書きや番号付きリストを使用して、情報を整理しましょう。')
  }

  // 段落の適切さチェック
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0)
  if (paragraphs.length < 3) {
    score -= 15
    issues.push({
      severity: 'warning',
      category: 'structure',
      message: '段落分けが不足しています'
    })
    suggestions.push('適切に段落を分けて、読みやすさを向上させましょう。')
  }

  const status = getStatus(score)
  const details = `H2: ${h2Count}個、H3: ${h3Count}個、段落: ${paragraphs.length}個`

  return { score, status, details }
}

/**
 * 文法チェック（簡易版）
 */
function checkGrammar(content: string, issues: Issue[], suggestions: string[]): CheckResult {
  let score = 100

  // 句読点の適切さチェック
  const commaCount = (content.match(/、/g) || []).length
  const periodCount = (content.match(/。/g) || []).length
  const sentences = content.split(/[。！？]/).filter(s => s.trim().length > 0)

  if (periodCount === 0) {
    score -= 30
    issues.push({
      severity: 'critical',
      category: 'grammar',
      message: '句読点が適切に使用されていません'
    })
    suggestions.push('文章を適切な長さで区切り、句読点を使用しましょう。')
  }

  // 文の長さチェック
  const avgSentenceLength = content.length / sentences.length
  if (avgSentenceLength > 100) {
    score -= 15
    issues.push({
      severity: 'warning',
      category: 'grammar',
      message: '文が長すぎます'
    })
    suggestions.push('長い文を短く分割して、読みやすくしましょう。')
  }

  // 同じ文末の連続チェック
  const endPatterns = sentences.slice(-5).map(s => {
    if (s.endsWith('です')) return 'です'
    if (s.endsWith('ます')) return 'ます'
    if (s.endsWith('でしょう')) return 'でしょう'
    return 'other'
  })

  const consecutiveSame = endPatterns.filter((p, i) => i > 0 && p === endPatterns[i - 1] && p !== 'other').length
  if (consecutiveSame > 2) {
    score -= 10
    suggestions.push('同じ文末表現が連続しています。文末に変化をつけましょう。')
  }

  const status = getStatus(score)
  const details = `平均文長: ${avgSentenceLength.toFixed(0)}文字、文数: ${sentences.length}`

  return { score, status, details }
}

/**
 * SEOチェック
 */
function checkSEO(content: string, title: string, issues: Issue[], suggestions: string[]): CheckResult {
  let score = 100

  // タイトルの長さチェック
  const titleLength = title.length
  if (titleLength < 20 || titleLength > 60) {
    score -= 15
    issues.push({
      severity: 'warning',
      category: 'seo',
      message: 'タイトルの長さが最適ではありません（推奨: 20-60文字）'
    })
    suggestions.push('タイトルは20-60文字の範囲に収めましょう。')
  }

  // メタディスクリプション的な導入部チェック
  const firstParagraph = content.split(/\n\n/)[0]
  if (firstParagraph.length < 50) {
    score -= 10
    suggestions.push('導入部分をもう少し充実させましょう（メタディスクリプションとして使用されます）。')
  }

  // 内部リンクチェック
  const internalLinks = (content.match(/\[([^\]]+)\]\((?!http)/g) || []).length
  if (internalLinks === 0) {
    score -= 15
    issues.push({
      severity: 'warning',
      category: 'seo',
      message: '内部リンクがありません'
    })
    suggestions.push('関連記事への内部リンクを追加しましょう。')
  }

  // 画像の代替テキストチェック（Markdown画像）
  const images = content.match(/!\[([^\]]*)\]\(/g) || []
  const imagesWithoutAlt = images.filter(img => img === '![](' || img === '![ ](')
  if (imagesWithoutAlt.length > 0) {
    score -= 10
    issues.push({
      severity: 'warning',
      category: 'seo',
      message: '代替テキストのない画像があります'
    })
    suggestions.push('すべての画像に適切な代替テキスト（alt属性）を設定しましょう。')
  }

  const status = getStatus(score)
  const details = `タイトル長: ${titleLength}文字、内部リンク: ${internalLinks}個`

  return { score, status, details }
}

/**
 * 可読性チェック
 */
function checkReadability(content: string, issues: Issue[], suggestions: string[]): CheckResult {
  let score = 100

  const sentences = content.split(/[。！？]/).filter(s => s.trim().length > 0)
  const words = content.split(/[\s、。！？\n]/).filter(w => w.trim().length > 0)
  const avgSentenceLength = words.length / sentences.length

  // 文の長さの適切さ
  if (avgSentenceLength > 30) {
    score -= 20
    issues.push({
      severity: 'warning',
      category: 'readability',
      message: '文が長すぎます'
    })
    suggestions.push('文を短く分割して、読みやすくしましょう。')
  } else if (avgSentenceLength < 8) {
    score -= 10
    suggestions.push('文が短すぎる場合があります。適度に結合しましょう。')
  }

  // 難しい漢字の使用度チェック（簡易版）
  const kanjiCount = (content.match(/[\u4e00-\u9faf]/g) || []).length
  const kanjiRatio = kanjiCount / content.length

  if (kanjiRatio > 0.4) {
    score -= 15
    issues.push({
      severity: 'warning',
      category: 'readability',
      message: '漢字の使用率が高すぎます'
    })
    suggestions.push('ひらがなを適度に使用して、読みやすさを向上させましょう。')
  }

  // 箇条書きや装飾の使用
  const hasFormatting = /[**_]/.test(content) || /^[-*]\s+/m.test(content)
  if (!hasFormatting) {
    score -= 10
    suggestions.push('太字や箇条書きを使用して、重要な部分を強調しましょう。')
  }

  const status = getStatus(score)
  const details = `平均文長: ${avgSentenceLength.toFixed(1)}語、漢字率: ${(kanjiRatio * 100).toFixed(1)}%`

  return { score, status, details }
}

/**
 * スコアからステータスを取得
 */
function getStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 90) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 60) return 'fair'
  return 'poor'
}
