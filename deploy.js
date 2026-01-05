#!/usr/bin/env node

/**
 * HubPilot Free - デプロイスクリプト
 * 静的ファイルをSupabase Stoップロードしてウェブサービスとして公開
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// 設定（環境変数から取得）
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// 環境変数のチェック
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ エラー: SUPABASE_URLとSUPABASE_ANON_KEYの環境変数を設定してください');
  console.log('\n使用方法:');
  console.log('  SUPABASE_URL=your-url SUPABASE_ANON_KEY=your-key node deploy.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// アップロードするファイル一覧
const FILES_TO_UPLOAD = [
  { local: 'index.html', remote: 'index.html', contentType: 'text/html' },
  { local: 'styles.css', remote: 'styles.css', contentType: 'text/css' },
  { local: 'auth-styles.css', remote: 'auth-styles.css', contentType: 'text/css' },
  { local: 'image-generation-styles.css', remote: 'image-generation-styles.css', contentType: 'text/css' },
  { local: 'wordpress-styles.css', remote: 'wordpress-styles.css', contentType: 'text/css' },
  { local: 'auth-manager.js', remote: 'auth-manager.js', contentType: 'application/javascript' },
  { local: 'image-generation.js', remote: 'image-generation.js', contentType: 'application/javascript' },
  { local: 'supabase-config.js', remote: 'supabase-config.js', contentType: 'application/javascript' },
  { local: 'supabase-integration.js', remote: 'supabase-integration.js', contentType: 'application/javascript' },
  { local: 'wordpress-integration.js', remote: 'wordpress-integration.js', contentType: 'application/javascript' }
];

// srcディレクトリのファイル
const SRC_FILES = [
  'src/utils/Constants.js',
  'src/utils/ErrorHandler.js',
  'src/services/StorageService.js',
  'src/services/NotificationService.js',
  'src/core/DataStore.js',
  'src/core/GenerationState.js',
  'src/ui/TemplateEngine.js',
  'src/ui/UIRenderer.js',
  'src/core/WizardController.js',
  'src/core/ContentGenerator.js',
  'src/core/HubPilotApp.js'
];

async function uploadFile(localPath, remotePath, contentType) {
  try {

    const fileBuffer = fs.readFileSync(localPath);

    const { error } = await supabase.storage
      .from('hubpilot-static')
      .upload(remotePath, fileBuffer, {
        contentType: contentType,
        upsert: true
      });

    if (error) {
      console.error(`❌ アップロード失敗: ${localPath}`, error);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`❌ ファイル読み込みエラー: ${localPath}`, err);
    return false;
  }
}

async function deployApp() {

  let successCount = 0;
  let totalFiles = FILES_TO_UPLOAD.length + SRC_FILES.length;

  // メインファイルをアップロード
  for (const file of FILES_TO_UPLOAD) {
    const success = await uploadFile(file.local, file.remote, file.contentType);
    if (success) successCount++;
  }

  // srcディレクトリのファイルをアップロード
  for (const srcFile of SRC_FILES) {
    const success = await uploadFile(srcFile, srcFile, 'application/javascript');
    if (success) successCount++;
  }


  if (successCount === totalFiles) {
    console.log('✅ All files deployed successfully');
  } else {
    process.exit(1);
  }
}

// 実行
deployApp().catch(console.error);
