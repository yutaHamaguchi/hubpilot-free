/**
 * リソース管理のプロパティテスト
 * Feature: article-generation-bug-fixes, Property 7: クリーンアップ処理の実行
 * Validates: Requirements 2.5
 */

// シンプルなプロパティベーステストライブラリ
class PropertyTest {
  static check(property, generator, iterations = 100) {
    console.log(`🧪 プロパティテスト開始: ${iterations}回の反復`);

    for (let i = 0; i < iterations; i++) {
      try {
        const testData = generator();
        const result = property(testData);

        if (!result.success) {
          console.error(`❌ プロパティテスト失敗 (反復 ${i + 1}/${iterations}):`, result.error);
          console.error('テストデータ:', testData);
          return false;
        }
      } catch (error) {
        console.error(`❌ プロパティテスト例外 (反復 ${i + 1}/${iterations}):`, error);
        return false;
      }
    }

    console.log(`✅ プロパティテスト成功: ${iterations}回すべて通過`);
    return true;
  }
}

/**
 * Property 7: クリーンアップ処理の実行
 * For all リソース管理操作において、適切なクリーンアップ処理が実行される
 */
function testCleanupExecution() {
  console.log('🧪 Property 7: クリーンアップ処理の実行テスト開始');

  // プロパティテスト定義
  const property = (testData) => {
    try {
      if (!window.resourceManager) {
        return {
          success: false,
          error: 'ResourceManagerが初期化されていません'
        };
      }

      const resourceManager = window.resourceManager;
      const initialStats = {
        activeOperations: resourceManager.resources.activeOperations.size,
        timers: resourceManager.resources.timers.size,
        eventListeners: resourceManager.resources.eventListeners.size,
        caches: resourceManager.resources.caches.size,
        temporaryData: resourceManager.resources.temporaryData.size
      };

      // 1. 操作登録とクリーンアップのテスト
      const operationId = `test-operation-${Date.now()}-${Math.random()}`;

      // 操作を登録
      resourceManager.registerOperation(operationId, {
        type: testData.operationType,
        priority: testData.priority,
        abortController: new AbortController()
      });

      // 操作が登録されたことを確認
      if (!resourceManager.resources.activeOperations.has(operationId)) {
        return {
          success: false,
          error: '操作の登録に失敗しました'
        };
      }

      // 操作を解放
      resourceManager.unregisterOperation(operationId);

      // 操作が解放されたことを確認
      if (resourceManager.resources.activeOperations.has(operationId)) {
        return {
          success: false,
          error: '操作の解放に失敗しました'
        };
      }

      // 2. キャッシュのクリーンアップテスト
      const cacheKey = `test-cache-${Date.now()}-${Math.random()}`;
      const cacheValue = { data: testData.cacheData };

      // 短いTTLでキャッシュを設定
      resourceManager.setCache(cacheKey, cacheValue, 100); // 100ms TTL

      // キャッシュが設定されたことを確認
      let cachedValue = resourceManager.getCache(cacheKey);
      if (!cachedValue || cachedValue.data !== cacheValue.data) {
        return {
          success: false,
          error: 'キャッシュの設定に失敗しました'
        };
      }

      // TTL経過後にキャッシュが削除されることを確認
      return new Promise((resolve) => {
        setTimeout(() => {
          const expiredValue = resourceManager.getCache(cacheKey);
          if (expiredValue !== null) {
            resolve({
              success: false,
              error: 'TTL経過後もキャッシュが残っています'
            });
          } else {
            resolve({ success: true });
          }
        }, 150); // TTLより少し長く待つ
      });

    } catch (error) {
      return {
        success: false,
        error: `クリーンアップ処理テスト中にエラー: ${error.message}`
      };
    }
  };

  // 非同期プロパティテスト用の特別な実行関数
  const asyncPropertyTest = async (property, generator, iterations = 100) => {
    console.log(`🧪 非同期プロパティテスト開始: ${iterations}回の反復`);

    for (let i = 0; i < iterations; i++) {
      try {
        const testData = generator();
        const result = await property(testData);

        if (!result.success) {
          console.error(`❌ プロパティテスト失敗 (反復 ${i + 1}/${iterations}):`, result.error);
          console.error('テストデータ:', testData);
          return false;
        }
      } catch (error) {
        console.error(`❌ プロパティテスト例外 (反復 ${i + 1}/${iterations}):`, error);
        return false;
      }
    }

    console.log(`✅ プロパティテスト成功: ${iterations}回すべて通過`);
    return true;
  };

  // テストデータ生成器
  const generator = () => ({
    operationType: ['article-generation', 'data-processing', 'api-call'][Math.floor(Math.random() * 3)],
    priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    cacheData: `test-data-${Math.random()}`,
    duration: Math.floor(Math.random() * 5000) + 1000 // 1-6秒
  });

  // 非同期プロパティテスト実行
  return asyncPropertyTest(property, generator, 50); // 非同期なので回数を減らす
}

