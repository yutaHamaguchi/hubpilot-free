/**
 * パフォーマンス最適化のプロパティテスト
 * Feature: article-generation-bug-fixes, Property 18: パフォーマンス制約の遵守
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5
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
 * Property 18: パフォーマンス制約の遵守
 * For all 記事生成プロセスにおいて、処理開始時間、タイムアウト設定、同時実行数制限、メモリ使用量が適切な範囲内である
 */
function testPerformanceConstraints() {
    console.log('🧪 Property 18: パフォーマンス制約の遵守テスト開始');

    // プロパティテスト定義
    const property = (testData) => {
        try {
            // PerformanceMonitorとResourceManagerが利用可能かチェック
            if (!window.performanceMonitor || !window.resourceManager) {
                return {
                    success: false,
                    error: 'PerformanceMonitorまたはResourceManagerが初期化されていません'
                };
            }

            const performanceMonitor = window.performanceMonitor;
            const resourceManager = window.resourceManager;

            // 1. 処理開始時間の制約チェック（要件8.1）
            const startTime = performance.now();
            const operationStartDelay = testData.operationStartDelay;

            if (operationStartDelay > 1000) { // 1秒以上の遅延は不適切
                return {
                    success: false,
                    error: `処理開始遅延が過大: ${operationStartDelay}ms > 1000ms`
                };
            }

            // 2. タイムアウト設定の制約チェック（要件8.2）
            const timeouts = performanceMonitor.metrics.timeouts;

            // AI API呼び出しタイムアウト: 30秒以内
            if (timeouts.aiApiCall > 30000) {
                return {
                    success: false,
                    error: `AI APIタイムアウトが過大: ${timeouts.aiApiCall}ms > 30000ms`
                };
            }

            // Edge Functionタイムアウト: 45秒以内
            if (timeouts.edgeFunction > 45000) {
                return {
                    success: false,
                    error: `Edge Functionタイムアウトが過大: ${timeouts.edgeFunction}ms > 45000ms`
                };
            }

            // データ操作タイムアウト: 10秒以内
            if (timeouts.dataOperation > 10000) {
                return {
                    success: false,
                    error: `データ操作タイムアウトが過大: ${timeouts.dataOperation}ms > 10000ms`
                };
            }

            // 3. 同時実行数制限の制約チェック（要件8.3）
            const maxConcurrent = performanceMonitor.metrics.maxConcurrentOperations;
            const currentConcurrent = performanceMonitor.metrics.concurrentOperations;

            if (maxConcurrent > 5) { // 最大5つまで
                return {
                    success: false,
                    error: `同時実行数制限が過大: ${maxConcurrent} > 5`
                };
            }

            if (currentConcurrent > maxConcurrent) {
                return {
                    success: false,
                    error: `現在の同時実行数が制限を超過: ${currentConcurrent} > ${maxConcurrent}`
                };
            }

            // 4. メモリ使用量の制約チェック（要件8.4）
            const currentMemory = performanceMonitor.getCurrentMemoryUsage();
            const maxMemoryLimit = resourceManager.config.maxMemoryUsage; // 150MB

            if (currentMemory > maxMemoryLimit) {
                return {
                    success: false,
                    error: `メモリ使用量が制限を超過: ${currentMemory.toFixed(2)}MB > ${maxMemoryLimit}MB`
                };
            }

            // 5. リソース解放の制約チェック（要件8.5）
            const activeOperations = resourceManager.resources.activeOperations.size;
            const maxActiveOperations = 10; // 最大10個のアクティブ操作

            if (activeOperations > maxActiveOperations) {
                return {
                    success: false,
                    error: `アクティブ操作数が過大: ${activeOperations} > ${maxActiveOperations}`
                };
            }

            // キャッシュサイズの制約チェック
            const cacheSize = resourceManager.resources.caches.size;
            const maxCacheSize = resourceManager.config.maxCacheSize;

            if (cacheSize > maxCacheSize) {
                return {
                    success: false,
                    error: `キャッシュサイズが制限を超過: ${cacheSize} > ${maxCacheSize}`
                };
            }

            // タイマー数の制約チェック
            const timerCount = resourceManager.resources.timers.size;
            const maxTimers = 20; // 最大20個のタイマー

            if (timerCount > maxTimers) {
                return {
                    success: false,
                    error: `タイマー数が過大: ${timerCount} > ${maxTimers}`
                };
            }

            return { success: true };

        } catch (error) {
            return {
                success: false,
                error: `パフォーマンス制約チェック中にエラー: ${error.message}`
            };
        }
    };

    // テストデータ生成器
    const generator = () => ({
        operationStartDelay: Math.floor(Math.random() * 2000), // 0-2000ms
        operationType: ['AI生成', 'データ保存', 'Edge Function'][Math.floor(Math.random() * 3)],
        expectedDuration: Math.floor(Math.random() * 30000) + 1000, // 1-31秒
        memoryUsage: Math.floor(Math.random() * 200) + 50, // 50-250MB
        concurrentOperations: Math.floor(Math.random() * 8) + 1 // 1-8個
    });

    // プロパティテスト実行
    return PropertyTest.check(property, generator, 100);
}

/**
 * パフォーマンス監視機能のテスト
 */
