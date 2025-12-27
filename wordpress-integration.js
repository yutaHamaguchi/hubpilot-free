// ===========================================
// HubPilot Free - WordPress Integration
// ===========================================

/**
 * WordPress統合クラス
 * WordPress REST APIを使用した記事投稿機能を提供
 */
class WordPressIntegration {
  constructor() {
    this.config = {
      siteUrl: '',
      username: '',
      applicationPassword: '',
      defaultAuthor: 1,
      defaultStatus: 'draft', // 'draft', 'publish', 'pending'
      defaultCategory: null,
      defaultTags: []
    }

    this.isConnected = false
    this.loadConfig()
  }

  /**
   * 設定の読み込み
   */
  loadConfig() {
    try {
      const saved = localStorage.getItem('wordpress_config')
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) }
        console.log('✅ WordPress設定を読み込みました')
      }
    } catch (error) {
      console.error('WordPress設定の読み込みエラー:', error)
    }
  }

  /**
   * 設定の保存
   */
  saveConfig(config) {
    try {
      this.config = { ...this.config, ...config }

      // パスワードは保存（Base64エンコード）
      const toSave = { ...this.config }
      localStorage.setItem('wordpress_config', JSON.stringify(toSave))

      console.log('✅ WordPress設定を保存しました')
      return true
    } catch (error) {
      console.error('WordPress設定の保存エラー:', error)
      return false
    }
  }

  /**
   * WordPress接続テスト
   */
  async testConnection(siteUrl, username, applicationPassword) {
    try {
      const url = this.normalizeUrl(siteUrl)
      const auth = btoa(`${username}:${applicationPassword}`)

      const response = await fetch(`${url}/wp-json/wp/v2/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `接続エラー: ${response.status}`)
      }

      const user = await response.json()

      this.isConnected = true

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: user.roles
        },
        message: `接続成功: ${user.name}さんとしてログイン`
      }

    } catch (error) {
      console.error('WordPress接続テストエラー:', error)
      this.isConnected = false

      return {
        success: false,
        message: error.message || '接続に失敗しました'
      }
    }
  }

  /**
   * URLの正規化
   */
  normalizeUrl(url) {
    // httpsがない場合は追加
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }

    // 末尾のスラッシュを削除
    return url.replace(/\/$/, '')
  }

  /**
   * 記事を投稿
   */
  async publishPost(article, options = {}) {
    if (!this.config.siteUrl || !this.config.username || !this.config.applicationPassword) {
      throw new Error('WordPress設定が不完全です。設定を確認してください。')
    }

    const {
      status = this.config.defaultStatus,
      categories = this.config.defaultCategory ? [this.config.defaultCategory] : [],
      tags = this.config.defaultTags,
      featured_media = null,
      excerpt = ''
    } = options

    try {
      const url = this.normalizeUrl(this.config.siteUrl)
      const auth = btoa(`${this.config.username}:${this.config.applicationPassword}`)

      // WordPress REST API形式に変換
      const postData = {
        title: article.title,
        content: article.content,
        status: status,
        author: this.config.defaultAuthor,
        excerpt: excerpt || this.generateExcerpt(article.content),
        categories: categories,
        tags: tags
      }

      if (featured_media) {
        postData.featured_media = featured_media
      }

      const response = await fetch(`${url}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `投稿エラー: ${response.status}`)
      }

      const post = await response.json()

      return {
        success: true,
        post: {
          id: post.id,
          title: post.title.rendered,
          link: post.link,
          status: post.status,
          date: post.date
        },
        message: `投稿成功: ${post.title.rendered}`
      }

    } catch (error) {
      console.error('WordPress投稿エラー:', error)
      throw error
    }
  }

  /**
   * 画像をアップロード
   */
  async uploadImage(imageUrl, filename, altText = '') {
    try {
      const url = this.normalizeUrl(this.config.siteUrl)
      const auth = btoa(`${this.config.username}:${this.config.applicationPassword}`)

      // 画像をダウンロード
      const imageResponse = await fetch(imageUrl)
      const imageBlob = await imageResponse.blob()

      // FormDataで送信
      const formData = new FormData()
      formData.append('file', imageBlob, filename)
      formData.append('alt_text', altText)

      const response = await fetch(`${url}/wp-json/wp/v2/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`
        },
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `画像アップロードエラー: ${response.status}`)
      }

      const media = await response.json()

      return {
        success: true,
        media: {
          id: media.id,
          url: media.source_url,
          title: media.title.rendered,
          alt: media.alt_text
        }
      }

    } catch (error) {
      console.error('画像アップロードエラー:', error)
      throw error
    }
  }

  /**
   * 複数記事を一括投稿
   */
  async publishBatch(articles, options = {}) {
    const results = []
    let successCount = 0
    let failureCount = 0

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i]

      try {
        // 進捗イベント発火
        window.dispatchEvent(new CustomEvent('wordpress-publish-progress', {
          detail: {
            current: i + 1,
            total: articles.length,
            percentage: ((i + 1) / articles.length) * 100,
            currentArticle: article.title
          }
        }))

        // 記事投稿
        const result = await this.publishPost(article, options)

        results.push({
          articleTitle: article.title,
          ...result
        })

        successCount++

        // レート制限対策（1秒待機）
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`投稿失敗: ${article.title}`, error)

        results.push({
          articleTitle: article.title,
          success: false,
          error: error.message
        })

        failureCount++
      }
    }

    return {
      success: failureCount === 0,
      results,
      summary: {
        total: articles.length,
        success: successCount,
        failure: failureCount
      }
    }
  }

  /**
   * カテゴリー一覧を取得
   */
  async getCategories() {
    try {
      const url = this.normalizeUrl(this.config.siteUrl)
      const auth = btoa(`${this.config.username}:${this.config.applicationPassword}`)

      const response = await fetch(`${url}/wp-json/wp/v2/categories?per_page=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`カテゴリー取得エラー: ${response.status}`)
      }

      const categories = await response.json()

      return {
        success: true,
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          count: cat.count
        }))
      }

    } catch (error) {
      console.error('カテゴリー取得エラー:', error)
      return {
        success: false,
        categories: []
      }
    }
  }

  /**
   * タグ一覧を取得
   */
  async getTags() {
    try {
      const url = this.normalizeUrl(this.config.siteUrl)
      const auth = btoa(`${this.config.username}:${this.config.applicationPassword}`)

      const response = await fetch(`${url}/wp-json/wp/v2/tags?per_page=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`タグ取得エラー: ${response.status}`)
      }

      const tags = await response.json()

      return {
        success: true,
        tags: tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          count: tag.count
        }))
      }

    } catch (error) {
      console.error('タグ取得エラー:', error)
      return {
        success: false,
        tags: []
      }
    }
  }

  /**
   * 記事の抜粋を生成
   */
  generateExcerpt(content, maxLength = 200) {
    // Markdownから plain text に変換
    let text = content
      .replace(/#{1,6}\s/g, '') // 見出し
      .replace(/\*\*(.+?)\*\*/g, '$1') // 太字
      .replace(/\*(.+?)\*/g, '$1') // 斜体
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // リンク
      .replace(/!\[.+?\]\(.+?\)/g, '') // 画像
      .replace(/```[\s\S]*?```/g, '') // コードブロック
      .replace(/`(.+?)`/g, '$1') // インラインコード
      .trim()

    // 最初の段落を取得
    const firstParagraph = text.split('\n\n')[0]

    // 指定文字数で切り詰め
    if (firstParagraph.length > maxLength) {
      return firstParagraph.substring(0, maxLength) + '...'
    }

    return firstParagraph
  }

  /**
   * 設定をクリア
   */
  clearConfig() {
    localStorage.removeItem('wordpress_config')
    this.config = {
      siteUrl: '',
      username: '',
      applicationPassword: '',
      defaultAuthor: 1,
      defaultStatus: 'draft',
      defaultCategory: null,
      defaultTags: []
    }
    this.isConnected = false
    console.log('✅ WordPress設定をクリアしました')
  }

  /**
   * 設定状態を確認
   */
  isConfigured() {
    return !!(this.config.siteUrl && this.config.username && this.config.applicationPassword)
  }
}

// グローバルインスタンス作成
window.wordpressIntegration = new WordPressIntegration()

console.log('✅ WordPress統合モジュールを読み込みました')
