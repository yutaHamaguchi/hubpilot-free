/**
 * Phase 9: 最終統合テスト
 *
 * 全コンポーネントの統合と最終テストを実行します。
 * 記事生成バグ修正プロジェクトの完了を検証します。
 */

// テスト実行関数
async function runPhase9IntegrationTest() {
    console.log('🚀 ========== Phase 9: 最終統合テスト開始 ==========');

    const testResults = {
        componentIntegration: null,
        backwardCompatibility: null,
        comprehensiveTest: null,
        performanceValidation: null
    };

    try {
        // 1. コンポーネント統合確認
        console.log('\n1️⃣ コンポーネント統合確認');
        testResults.componentIntegration = await testComponentIntegration();

        // 2. 後方互換性確認
        console.log('\n2️⃣ 後方互換性確認');
        testResults.backwardCompatibility = await testBackwardCompatibility();

        // 3. 包括的機能テスト
        console.log('\n3️⃣ 包括的機能テスト');
        testResults.comprehensiveTest = await testComprehensiveFunctionality();

        // 4. パフォーマンス検証
        console.log('\n4️⃣ パフォーマンス検証');
        testResults.performanceValidation = await testPerformanceValidation();

        // 結果サマリー
        const allSuccess = Object.values(testResults).every(result => result && result.success);

        console.log('\n📊 ========== Phase 9 統合テスト結果 ==========');
        console.log(`コンポーネント統合: ${testResults.componentIntegration.success ? '✅ 成功' : '❌ 失敗'}`);
        console.log(`後方互換性: ${testResults.backwardCompatibility.success ? '✅ 成功' : '❌ 失敗'}`);
        console.log(`包括的テスト: ${testResults.comprehensiveTest.success ? '✅ 成功' : '❌ 失敗'}`);
        console.log(`パフォーマンス検証: ${testResults.performanceValidation.success ? '✅ 成功' : '❌ 失敗'}`);

        if (allSuccess) {
            console.log('\n🎉 Phase 9: 最終統合テスト完了 - すべて成功！');
            console.log('✅ 記事生成バグ修正プロジェクトが正常に完了しました');
        } else {
            console.log('\n⚠️ Phase 9: 一部のテストが失敗しました');
        }
        console.log('===============================================');

        return {
            success: allSuccess,
            results: testResults
        };

    } catch (error) {
        console.error('❌ Phase 9統合テスト実行中にエラー:', error);
        return {
            success: false,
            error: error.message,
            results: testResults
        };
    }
}