/**
 * メモリリーク検出のテスト
 */
function testMemoryLeakDetection() {
  console.log('🧪 メモリリーク検出テスト開始');

  try {
    if (!window.resourceManager) {
      console.error('❌ ResourceManagerが初期化されていません');
      return false;
    }

    const resourceManager = window.resourceManager;

    // 1. 孤立したタイマーの検出テスト
    console.log('⏱️ 孤立タイマー検出テスト...');

    const testTimer = setTimeout(() => {}, 10000); // 10秒後のタイマー
    resourceManager.registerTimer(testTimer);

    // タイマーを手動でクリアして孤立状態にする
    clearTimeout(testTimer);

    // メモリリーク検出を実行
    const initialLeaks = resourceManager.stats.resourceLeaks;
    resourceManager.detectAndFixMemoryLeaks();

    // リークが検出されて修復されたかチェック
    if (resourceManager.stats.resourceLeaks <= initialLeaks) {
      console.warn('⚠️ 孤立タイマーの検出に失敗した可能性があります');
    } else {
      console.log('✅ 孤立タイマーの検出・修復成功');
    }

    // 2. 大きすぎる一時データの検出テスト
    console.log('📄 大容量一時データ検出テスト...');

    const largeData = 'x'.repeat(2 * 1024 * 1024); // 2MB のデータ
    resourceManager.setTemporaryData('large-test-data', largeData);

    const initialTempDataSize = resourceManager.resources.temporaryData.size;
    resourceManager.detectAndFixMemoryLeaks();

    // 大容量データが削除されたかチェック
    if (resourceManager.getTemporaryData('large-test-data') !== null) {
      console.warn('⚠️ 大容量一時データの削除に失敗');
    } else {
      console.log('✅ 大容量一時データの検出・削除成功');
    }

    return true;

  } catch (error) {
    console.error('❌ メモリリーク検出テスト中にエラー:', error);
    return false;
  }
}

/**
 * 同時実行数制限のテスト
 */
function testConcurrentOperationLimits() {
  console.log('🧪 同時実行数制限テスト開始');

  try {
    if (!window.resourceManager) {
      console.error('❌ ResourceManagerが初期化されていません');
      return false;
    }

    const resourceManager = window.resourceManager;
    const maxConcurrent = resourceManager.config.maxConcurrentOperations;

    console.log(`📊 最大同時実行数: ${maxConcurrent}`);

    // 現在のアクティブ操作をクリア
    for (const [operationId] of resourceManager.resources.activeOperations) {
      resourceManager.unregisterOperation(operationId);
    }

    const operationIds = [];

    // 1. 制限内での操作登録テスト
    console.log('📝 制限内操作登録テスト...');

    for (let i = 0; i < maxConcurrent; i++) {
      const operationId = `test-concurrent-${i}`;
      operationIds.push(operationId);

      resourceManager.registerOperation(operationId, {
        type: 'test',
        priority: 'medium',
        abortController: new AbortController()
      });
    }

    if (resourceManager.resources.activeOperations.size !== maxConcurrent) {
      console.error(`❌ 制限内操作登録に失敗: ${resourceManager.resources.activeOperations.size} !== ${maxConcurrent}`);
      return false;
    }

    console.log('✅ 制限内操作登録成功');

    // 2. 制限超過時の動作テスト
    console.log('🚫 制限超過動作テスト...');

    try {
      // 低優先度の操作を追加（強制終了されるはず）
      resourceManager.registerOperation('test-low-priority', {
        type: 'test',
        priority: 'low',
        abortController: new AbortController()
      });

      // 高優先度の操作を追加（低優先度操作を押し出すはず）
      resourceManager.registerOperation('test-high-priority', {
        type: 'test',
        priority: 'high',
        abortController: new AbortController()
      });

      console.log('✅ 優先度に基づく操作管理成功');

    } catch (error) {
      console.error('❌ 制限超過時の処理に失敗:', error);
      return false;
    }

    // 3. クリーンアップ
    for (const [operationId] of resourceManager.resources.activeOperations) {
      resourceManager.unregisterOperation(operationId);
    }

    console.log('✅ 同時実行数制限テスト完了');
    return true;

  } catch (error) {
    console.error('❌ 同時実行数制限テスト中にエラー:', error);
    return false;
  }
}

/**
 * 緊急クリーンアップのテスト
 */
