import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { pageTitle } = await req.json()

    if (!pageTitle) {
      return new Response(
        JSON.stringify({ error: 'pageTitle is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate headings based on the page title
    const headings = generateHeadingsForTitle(pageTitle)

    return new Response(
      JSON.stringify({ headings }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error generating headings:', error)

    return new Response(
      JSON.stringify({ error: 'Failed to generate headings' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function generateHeadingsForTitle(pageTitle: string) {
  // Basic heading generation logic
  const baseHeadings = [
    '概要と重要性',
    '基本的な考え方',
    '実践的な手法',
    '成功のポイント',
    'よくある課題と解決策',
    'まとめ'
  ]

  return baseHeadings.map((heading, index) => ({
    id: `h${index + 1}`,
    text: heading,
    level: 2
  }))
}
