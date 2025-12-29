// ===========================================
// HubPilot Free - Supabase設定ファイル
// ===========================================

// Supabase設定（フロントエンド用）
window.SUPABASE_CONFIG = {
  // Supabaseプロジェクト設定
  url: 'https://wwstpjknjqcrpzblgslo.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3c3RwamtuanFjcnB6Ymxnc2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NTIzMjIsImV4cCI6MjA4MjMyODMyMn0.JijH4a_vWMbATjDAtXyCxSpIZjiEFcHggm3BlJyi-0o',

  // Edge Functions設定
  functions: {
    generateArticle: 'generate-article',
    analyzeSeo: 'analyze-seo',
    checkQuality: 'check-quality',
    generateImages: 'generate-images'
  },

  // Storage設定
  storage: {
    publicBucket: 'public',
    privateBucket: 'private'
  },

  // Realtime設定
  realtime: {
    enabled: true,
    channels: {
      generationProgress: 'generation_progress',
      articleUpdates: 'article_updates'
    }
  },

  // AI設定
  ai: {
    defaultProvider: 'deepseek',
    fallbackProvider: 'openai',
    maxRetries: 3,
    timeout: 120000, // 2分

    // DeepSeek設定
    deepseek: {
      model: 'deepseek-chat',
      maxTokens: 4000,
      temperature: 0.7
    },

    // OpenAI設定（バックアップ）
    openai: {
      model: 'gpt-4',
      maxTokens: 4000,
      temperature: 0.7
    }
  },

  // SEO設定
  seo: {
    defaultTargetLength: 2000,
    minTargetLength: 500,
    maxTargetLength: 5000,
    keywordDensityTarget: 2.5, // %
    readabilityScoreTarget: 70
  },

  // 品質チェック設定
  quality: {
    minWordCount: 300,
    maxWordCount: 6000,
    requiredSections: ['introduction', 'body', 'conclusion'],
    seoScoreThreshold: 70
  },

  // バッチ処理設定
  batch: {
    maxArticlesPerBatch: 50,
    batchTimeout: 1800000, // 30分
    progressUpdateInterval: 5000 // 5秒
  },

  // コスト管理
  cost: {
    maxMonthlyBudget: 100, // USD
    alertThreshold: 80, // USD
    trackingEnabled: true
  }
};

// 環境別設定
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // 開発環境設定
  window.SUPABASE_CONFIG.url = 'http://localhost:54321';
  window.SUPABASE_CONFIG.ai.timeout = 60000; // 1分（開発用）
  window.SUPABASE_CONFIG.cost.trackingEnabled = false;
} else if (window.location.hostname.includes('github.io')) {
  // GitHub Pages環境
  console.log('🌐 GitHub Pages環境を検出しました');
  // 本番のSupabase URLを使用（既に設定済み）
  window.SUPABASE_CONFIG.ai.timeout = 120000; // 2分（本番用）
  window.SUPABASE_CONFIG.cost.trackingEnabled = true;
} else if (window.location.hostname.includes('supabase.co')) {
  // Supabase Storage ホスティング環境
  window.SUPABASE_CONFIG.url = 'https://wwstpjknjqcrpzblgslo.supabase.co';
} else {
  // 本番環境（カスタムドメイン）
  console.log('🌐 本番環境を検出しました');
  window.SUPABASE_CONFIG.ai.timeout = 120000; // 2分（本番用）
  window.SUPABASE_CONFIG.cost.trackingEnabled = true;
}

// 設定検証
function validateSupabaseConfig() {
  const config = window.SUPABASE_CONFIG;

  console.log('🔍 Supabase設定を検証中...');
  console.log('📍 現在のホスト名:', window.location.hostname);
  console.log('📍 現在のURL:', window.location.href);
  console.log('📍 Supabase URL:', config.url);

  if (!config.url || config.url.includes('your-project-ref')) {
    console.warn('⚠️ Supabase URL が設定されていません');
    return false;
  }

  if (!config.anonKey || config.anonKey.includes('your-anon-key')) {
    console.warn('⚠️ Supabase Anon Key が設定されていません');
    return false;
  }

  console.log('✅ Supabase設定が正常です');
  console.log('📍 Project URL:', config.url);
  return true;
}

// 初期化時に設定を検証
document.addEventListener('DOMContentLoaded', () => {
  validateSupabaseConfig();
});

// デバッグ用：設定情報を表示
window.showSupabaseConfig = () => {
  console.log('Supabase設定:', window.SUPABASE_CONFIG);
};

// ===========================================
// 設定手順ガイド
// ===========================================
console.log(`
🚀 HubPilot Free - Supabase設定ガイド

1. Supabaseプロジェクト作成:
   https://supabase.com/dashboard

2. Project Settings > API から以下をコピー:
   - Project URL → SUPABASE_CONFIG.url
   - anon public → SUPABASE_CONFIG.anonKey

3. このファイルの設定を更新:
   - url: 'https://your-project-ref.supabase.co'
   - anonKey: 'your-anon-key-here'

4. 設定確認:
   window.showSupabaseConfig()

5. 接続テスト:
   window.supabaseIntegration.testConnection()
`);