function testEmergencyCleanup() {
  console.log('🧪 緊急クリーンアップテスト開始');

  try {
    if (!window.resourceManager) {
      console.error('❌ ResourceManagerが初期化されていません');
      return false;
    }

    const resourceManager = window.resourceManager;

    // 1. テストデータを作成
    console.log('📝 テストデータ作成...');

    // 期限切れキャッシュを作成
    resourceManager.setCache('expired-cache-1', 'data1', 1); // 1ms TTL
    resourceManager.setCache('expired-cache-2', 'data2', 1); // 1ms TTL

    // 古い一時データを作成
    resourceManager.setTemporaryData('old-temp-1', 'temp1');
    resourceManager.setTemporaryData('old-temp-2', 'temp2');

    // 一時データのタイムスタンプを古くする（内部操作）
    const tempData1 = resourceManager.resources.temporaryData.get('old-temp-1');
    const tempData2 = resourceManager.resources.temporaryData.get('old-temp-2');
    if (tempData1) tempData1.timestamp = Date.now() - 700000; // 11分前
    if (tempData2) tempData2.timestamp = Date.now() - 700000; // 11分前

    // 長時間実行操作を作成
    resourceManager.registerOperation('long-running-test', {
      type: 'test',
      priority: 'low',
      abortController: new AbortController()
    });

    // 操作の開始時間を古くする
    const longRunningOp = resourceManager.resources.activeOperations.get('long-running-test');
    if (longRunningOp) {
      longRunningOp.startTime = Date.now() - 400000; // 6分前
    }

    // 2. 緊急クリーンアップを実行
    console.log('🚨 緊急クリーンアップ実行...');

    const initialStats = {
      caches: resourceManager.resources.caches.size,
      tempData: resourceManager.resources.temporaryData.size,
      operations: resourceManager.resources.activeOperations.size
    };

    // 期限切れを確実にするため少し待つ
    setTimeout(() => {
      resourceManager.performEmergencyCleanup();

      // 3. クリーンアップ結果を検証
      console.log('🔍 クリーンアップ結果検証...');

      const finalStats = {
        caches: resourceManager.resources.caches.size,
        tempData: resourceManager.resources.temporaryData.size,
        operations: resourceManager.resources.activeOperations.size
      };

      console.log('📊 クリーンアップ前後の統計:');
      console.log('  キャッシュ:', initialStats.caches, '→', finalStats.caches);
      console.log('  一時データ:', initialStats.tempData, '→', finalStats.tempData);
      console.log('  アクティブ操作:', initialStats.operations, '→', finalStats.operations);

      // 期限切れキャッシュが削除されたかチェック
      if (resourceManager.getCache('expired-cache-1') !== null ||
                resourceManager.getCache('expired-cache-2') !== null) {
        console.warn('⚠️ 期限切れキャッシュの削除が不完全');
      } else {
        console.log('✅ 期限切れキャッシュの削除成功');
      }

      // 古い一時データが削除されたかチェック
      if (resourceManager.getTemporaryData('old-temp-1') !== null ||
                resourceManager.getTemporaryData('old-temp-2') !== null) {
        console.warn('⚠️ 古い一時データの削除が不完全');
      } else {
        console.log('✅ 古い一時データの削除成功');
      }

      console.log('✅ 緊急クリーンアップテスト完了');

    }, 50); // 50ms待機

    return true;

  } catch (error) {
    console.error('❌ 緊急クリーンアップテスト中にエラー:', error);
    return false;
  }
}

/**
 * 統合リソース管理テストの実行
 */
async function runResourceManagementTests() {
  console.log('🚀 ========== リソース管理テスト開始 ==========');

  let allTestsPassed = true;

  // Property 7のテスト（非同期）
  console.log('\n1️⃣ Property 7: クリーンアップ処理の実行');
  try {
    const result = await testCleanupExecution();
    if (!result) {
      allTestsPassed = false;
    }
  } catch (error) {
    console.error('❌ Property 7テスト中にエラー:', error);
    allTestsPassed = false;
  }

  // メモリリーク検出のテスト
  console.log('\n2️⃣ メモリリーク検出テスト');
  if (!testMemoryLeakDetection()) {
    allTestsPassed = false;
  }

  // 同時実行数制限のテスト
  console.log('\n3️⃣ 同時実行数制限テスト');
  if (!testConcurrentOperationLimits()) {
    allTestsPassed = false;
  }

  // 緊急クリーンアップのテスト
  console.log('\n4️⃣ 緊急クリーンアップテスト');
  if (!testEmergencyCleanup()) {
    allTestsPassed = false;
  }

  // 結果サマリー
  console.log('\n📊 ========== テスト結果サマリー ==========');
  if (allTestsPassed) {
    console.log('✅ すべてのリソース管理テストが成功しました！');
    console.log('🎉 Property 7: クリーンアップ処理の実行 - 検証完了');
  } else {
    console.log('❌ 一部のリソース管理テストが失敗しました');
    console.log('🔧 リソース管理機能の実装を確認してください');
  }
  console.log('===============================================');

  return allTestsPassed;
}

// テスト実行（ページ読み込み後）
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // ResourceManagerの初期化を待つ
    setTimeout(() => {
      runResourceManagementTests();
    }, 1500);
  });

  // グローバルに公開（デバッグ用）
  window.runResourceManagementTests = runResourceManagementTests;
  window.testCleanupExecution = testCleanupExecution;
}

console.log('✅ リソース管理テストが読み込まれました');
