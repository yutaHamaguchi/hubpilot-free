// ===========================================
// HubPilot Free - SEO Analysis Function
// ===========================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SEOAnalysisRequest {
  articleId: string
  content: string
  targetKeywords?: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { articleId, content, targetKeywords = [] }: SEOAnalysisRequest = await req.json()

    // Supabaseクライアント初期化
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // SEO分析実行
    const analysis = performSEOAnalysis(content, targetKeywords)

    // 分析結果をデータベースに保存
    const { data, error } = await supabase
      .from('seo_analysis')
      .insert({
        article_id: articleId,
        keyword_density: analysis.keywordDensity,
        readability_score: analysis.readabilityScore,
        heading_structure: analysis.headingStructure,
        internal_links: analysis.internalLinks,
        suggestions: analysis.suggestions,
        overall_score: analysis.overallScore
      })
      .select()
      .single()

    if (error) throw error

    // 記事のSEOスコアを更新
    await supabase
      .from('articles')
      .update({ seo_score: analysis.overallScore })
      .eq('id', articleId)

    return new Response(
      JSON.stringify({ success: true, analysis: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('SEO分析エラー:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

/**
 * SEO分析を実行
 */
function performSEOAnalysis(content: string, targetKeywords: string[]) {
  const wordCount = content.length
  const sentences = content.split(/[。！？\n]/).filter(s => s.trim().length > 0)
  const words = content.split(/[\s、。！？\n]/).filter(w => w.trim().length > 0)

  // 1. キーワード密度分析
  const keywordDensity: Record<string, number> = {}
  targetKeywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi')
    const matches = content.match(regex) || []
    const density = (matches.length / words.length) * 100
    keywordDensity[keyword] = parseFloat(density.toFixed(2))
  })

  // 2. 可読性スコア計算（簡易版）
  const avgSentenceLength = words.length / sentences.length
  const readabilityScore = calculateReadabilityScore(avgSentenceLength, wordCount)

  // 3. 見出し構造分析
  const headingStructure = analyzeHeadingStructure(content)

  // 4. 内部リンク分析
  const internalLinks = analyzeInternalLinks(content)

  // 5. 改善提案生成
  const suggestions = generateSuggestions({
    wordCount,
    keywordDensity,
    readabilityScore,
    headingStructure,
    internalLinks
  })

  // 6. 総合スコア計算
  const overallScore = calculateOverallScore({
    wordCount,
    keywordDensity,
    readabilityScore,
    headingStructure,
    internalLinks
  })

  return {
    keywordDensity,
    readabilityScore,
    headingStructure,
    internalLinks,
    suggestions,
    overallScore
  }
}

/**
 * 可読性スコア計算
 */
function calculateReadabilityScore(avgSentenceLength: number, wordCount: number): number {
  let score = 100

  // 文が長すぎる場合は減点
  if (avgSentenceLength > 30) {
    score -= 20
  } else if (avgSentenceLength > 25) {
    score -= 10
  }

  // 文が短すぎる場合も減点
  if (avgSentenceLength < 10) {
    score -= 10
  }

  // 記事が短すぎる場合は減点
  if (wordCount < 500) {
    score -= 30
  } else if (wordCount < 1000) {
    score -= 15
  }

  return Math.max(0, Math.min(100, score))
}

/**
 * 見出し構造分析
 */
function analyzeHeadingStructure(content: string) {
  const h2Matches = content.match(/^##\s+.+$/gm) || []
  const h3Matches = content.match(/^###\s+.+$/gm) || []
  const h4Matches = content.match(/^####\s+.+$/gm) || []

  return {
    h2Count: h2Matches.length,
    h3Count: h3Matches.length,
    h4Count: h4Matches.length,
    hasProperStructure: h2Matches.length >= 2,
    headings: [
      ...h2Matches.map(h => h.replace(/^##\s+/, '')),
      ...h3Matches.map(h => h.replace(/^###\s+/, '')),
      ...h4Matches.map(h => h.replace(/^####\s+/, ''))
    ]
  }
}

/**
 * 内部リンク分析
 */
function analyzeInternalLinks(content: string) {
  const linkMatches = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []
  const internalLinks = linkMatches.filter(link => {
    const url = link.match(/\(([^)]+)\)/)?.[1] || ''
    return !url.startsWith('http://') && !url.startsWith('https://')
  })

  return {
    totalLinks: linkMatches.length,
    internalLinkCount: internalLinks.length,
    externalLinkCount: linkMatches.length - internalLinks.length,
    links: linkMatches
  }
}

/**
 * 改善提案生成
 */
function generateSuggestions(analysis: any): string[] {
  const suggestions: string[] = []

  // 文字数チェック
  if (analysis.wordCount < 1000) {
    suggestions.push('記事の文字数が少ないです。最低1000文字以上を目標にしましょう。')
  } else if (analysis.wordCount < 1500) {
    suggestions.push('より詳細な内容を追加して、1500文字以上を目指しましょう。')
  }

  // キーワード密度チェック
  Object.entries(analysis.keywordDensity).forEach(([keyword, density]) => {
    if ((density as number) < 1.0) {
      suggestions.push(`キーワード「${keyword}」の出現頻度が低いです。もう少し自然に含めましょう。`)
    } else if ((density as number) > 3.5) {
      suggestions.push(`キーワード「${keyword}」が多すぎます。より自然な文章にしましょう。`)
    }
  })

  // 見出し構造チェック
  if (analysis.headingStructure.h2Count < 2) {
    suggestions.push('H2見出しを最低2つ以上設定しましょう。記事の構造が明確になります。')
  }

  if (analysis.headingStructure.h2Count > 10) {
    suggestions.push('H2見出しが多すぎます。いくつかをH3に変更することを検討しましょう。')
  }

  // 可読性チェック
  if (analysis.readabilityScore < 70) {
    suggestions.push('文章の可読性を改善しましょう。短い文と長い文をバランスよく配置してください。')
  }

  // 内部リンクチェック
  if (analysis.internalLinks.internalLinkCount === 0) {
    suggestions.push('関連記事への内部リンクを追加して、サイト内の回遊性を高めましょう。')
  }

  return suggestions
}

/**
 * 総合スコア計算
 */
function calculateOverallScore(analysis: any): number {
  let score = 0

  // 文字数スコア（最大25点）
  if (analysis.wordCount >= 2000) {
    score += 25
  } else if (analysis.wordCount >= 1500) {
    score += 20
  } else if (analysis.wordCount >= 1000) {
    score += 15
  } else {
    score += 5
  }

  // キーワード密度スコア（最大25点）
  const densities = Object.values(analysis.keywordDensity) as number[]
  const avgDensity = densities.reduce((sum, d) => sum + d, 0) / densities.length
  if (avgDensity >= 1.5 && avgDensity <= 3.0) {
    score += 25
  } else if (avgDensity >= 1.0 && avgDensity <= 3.5) {
    score += 20
  } else if (avgDensity >= 0.5 && avgDensity <= 4.0) {
    score += 15
  } else {
    score += 5
  }

  // 可読性スコア（最大25点）
  score += Math.round(analysis.readabilityScore * 0.25)

  // 見出し構造スコア（最大15点）
  if (analysis.headingStructure.h2Count >= 3 && analysis.headingStructure.h2Count <= 8) {
    score += 15
  } else if (analysis.headingStructure.h2Count >= 2) {
    score += 10
  } else {
    score += 5
  }

  // 内部リンクスコア（最大10点）
  if (analysis.internalLinks.internalLinkCount >= 3) {
    score += 10
  } else if (analysis.internalLinks.internalLinkCount >= 1) {
    score += 5
  }

  return Math.min(100, score)
}