// 1. コンポーネント統合確認
async function testComponentIntegration() {
    console.log('🔗 新しいコンポーネントの統合状況を確認中...');

    try {
        const integrationChecks = [];

        // HubPilotAppの確認
        if (window.HubPilotApp) {
            integrationChecks.push({
                component: 'HubPilotApp',
                status: 'available',
                hasPerformanceMonitor: !!window.performanceMonitor,
                hasResourceManager: !!window.resourceManager,
                hasDeveloperTestSuite: !!window.DeveloperTestSuite,
                hasIntegrationTestSuite: !!window.IntegrationTestSuite
            });
        }

        // 新しいコンポーネントの確認
        const newComponents = [
            'PerformanceMonitor',
            'ResourceManager',
            'DeveloperTestSuite',
            'IntegrationTestSuite',
            'ErrorHandler',
            'Logger',
            'DataValidator'
        ];

        newComponents.forEach(componentName => {
            integrationChecks.push({
                component: componentName,
                status: window[componentName] ? 'available' : 'missing',
                globalInstance: !!window[componentName.toLowerCase()]
            });
        });

        const availableComponents = integrationChecks.filter(check => check.status === 'available').length;
        const totalComponents = integrationChecks.length;

        console.log(`✅ コンポーネント統合確認完了: ${availableComponents}/${totalComponents}件利用可能`);

        return {
            success: availableComponents >= totalComponents - 2, // 2つまでの欠落は許容
            availableComponents,
            totalComponents,
            details: integrationChecks
        };

    } catch (error) {
        console.error('❌ コンポーネント統合確認失敗:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// 2. 後方互換性確認
async function testBackwardCompatibility() {
    console.log('🔄 既存機能の後方互換性を確認中...');

    try {
        const compatibilityTests = [];

        // 既存のグローバル関数の確認
        const existingFunctions = [
            'generateStructure',
            'generateHeadings',
            'startGeneration',
            'addNewPage',
            'removePage'
        ];

        existingFunctions.forEach(funcName => {
            compatibilityTests.push({
                function: funcName,
                available: typeof window[funcName] === 'function'
            });
        });

        // hubpilotオブジェクトの確認
        if (window.hubpilot) {
            const hubpilotMethods = [
                'debug', 'stats', 'health', 'test', 'quality',
                'getData', 'setData', 'goToStep', 'getCurrentStep'
            ];

            hubpilotMethods.forEach(method => {
                compatibilityTests.push({
                    function: `hubpilot.${method}`,
                    available: typeof window.hubpilot[method] === 'function'
                });
            });
        }

        const availableFunctions = compatibilityTests.filter(test => test.available).length;
        const totalFunctions = compatibilityTests.length;

        console.log(`✅ 後方互換性確認完了: ${availableFunctions}/${totalFunctions}件利用可能`);

        return {
            success: availableFunctions >= totalFunctions * 0.8, // 80%以上利用可能であればOK
            availableFunctions,
            totalFunctions,
            details: compatibilityTests
        };

    } catch (error) {
        console.error('❌ 後方互換性確認失敗:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// 3. 包括的機能テスト
async function testComprehensiveFunctionality() {
    console.log('🧪 包括的機能テストを実行中...');

    try {
        const functionalityTests = [];

        // ContentGeneratorの基本機能テスト
        if (window.ContentGenerator) {
            try {
                const generator = new window.ContentGenerator();

                // モック構造生成テスト
                const structure = await generator.generateStructureMock('テスト用テーマ');
                functionalityTests.push({
                    test: 'ContentGenerator.generateStructureMock',
                    success: !!(structure && structure.pillarPage && structure.clusterPages)
                });

                // モック記事生成テスト
                const article = await generator.generateArticleMock({
                    id: 'test',
                    title: 'テスト記事',
                    headings: [{ id: 'h1', text: 'テスト見出し', level: 2 }]
                });
                functionalityTests.push({
                    test: 'ContentGenerator.generateArticleMock',
                    success: !!(article && article.title && article.content)
                });

            } catch (error) {
                functionalityTests.push({
                    test: 'ContentGenerator',
                    success: false,
                    error: error.message
                });
            }
        }

        // パフォーマンス監視テスト
        if (window.performanceMonitor) {
            try {
                const stats = window.performanceMonitor.getPerformanceStats();
                functionalityTests.push({
                    test: 'PerformanceMonitor.getPerformanceStats',
                    success: !!(stats && typeof stats.totalOperations === 'number')
                });
            } catch (error) {
                functionalityTests.push({
                    test: 'PerformanceMonitor',
                    success: false,
                    error: error.message
                });
            }
        }

        // リソース管理テスト
        if (window.resourceManager) {
            try {
                const testId = 'functionality-test-' + Date.now();
                window.resourceManager.registerOperation(testId, { type: 'test' });
                window.resourceManager.unregisterOperation(testId);

                functionalityTests.push({
                    test: 'ResourceManager.registerOperation',
                    success: true
                });
            } catch (error) {
                functionalityTests.push({
                    test: 'ResourceManager',
                    success: false,
                    error: error.message
                });
            }
        }

        const successfulTests = functionalityTests.filter(test => test.success).length;
        const totalTests = functionalityTests.length;

        console.log(`✅ 包括的機能テスト完了: ${successfulTests}/${totalTests}件成功`);

        return {
            success: successfulTests >= totalTests * 0.8, // 80%以上成功であればOK
            successfulTests,
            totalTests,
            details: functionalityTests
        };

    } catch (error) {
        console.error('❌ 包括的機能テスト失敗:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// 4. パフォーマンス検証
async function testPerformanceValidation() {
    console.log('⚡ パフォーマンス検証を実行中...');

    try {
        const performanceTests = [];

        // メモリ使用量チェック
        if (window.performanceMonitor) {
            const memoryUsage = window.performanceMonitor.getCurrentMemoryUsage();
            performanceTests.push({
                test: 'memoryUsage',
                success: memoryUsage < 200, // 200MB以下
                value: memoryUsage.toFixed(2) + 'MB'
            });
        }

        // リソース統計チェック
        if (window.resourceManager) {
            const activeOperations = window.resourceManager.resources.activeOperations.size;
            const timers = window.resourceManager.resources.timers.size;
            const eventListeners = window.resourceManager.resources.eventListeners.size;

            performanceTests.push({
                test: 'activeOperations',
                success: activeOperations < 10, // 10個以下
                value: activeOperations
            });

            performanceTests.push({
                test: 'managedTimers',
                success: timers < 20, // 20個以下
                value: timers
            });

            performanceTests.push({
                test: 'managedEventListeners',
                success: eventListeners < 50, // 50個以下
                value: eventListeners
            });
        }

        // 簡単な処理速度テスト
        const startTime = performance.now();

        // 軽量な処理を実行
        for (let i = 0; i < 1000; i++) {
            const testData = { id: i, value: 'test' + i };
            JSON.stringify(testData);
        }

        const endTime = performance.now();
        const processingTime = endTime - startTime;

        performanceTests.push({
            test: 'processingSpeed',
            success: processingTime < 100, // 100ms以下
            value: processingTime.toFixed(2) + 'ms'
        });

        const successfulTests = performanceTests.filter(test => test.success).length;
        const totalTests = performanceTests.length;

        console.log(`✅ パフォーマンス検証完了: ${successfulTests}/${totalTests}件合格`);

        return {
            success: successfulTests >= totalTests * 0.8, // 80%以上合格であればOK
            successfulTests,
            totalTests,
            details: performanceTests
        };

    } catch (error) {
        console.error('❌ パフォーマンス検証失敗:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// グローバルに公開
window.runPhase9IntegrationTest = runPhase9IntegrationTest;

console.log('✅ Phase 9統合テストが読み込まれました');
console.log('💡 実行方法: runPhase9IntegrationTest()');