function testPerformanceMonitoring() {
    console.log('🧪 パフォーマンス監視機能テスト開始');

    try {
        if (!window.performanceMonitor) {
            console.error('❌ PerformanceMonitorが初期化されていません');
            return false;
        }

        const performanceMonitor = window.performanceMonitor;

        // 1. 操作追跡のテスト
        console.log('📊 操作追跡テスト...');

        const testOperation = async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return 'テスト完了';
        };

        performanceMonitor.trackOperation('テスト操作', testOperation)
            .then(result => {
                console.log('✅ 操作追跡テスト成功:', result);
            })
            .catch(error => {
                console.error('❌ 操作追跡テスト失敗:', error);
                return false;
            });

        // 2. メトリクス取得のテスト
        console.log('📈 メトリクス取得テスト...');
        const stats = performanceMonitor.getPerformanceStats();

        if (!stats || typeof stats !== 'object') {
            console.error('❌ パフォーマンス統計の取得に失敗');
            return false;
        }

        console.log('✅ パフォーマンス統計取得成功:', {
            totalOperations: stats.totalOperations,
            averageDuration: stats.averageDuration,
            successRate: stats.successRate,
            currentMemoryUsage: stats.currentMemoryUsage
        });

        // 3. タイムアウト設定のテスト
        console.log('⏱️ タイムアウト設定テスト...');
        const originalTimeouts = { ...performanceMonitor.metrics.timeouts };

        performanceMonitor.updateTimeouts({
            aiApiCall: 25000,
            edgeFunction: 40000
        });

        if (performanceMonitor.metrics.timeouts.aiApiCall !== 25000) {
            console.error('❌ タイムアウト設定の更新に失敗');
            return false;
        }

        // 元の設定に戻す
        performanceMonitor.updateTimeouts(originalTimeouts);
        console.log('✅ タイムアウト設定テスト成功');

        return true;

    } catch (error) {
        console.error('❌ パフォーマンス監視機能テスト中にエラー:', error);
        return false;
    }
}

/**
 * リソース管理機能のテスト
 */
function testResourceManagement() {
    console.log('🧪 リソース管理機能テスト開始');

    try {
        if (!window.resourceManager) {
            console.error('❌ ResourceManagerが初期化されていません');
            return false;
        }

        const resourceManager = window.resourceManager;

        // 1. 操作登録・解放のテスト
        console.log('📝 操作登録・解放テスト...');

        const operationId = 'test-operation-' + Date.now();

        resourceManager.registerOperation(operationId, {
            type: 'test',
            data: 'テストデータ'
        });

        if (!resourceManager.resources.activeOperations.has(operationId)) {
            console.error('❌ 操作登録に失敗');
            return false;
        }

        resourceManager.unregisterOperation(operationId);

        if (resourceManager.resources.activeOperations.has(operationId)) {
            console.error('❌ 操作解放に失敗');
            return false;
        }

        console.log('✅ 操作登録・解放テスト成功');

        // 2. キャッシュ機能のテスト
        console.log('💾 キャッシュ機能テスト...');

        const testKey = 'test-cache-key';
        const testValue = { data: 'テストキャッシュデータ' };

        resourceManager.setCache(testKey, testValue, 5000); // 5秒TTL

        const cachedValue = resourceManager.getCache(testKey);
        if (!cachedValue || cachedValue.data !== testValue.data) {
            console.error('❌ キャッシュ設定・取得に失敗');
            return false;
        }

        console.log('✅ キャッシュ機能テスト成功');

        // 3. 一時データ機能のテスト
        console.log('📄 一時データ機能テスト...');

        const tempKey = 'test-temp-key';
        const tempValue = 'テスト一時データ';

        resourceManager.setTemporaryData(tempKey, tempValue);

        const retrievedValue = resourceManager.getTemporaryData(tempKey);
        if (retrievedValue !== tempValue) {
            console.error('❌ 一時データ設定・取得に失敗');
            return false;
        }

        console.log('✅ 一時データ機能テスト成功');

        // 4. メモリ使用量チェックのテスト
        console.log('🧠 メモリ使用量チェックテスト...');

        const memoryUsage = resourceManager.getCurrentMemoryUsage();
        if (typeof memoryUsage !== 'number' || memoryUsage < 0) {
            console.error('❌ メモリ使用量取得に失敗');
            return false;
        }

        console.log('✅ メモリ使用量チェックテスト成功:', memoryUsage.toFixed(2) + 'MB');

        return true;

    } catch (error) {
        console.error('❌ リソース管理機能テスト中にエラー:', error);
        return false;
    }
}

/**
 * 統合パフォーマンステストの実行
 */
function runPerformanceTests() {
    console.log('🚀 ========== パフォーマンス最適化テスト開始 ==========');

    let allTestsPassed = true;

    // Property 18のテスト
    console.log('\n1️⃣ Property 18: パフォーマンス制約の遵守');
    if (!testPerformanceConstraints()) {
        allTestsPassed = false;
    }

    // パフォーマンス監視機能のテスト
    console.log('\n2️⃣ パフォーマンス監視機能テスト');
    if (!testPerformanceMonitoring()) {
        allTestsPassed = false;
    }

    // リソース管理機能のテスト
    console.log('\n3️⃣ リソース管理機能テスト');
    if (!testResourceManagement()) {
        allTestsPassed = false;
    }

    // 結果サマリー
    console.log('\n📊 ========== テスト結果サマリー ==========');
    if (allTestsPassed) {
        console.log('✅ すべてのパフォーマンステストが成功しました！');
        console.log('🎉 Property 18: パフォーマンス制約の遵守 - 検証完了');
    } else {
        console.log('❌ 一部のパフォーマンステストが失敗しました');
        console.log('🔧 パフォーマンス最適化の実装を確認してください');
    }
    console.log('===============================================');

    return allTestsPassed;
}

// テスト実行（ページ読み込み後）
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        // PerformanceMonitorとResourceManagerの初期化を待つ
        setTimeout(() => {
            runPerformanceTests();
        }, 1000);
    });

    // グローバルに公開（デバッグ用）
    window.runPerformanceTests = runPerformanceTests;
    window.testPerformanceConstraints = testPerformanceConstraints;
}

console.log('✅ パフォーマンス最適化テストが読み込まれました');
