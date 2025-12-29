#!/usr/bin/env node

/**
 * HubPilot Free - デプロイスクリプト
 * 静的ファイルをSupabase Stoップロードしてウェブサービスとして公開
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 設定
const SUPABASE_URL = 'https://wwstpjknjqcrpzblgslo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3c3RwamtuanFjcnB6Ymxnc2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NTIzMjIsImV4cCI6MjA4MjMyODMyMn0.JijH4a_vWMbATjDAtXyCxSpIZjiEFcHggm3BlJyi-0o';

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
  { local: 'wordpress-integration.js', remote: 'wordpress-integration.js', contentType: 'application/javascript' },
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

    const { data, error } = await supabase.storage
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
  } else {
    process.exit(1);
  }
}

// 実行
deployApp().catch(console.error);
