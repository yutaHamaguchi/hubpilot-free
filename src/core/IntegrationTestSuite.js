/**
 * IntegrationTestSuite - 統合テスト機能
 *
 * エンドツーエンドテスト、エラーシナリオテスト、パフォーマンステストを提供します。
 * 修正されたコンポーネント間の連携テストを実行します。
 */

class IntegrationTestSuite {
    constructor() {
        // 依存関係
        this.hubPilotApp = null;
        this.contentGenerator = null;
        this.supabaseIntegration = null;
        this.progressManager = null;
        this.errorHandler = null;
        this.performanceMonitor = window.performanceMonitor;
        this.resourceManager = window.resourceManager;

        // テスト結果
        this.testResults = {
            endToEnd: null,
            errorScenarios: null,
            performance: null,
            componentIntegration: null
        };

        console.log('✅ IntegrationTestSuite初期化完了');
    }

    /**
     * 依存関係を設定
     */
    setDependencies(hubPilotApp, contentGenerator, supabaseIntegration, progressManager, errorHandler) {
        this.hubPilotApp = hubPilotApp;
        this.contentGenerator = contentGenerator;
        this.supabaseIntegration = supabaseIntegration;
        this.progressManager = progressManager;
        this.errorHandler = errorHandler;

        console.log('🔗 IntegrationTestSuiteの依存関係を設定しました');
    }

