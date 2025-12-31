#!/usr/bin/env node

// ===========================================
// HubPilot Free - Configuration Validator
// ===========================================

const fs = require('fs');
const path = require('path');

console.log('🔍 HubPilot Free - 設定検証中...\n');

let hasErrors = false;
let hasWarnings = false;

// 設定検証結果
const results = {
  supabase: { status: 'pending', message: '' },
  env: { status: 'pending', message: '' },
  files: { status: 'pending', message: '' },
  functions: { status: 'pending', message: '' }
};

// 1. Supabase設定ファイルの検証
function validateSupabaseConfig() {
  console.log('📋 Supabase設定ファイルを検証中...');

  try {
    const configPath = path.join(__dirname, '../supabase-config.js');
    const configContent = fs.readFileSync(configPath, 'utf8');

    // プレースホルダーの確認
    if (configContent.includes('your-project-ref.supabase.co')) {
      results.supabase.status = 'error';
      results.supabase.message = 'Supabase URLがプレースホルダーのままです';
      hasErrors = true;
    } else if (configContent.includes('your-anon-key-here')) {
      results.supabase.status = 'error';
      results.supabase.message = 'Supabase Anon Keyがプレースホルダーのままです';
      hasErrors = true;
    } else {
      results.supabase.status = 'success';
      results.supabase.message = 'Supabase設定が正常です';
    }
  } catch (error) {
    results.supabase.status = 'error';
    results.supabase.message = `設定ファイルが見つかりません: ${error.message}`;
    hasErrors = true;
  }
}

// 2. 環境変数の検証
function validateEnvironment() {
  console.log('🌍 環境変数を検証中...');

  const envPath = path.join(__dirname, '../.env');

  if (!fs.existsSync(envPath)) {
    results.env.status = 'warning';
    results.env.message = '.envファイルが見つかりません（オプション）';
    hasWarnings = true;
    return;
  }

  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
    const missingVars = [];

    requiredVars.forEach(varName => {
      if (!envContent.includes(varName) || envContent.includes(`${varName}=your-`)) {
        missingVars.push(varName);
      }
    });

    if (missingVars.length > 0) {
      results.env.status = 'warning';
      results.env.message = `未設定の環境変数: ${missingVars.join(', ')}`;
      hasWarnings = true;
    } else {
      results.env.status = 'success';
      results.env.message = '環境変数が正常に設定されています';
    }
  } catch (error) {
    results.env.status = 'error';
    results.env.message = `環境変数の読み込みエラー: ${error.message}`;
    hasErrors = true;
  }
}

// 3. 必要ファイルの存在確認
function validateFiles() {
  console.log('📁 必要ファイルを確認中...');

  const requiredFiles = [
    'index.html',
    'simple-app.js',
    'styles.css',
    'supabase-config.js',
    'supabase-integration.js',
    'supabase/migrations/001_initial_schema.sql',
    'supabase/migrations/002_add_image_generation.sql'
  ];

  const missingFiles = [];

  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  });

  if (missingFiles.length > 0) {
    results.files.status = 'error';
    results.files.message = `不足ファイル: ${missingFiles.join(', ')}`;
    hasErrors = true;
  } else {
    results.files.status = 'success';
    results.files.message = 'すべての必要ファイルが存在します';
  }
}

// 4. Edge Functions の確認
function validateFunctions() {
  console.log('⚡ Edge Functions を確認中...');

  const functionsDir = path.join(__dirname, '../supabase/functions');
  const requiredFunctions = [
    'generate-article',
    'analyze-seo',
    'check-quality',
    'generate-images'
  ];

  const missingFunctions = [];

  requiredFunctions.forEach(func => {
    const funcPath = path.join(functionsDir, func, 'index.ts');
    if (!fs.existsSync(funcPath)) {
      missingFunctions.push(func);
    }
  });

  if (missingFunctions.length > 0) {
    results.functions.status = 'error';
    results.functions.message = `不足Function: ${missingFunctions.join(', ')}`;
    hasErrors = true;
  } else {
    results.functions.status = 'success';
    results.functions.message = 'すべてのEdge Functionsが存在します';
  }
}

// 結果表示
function displayResults() {
  console.log('\n📊 検証結果:\n');

  Object.entries(results).forEach(([category, result]) => {
    const icon = result.status === 'success' ? '✅' :
      result.status === 'warning' ? '⚠️' : '❌';
    const categoryName = {
      supabase: 'Supabase設定',
      env: '環境変数',
      files: 'ファイル構成',
      functions: 'Edge Functions'
    }[category];

    console.log(`${icon} ${categoryName}: ${result.message}`);
  });

  console.log('\n' + '='.repeat(50));

  if (hasErrors) {
    console.log('❌ 設定に問題があります。上記のエラーを修正してください。');
    console.log('\n📖 詳細な設定手順は SETUP_REQUIRED.md を参照してください。');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️ 警告がありますが、基本機能は動作します。');
    console.log('🚀 デプロイ可能です！');
    process.exit(0);
  } else {
    console.log('✅ すべての設定が正常です！');
    console.log('🚀 デプロイ準備完了！');
    process.exit(0);
  }
}

// メイン実行
async function main() {
  validateSupabaseConfig();
  validateEnvironment();
  validateFiles();
  validateFunctions();
  displayResults();
}

// 実行
main().catch(error => {
  console.error('❌ 検証中にエラーが発生しました:', error);
  process.exit(1);
});
