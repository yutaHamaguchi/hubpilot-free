#!/usr/bin/env node

/**
 * HubPilot Free - テストスイート
 *
 * このスクリプトは以下のテストを実行します:
 * 1. JavaScript構文チェック
 * 2. WordPress統合機能のテスト
 * 3. 認証機能のテスト
 * 4. HTMLファイルの構造チェック
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// カラー出力用
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// テスト結果を保持
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failedMessages = [];

console.log(`${colors.cyan}========================================`);
console.log(`🧪 HubPilot Free - テストスイート`);
console.log(`========================================${colors.reset}\n`);

/**
 * テスト結果を記録
 */
function assert(condition, testName, errorMessage = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`${colors.green}✅ ${testName}${colors.reset}`);
    return true;
  } else {
    failedTests++;
    const message = `${testName}${errorMessage ? ': ' + errorMessage : ''}`;
    failedMessages.push(message);
    console.log(`${colors.red}❌ ${testName}${colors.reset}`);
    if (errorMessage) {
      console.log(`   ${colors.yellow}→ ${errorMessage}${colors.reset}`);
    }
    return false;
  }
}

/**
 * ファイルの存在確認
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * JavaScript構文チェック
 */
function testJavaScriptSyntax() {
  console.log(`${colors.blue}📝 JavaScript構文チェック${colors.reset}\n`);

  const jsFiles = [
    'app.js',
    'wordpress-integration.js',
    'auth-manager.js',
    'supabase-integration.js',
    'supabase-config.js',
    'image-generation.js'
  ];

  jsFiles.forEach(file => {
    if (!fileExists(file)) {
      assert(false, `${file} の存在確認`, 'ファイルが見つかりません');
      return;
    }

    try {
      execSync(`node -c ${file}`, { stdio: 'pipe' });
      assert(true, `${file} の構文チェック`);
    } catch (error) {
      assert(false, `${file} の構文チェック`, '構文エラーがあります');
    }
  });

  console.log('');
}

/**
 * WordPress統合モジュールのテスト
 */
function testWordPressIntegration() {
  console.log(`${colors.blue}📤 WordPress統合機能テスト${colors.reset}\n`);

  // ファイル存在確認
  assert(
    fileExists('wordpress-integration.js'),
    'wordpress-integration.js の存在確認'
  );

  // ファイル内容のチェック
  const wpContent = fs.readFileSync('wordpress-integration.js', 'utf8');

  assert(
    wpContent.includes('class WordPressIntegration'),
    'WordPressIntegrationクラスの定義確認'
  );

  assert(
    wpContent.includes("defaultStatus: 'draft'"),
    'デフォルトステータスが draft に設定されているか確認'
  );

  assert(
    wpContent.includes('async publishPost'),
    'publishPostメソッドの存在確認'
  );

  assert(
    wpContent.includes('async publishBatch'),
    'publishBatchメソッドの存在確認'
  );

  assert(
    wpContent.includes('async testConnection'),
    'testConnectionメソッドの存在確認'
  );

  assert(
    wpContent.includes('async getCategories'),
    'getCategoriesメソッドの存在確認'
  );

  console.log('');
}

/**
 * 認証機能のテスト
 */
function testAuthManager() {
  console.log(`${colors.blue}🔐 認証機能テスト${colors.reset}\n`);

  // ファイル存在確認
  assert(
    fileExists('auth-manager.js'),
    'auth-manager.js の存在確認'
  );

  // ファイル内容のチェック
  const authContent = fs.readFileSync('auth-manager.js', 'utf8');

  assert(
    authContent.includes('class AuthManager'),
    'AuthManagerクラスの定義確認'
  );

  assert(
    authContent.includes('async signIn'),
    'signInメソッドの存在確認'
  );

  assert(
    authContent.includes('async signUp'),
    'signUpメソッドの存在確認'
  );

  assert(
    authContent.includes('async signOut'),
    'signOutメソッドの存在確認'
  );

  assert(
    authContent.includes('continueAsGuest'),
    'continueAsGuestメソッドの存在確認'
  );

  console.log('');
}

/**
 * HTMLファイルの構造テスト
 */