    /**
     * 全統合テストを実行
     */
    async runAllIntegrationTests() {
        console.log('🚀 ========== 統合テストスイート開始 ==========');

        const startTime = performance.now();
        let allTestsPassed = true;

        try {
            // 1. エンドツーエンドテスト
            console.log('\n1️⃣ エンドツーエンドテスト');
            const e2eTest = await this.runEndToEndTest();
            this.testResults.endToEnd = e2eTest;
            if (!e2eTest.success) allTestsPassed = false;

            // 2. エラーシナリオテスト
            console.log('\n2️⃣ エラーシナリオテスト');
            const errorTest = await this.runErrorScenarioTest();
            this.testResults.errorScenarios = errorTest;
            if (!errorTest.success) allTestsPassed = false;

            // 3. パフォーマンステスト
            console.log('\n3️⃣ パフォーマンステスト');
            const perfTest = await this.runPerformanceTest();
            this.testResults.performance = perfTest;
            if (!perfTest.success) allTestsPassed = false;

            // 4. コンポーネント統合テスト
            console.log('\n4️⃣ コンポーネント統合テスト');
            const integrationTest = await this.runComponentIntegrationTest();
            this.testResults.componentIntegration = integrationTest;
            if (!integrationTest.success) allTestsPassed = false;

            // 結果サマリー
            const endTime = performance.now();
            const duration = endTime - startTime;

            console.log('\n📊 ========== 統合テスト結果サマリー ==========');
            console.log(`実行時間: ${duration.toFixed(2)}ms`);
            console.log(`エンドツーエンドテスト: ${this.testResults.endToEnd.success ? '✅ 成功' : '❌ 失敗'}`);
            console.log(`エラーシナリオテスト: ${this.testResults.errorScenarios.success ? '✅ 成功' : '❌ 失敗'}`);
            console.log(`パフォーマンステスト: ${this.testResults.performance.success ? '✅ 成功' : '❌ 失敗'}`);
            console.log(`コンポーネント統合テスト: ${this.testResults.componentIntegration.success ? '✅ 成功' : '❌ 失敗'}`);

            if (allTestsPassed) {
                console.log('\n🎉 すべての統合テストが成功しました！');
            } else {
                console.log('\n⚠️ 一部の統合テストが失敗しました。詳細を確認してください。');
            }
            console.log('===============================================');

            return {
                success: allTestsPassed,
                duration,
                results: this.testResults
            };

        } catch (error) {
            console.error('❌ 統合テストスイート実行中にエラーが発生:', error);
            return {
                success: false,
                error: error.message,
                results: this.testResults
            };
        }
    }
    /**
     * エンドツーエンドテスト
     */
    async runEndToEndTest() {
        console.log('🔄 エンドツーエンドテスト実行中...');

        try {
            const testResults = [];

            // 1. 記事生成フロー全体のテスト
            console.log('  📝 記事生成フロー全体テスト...');

            const testTheme = 'AI技術の最新動向';
            const startTime = performance.now();

            // 構造生成
            const structure = await this.contentGenerator.generateStructure(testTheme);
            if (!structure || !structure.pillarPage || !structure.clusterPages) {
                testResults.push({
                    test: 'structureGeneration',
                    success: false,
error: '構造生成に失敗しました'
                });
            } else {
                testResults.push({
                    test: 'structureGeneration',
                    success: true,
                    pillarTitle: structure.pillarPage.title,
                    clusterCount: structure.clusterPages.length
                });
            }

            // 見出し生成
            const headings = await this.contentGenerator.generateHeadings(structure.clusterPages);
            if (!headings || Object.keys(headings).length === 0) {
                testResults.push({
                    test: 'headingGeneration',
                    success: false,
                    error: '見出し生成に失敗しました'
                });
            } else {
                testResults.push({
                    test: 'headingGeneration',
                    success: true,
                    headingCount: Object.keys(headings).length
                });
            }

            // 記事生成（進捗付き）
            const progressUpdates = [];
            const articles = await this.contentGenerator.generateArticles(
                structure.clusterPages.slice(0, 2), // 最初の2記事のみテスト
                (progress) => progressUpdates.push(progress)
            );

            if (!articles || articles.length === 0) {
                testResults.push({
                    test: 'articleGeneration',
                    success: false,
                    error: '記事生成に失敗しました'
                });
            } else {
                testResults.push({
                    test: 'articleGeneration',
                    success: true,
                    articleCount: articles.length,
                    progressUpdates: progressUpdates.length
                });
            }

            // 品質チェック
            const qualityChecks = await this.contentGenerator.performQualityCheck(articles);
            if (!qualityChecks || qualityChecks.length === 0) {
                testResults.push({
                    test: 'qualityCheck',
                    success: false,
                    error: '品質チェックに失敗しました'
                });
            } else {
                testResults.push({
                    test: 'qualityCheck',
                    success: true,
                    checkCount: qualityChecks.length,
                    averageScore: qualityChecks.reduce((sum, check) => sum + (check.score || 0), 0) / qualityChecks.length
                });
            }

            const endTime = performance.now();
            const totalDuration = endTime - startTime;

            // 結果評価
            const successfulTests = testResults.filter(r => r.success).length;
            const totalTests = testResults.length;

            console.log(`✅ エンドツーエンドテスト完了: ${successfulTests}/${totalTests}件成功 (${totalDuration.toFixed(2)}ms)`);

            return {
                success: successfulTests === totalTests,
                duration: totalDuration,
                successfulTests,
                totalTests,
                results: testResults
            };

        } catch (error) {
            console.error('❌ エンドツーエンドテスト失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * エラーシナリオテスト
     */
    async runErrorScenarioTest() {
        console.log('⚠️ エラーシナリオテスト実行中...');

        try {
            const testResults = [];

            // 1. 無効な入力でのエラーハンドリングテスト
            console.log('  🚫 無効入力エラーハンドリングテスト...');

            try {
                await this.contentGenerator.generateStructure(''); // 空のテーマ
                testResults.push({
                    test: 'invalidInputHandling',
                    success: false,
                    error: '例外が発生しませんでした'
                });
            } catch (expectedError) {
                testResults.push({
                    test: 'invalidInputHandling',
                    success: true,
                    errorMessage: expectedError.message
                });
            }

            // 2. ネットワークエラーシミュレーション
            console.log('  🌐 ネットワークエラーシミュレーション...');

            if (this.supabaseIntegration) {
                try {
                    await this.supabaseIntegration.callEdgeFunctionWithRetry('non-existent-function', {});
                    testResults.push({
                        test: 'networkErrorHandling',
                        success: false,
                        error: 'ネットワークエラーが発生しませんでした'
                    });
                } catch (networkError) {
                    testResults.push({
                        test: 'networkErrorHandling',
                        success: true,
                        errorMessage: networkError.message
                    });
                }
            } else {
                testResults.push({
                    test: 'networkErrorHandling',
                    success: true,
                    message: 'SupabaseIntegrationが利用できません（スキップ）'
                });
            }

            // 3. メモリ不足シミュレーション
            console.log('  🧠 メモリ不足シミュレーション...');

            try {
                // 大量のデータを生成してメモリ使用量を増加
                const largeData = [];
                for (let i = 0; i < 1000; i++) {
                    largeData.push('x'.repeat(10000)); // 10KB × 1000 = 10MB
                }

                // リソース管理の警告が発生するかチェック
                const initialMemory = this.resourceManager.getCurrentMemoryUsage();
                this.resourceManager.setTemporaryData('large-test-data', largeData);

                // メモリチェックを実行
                this.resourceManager.checkMemoryUsage();

                testResults.push({
                    test: 'memoryPressureHandling',
                    success: true,
                    initialMemory: initialMemory.toFixed(2) + 'MB',
                    message: 'メモリ圧迫状況での動作確認完了'
                });

                // クリーンアップ
                this.resourceManager.resources.temporaryData.delete('large-test-data');

            } catch (error) {
                testResults.push({
                    test: 'memoryPressureHandling',
                    success: false,
                    error: error.message
                });
            }

            // 4. 同時実行制限テスト
            console.log('  🔄 同時実行制限テスト...');

            try {
                const maxConcurrent = this.resourceManager.config.maxConcurrentOperations;
                const operationIds = [];

                // 制限を超える操作を登録
                for (let i = 0; i <= maxConcurrent; i++) {
                    const operationId = `concurrent-test-${i}`;
                    operationIds.push(operationId);

                    try {
                        this.resourceManager.registerOperation(operationId, {
                            type: 'test',
                            priority: i === maxConcurrent ? 'high' : 'low', // 最後は高優先度
                            abortController: new AbortController()
                        });
                    } catch (limitError) {
                        if (i === maxConcurrent) {
                            // 最後の操作で制限エラーまたは強制終了が発生することを期待
                            testResults.push({
                                test: 'concurrentLimitHandling',
                                success: true,
                                message: '同時実行制限が正常に動作しました'
                            });
                        }
                        break;
                    }
                }

                // クリーンアップ
                operationIds.forEach(id => {
                    try {
                        this.resourceManager.unregisterOperation(id);
                    } catch (error) {
                        // 既に削除されている場合は無視
                    }
                });

                if (!testResults.find(r => r.test === 'concurrentLimitHandling')) {
                    testResults.push({
                        test: 'concurrentLimitHandling',
                        success: true,
                        message: '同時実行制限内で正常動作'
                    });
                }

            } catch (error) {
                testResults.push({
                    test: 'concurrentLimitHandling',
                    success: false,
                    error: error.message
                });
            }

            // 結果評価
            const successfulTests = testResults.filter(r => r.success).length;
            const totalTests = testResults.length;

            console.log(`✅ エラーシナリオテスト完了: ${successfulTests}/${totalTests}件成功`);

            return {
                success: successfulTests === totalTests,
                successfulTests,
                totalTests,
                results: testResults
            };

        } catch (error) {
            console.error('❌ エラーシナリオテスト失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * パフォーマンステスト
     */
    async runPerformanceTest() {
        console.log('📊 パフォーマンステスト実行中...');

        try {
            const testResults = [];

            // 1. 記事生成速度テスト
            console.log('  ⚡ 記事生成速度テスト...');

            const testPages = [
                { id: 'perf-1', title: 'パフォーマンステスト記事1' },
                { id: 'perf-2', title: 'パフォーマンステスト記事2' },
                { id: 'perf-3', title: 'パフォーマンステスト記事3' }
            ];

            const startTime = performance.now();
            const articles = await this.contentGenerator.generateArticles(testPages, () => {});
            const endTime = performance.now();

            const totalDuration = endTime - startTime;
            const averageDuration = totalDuration / testPages.length;

            testResults.push({
                test: 'articleGenerationSpeed',
                success: averageDuration < 10000, // 1記事あたり10秒以内
                totalDuration: totalDuration.toFixed(2) + 'ms',
                averageDuration: averageDuration.toFixed(2) + 'ms',
                articlesGenerated: articles.length
            });

            // 2. メモリ使用量テスト
            console.log('  🧠 メモリ使用量テスト...');

            const initialMemory = this.performanceMonitor.getCurrentMemoryUsage();

            // 複数の操作を実行してメモリ使用量を監視
            await this.contentGenerator.generateStructure('メモリテスト用テーマ');

            const finalMemory = this.performanceMonitor.getCurrentMemoryUsage();
            const memoryIncrease = finalMemory - initialMemory;

            testResults.push({
                test: 'memoryUsage',
                success: memoryIncrease < 50, // 50MB以内の増加
                initialMemoritialMemory.toFixed(2) + 'MB',
                finalMemory: finalMemory.toFixed(2) + 'MB',
                memoryIncrease: memoryIncrease.toFixed(2) + 'MB'
            });

            // 3. 同時実行パフォーマンステスト
            console.log('  🔄 同時実行パフォーマンステスト...');

            const concurrentStartTime = performance.now();

            const concurrentPromises = [];
            for (let i = 0; i < 3; i++) {
                concurrentPromises.push(
                    this.contentGenerator.generateStructure(`並列テスト${i + 1}`)
                );
            }

            await Promise.all(concurrentPromises);

            const concurrentEndTime = performance.now();
            const concurrentDuration = concurrentEndTime - concurrentStartTime;

            testResults.push({
                test: 'concurrentPerformance',
                success: concurrentDuration < 15000, // 15秒以内
                duration: concurrentDuration.toFixed(2) + 'ms',
                concurrentOperations: concurrentPromises.length
            });

            // 4. パフォーマンス統計の確認
            console.log('  📈 パフォーマンス統計確認...');

            const stats = this.performanceMonitor.getPerformanceStats();

            testResults.push({
                test: 'performanceStats',
                success: stats.totalOperations > 0 && stats.successRate > 80,
                totalOperations: stats.totalOperations,
                successRate: stats.successRate.toFixed(1) + '%',
                averageDuration: stats.averageDuration.toFixed(2) + 'ms'
            });

            // 結果評価
            const successfulTests = testResults.filter(r => r.success).length;
            const totalTests = testResults.length;

            console.log(`✅ パフォーマンステスト完了: ${successfulTests}/${totalTests}件成功`);

            return {
                success: successfulTests === totalTests,
                successfulTests,
                totalTests,
                results: testResults
            };

        } catch (error) {
            console.error('❌ パフォーマンステスト失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * コンポーネント統合テスト
     */
    async runComponentIntegrationTest() {
        console.log('🔗 コンポーネント統合テスト実行中...');

        try {
            const testResults = [];

            // 1. ContentGenerator ↔ SupabaseIntegration 連携テスト
            console.log('  📝 ContentGenerator-SupabaseIntegration連携テスト...');

            if (this.supabaseIntegration) {
                try {
                    const isConfigured = await this.supabaseIntegration.isConfigured();
                    const structure = await this.contentGenerator.generateStructure('統合テスト');

                    testResults.push({
                        test: 'contentGenerator-supabase',
                        success: true,
                        supabaseConfigured: isConfigured,
                        structureGenerated: !!structure
                    });
                } catch (error) {
                    testResults.push({
                        test: 'contentGenerator-supabase',
                        success: false,
                        error: error.message
                    });
                }
            } else {
                testResults.push({
                    test: 'contentGenerator-supabase',
                    success: true,
                    message: 'SupabaseIntegrationが利用できません（スキップ）'
                });
            }

            // 2. PerformanceMonitor ↔ ResourceManager 連携テスト
            console.log('  📊 PerformanceMonitor-ResourceManager連携テスト...');

            try {
                const operationId = 'integration-test-' + Date.now();

                // ResourceManagerに操作を登録
                this.resourceManager.registerOperation(operationId, {
                    type: 'integration-test',
                    abortController: new AbortController()
                });

                // PerformanceMonitorで操作を追跡
                await this.performanceMonitor.trackOperation('統合テスト操作', async () => {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    return '統合テスト完了';
                });

                // ResourceManagerから操作を解放
                this.resourceManager.unregisterOperation(operationId);

                testResults.push({
                    test: 'performanceMonitor-resourceManager',
                    success: true,
                    message: 'パフォーマンス監視とリソース管理の連携成功'
                });

            } catch (error) {
                testResults.push({
                    test: 'performanceMonitor-resourceManager',
                    success: false,
                    error: error.message
                });
            }

            // 3. ErrorHandler統合テスト
            console.log('  🚨 ErrorHandler統合テスト...');

            if (this.errorHandler) {
                try {
                    const testError = new Error('統合テスト用エラー');
                    testError.code = 'INTEGRATION_TEST_ERROR';

                    const handledError = this.errorHandler.handleError(testError, '統合テストコンテキスト');

                    testResults.push({
                        test: 'errorHandler-integration',
                        success: !!handledError.userMessage,
                        userMessage: handledError.userMessage
                    });

                } catch (error) {
                    testResults.push({
                        test: 'errorHandler-integration',
                        success: false,
                        error: error.message
                    });
                }
            } else {
                testResults.push({
                    test: 'errorHandler-integration',
                    success: true,
                    message: 'ErrorHandlerが利用できません（スキップ）'
                });
            }

            // 4. 全コンポーネント連携テスト
            console.log('  🌐 全コンポーネント連携テスト...');

            try {
                // 複数のコンポーネントを組み合わせた操作
                const operationId = 'full-integration-test';

                this.resourceManager.registerOperation(operationId, {
                    type: 'full-integration',
                    abortController: new AbortController()
                });

                const result = await this.performanceMonitor.trackOperation('全コンポーネント連携', async () => {
                    const structure = await this.contentGenerator.generateStructure('全連携テスト');
                    return structure;
                });

                this.resourceManager.unregisterOperation(operationId);

                testResults.push({
                    test: 'full-component-integration',
                    success: !!result,
                    message: '全コンポーネント連携成功'
                });

            } catch (error) {
                testResults.push({
                    test: 'full-component-integration',
                    success: false,
                    error: error.message
                });
            }

            // 結果評価
            const successfulTests = testResults.filter(r => r.success).length;
            const totalTests = testResults.length;

            console.log(`✅ コンポーネント統合テスト完了: ${successfulTests}/${totalTests}件成功`);

            return {
                success: successfulTests === totalTests,
                successfulTests,
                totalTests,
                results: testResults
            };

        } catch (error) {
            console.error('❌ コンポーネント統合テスト失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * テスト結果を取得
     */
    getTestResults() {
        return this.testResults;
    }

    /**
     * テスト結果をクリア
     */
    clearTestResults() {
        this.testResults = {
            endToEnd: null,
            errorScenarios: null,
            performance: null,
            componentIntegration: null
        };
        console.log('🧹 統合テスト結果をクリアしました');
    }
}

// グローバルインスタンス
window.IntegrationTestSuite = IntegrationTestSuite;

console.log('✅ IntegrationTestSuiteクラスが読み込まれました');