function testHTMLStructure() {
  console.log(`${colors.blue}📄 HTML構造テスト${colors.reset}\n`);

  // ファイル存在確認
  assert(
    fileExists('index.html'),
    'index.html の存在確認'
  );

  const htmlContent = fs.readFileSync('index.html', 'utf8');

  // WordPress関連のUI要素確認
  assert(
    htmlContent.includes('WordPressへ下書き保存'),
    'WordPress下書き保存ボタンの確認'
  );

  assert(
    htmlContent.includes('id="wordpress-modal"'),
    'WordPressモーダルの存在確認'
  );

  assert(
    htmlContent.includes('id="wp-post-status"'),
    '投稿ステータス選択要素の存在確認'
  );

  assert(
    htmlContent.includes('<option value="draft" selected>下書き</option>'),
    'デフォルトで下書きが選択されているか確認'
  );

  assert(
    htmlContent.includes('保存中...'),
    '下書き保存中の進捗テキスト確認'
  );

  // 認証関連のUI要素確認
  assert(
    htmlContent.includes('id="auth-overlay"'),
    '認証オーバーレイの存在確認'
  );

  assert(
    htmlContent.includes('id="signin-form"'),
    'ログインフォームの存在確認'
  );

  assert(
    htmlContent.includes('id="signup-form"'),
    '新規登録フォームの存在確認'
  );

  // スクリプトの読み込み確認
  assert(
    htmlContent.includes('wordpress-integration.js'),
    'WordPress統合スクリプトの読み込み確認'
  );

  assert(
    htmlContent.includes('auth-manager.js'),
    '認証マネージャースクリプトの読み込み確認'
  );

  console.log('');
}

/**
 * CSSファイルの存在確認
 */
function testCSSFiles() {
  console.log(`${colors.blue}🎨 CSSファイルテスト${colors.reset}\n`);

  const cssFiles = [
    'styles.css',
    'auth-styles.css',
    'wordpress-styles.css',
    'image-generation-styles.css'
  ];

  cssFiles.forEach(file => {
    assert(
      fileExists(file),
      `${file} の存在確認`
    );
  });

  console.log('');
}

/**
 * ドキュメントファイルの確認
 */
function testDocumentation() {
  console.log(`${colors.blue}📚 ドキュメントファイルテスト${colors.reset}\n`);

  const docFiles = [
    'README.md',
    'SETUP_REQUIRED.md',
    'AUTH_SETUP_GUIDE.md',
    'WORDPRESS_SETUP_GUIDE.md'
  ];

  docFiles.forEach(file => {
    assert(
      fileExists(file),
      `${file} の存在確認`
    );
  });

  console.log('');
}

/**
 * Supabase設定ファイルの確認
 */
function testSupabaseConfig() {
  console.log(`${colors.blue}⚡ Supabase設定テスト${colors.reset}\n`);

  // マイグレーションファイルの確認
  const migrations = [
    'supabase/migrations/001_initial_schema.sql',
    'supabase/migrations/002_add_image_generation.sql',
    'supabase/migrations/003_add_authentication.sql'
  ];

  migrations.forEach(file => {
    assert(
      fileExists(file),
      `${path.basename(file)} の存在確認`
    );
  });

  console.log('');
}

/**
 * テスト結果のサマリー表示
 */
function printSummary() {
  console.log(`${colors.cyan}========================================`);
  console.log(`📊 テスト結果サマリー`);
  console.log(`========================================${colors.reset}\n`);

  console.log(`総テスト数: ${totalTests}`);
  console.log(`${colors.green}✅ 成功: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}❌ 失敗: ${failedTests}${colors.reset}`);

  if (failedTests > 0) {
    console.log(`\n${colors.red}失敗したテスト:${colors.reset}`);
    failedMessages.forEach(msg => {
      console.log(`  - ${msg}`);
    });
  }

  const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
  console.log(`\n成功率: ${successRate}%`);

  if (failedTests === 0) {
    console.log(`\n${colors.green}🎉 すべてのテストが成功しました！${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}⚠️ 一部のテストが失敗しました${colors.reset}\n`);
    process.exit(1);
  }
}

/**
 * メイン実行
 */
function main() {
  try {
    // カレントディレクトリをプロジェクトルートに変更
    const projectRoot = path.join(__dirname, '..');
    process.chdir(projectRoot);

    // 各テストを実行
    testJavaScriptSyntax();
    testWordPressIntegration();
    testAuthManager();
    testHTMLStructure();
    testCSSFiles();
    testDocumentation();
    testSupabaseConfig();

    // 結果サマリー表示
    printSummary();

  } catch (error) {
    console.error(`${colors.red}❌ テスト実行中にエラーが発生しました:${colors.reset}`);
    console.error(error.message);
    process.exit(1);
  }
}

// 実行
main();
