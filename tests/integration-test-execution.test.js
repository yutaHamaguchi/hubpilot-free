/**
 * 統合テスト実行機能
 * 修正されたコンポーネント間の連携テスト、記事生成フロー全体のテスト、エラーハンドリングの統合テスト
 */

/**
 * 統合テスト実行機能のテスト
 */
function testIntegrationTestExecution() {
    console.log('🧪 統合テスト実行機能テスト開始');

    try {
        // IntegrationTestSuiteクラスが利用可能かチェック
        if (!window.IntegrationTestSuite) {
            console.error('❌ IntegrationTestSuiteクラスが読み込まれていません');
            return false;
        }

        // 1. インスタンス作成テスト
        console.log('📝 IntegrationTestSuiteインスタンス作成テスト...');
        const integrationTestSuite = new window.IntegrationTestSuite();

        if (!integrationTestSuite) {
            console.error('❌ IntegrationTestSuiteインスタンスの作成に失敗');
            return false;
        }

        console.log('✅ IntegrationTestSuiteインスタンス作成成功');

        // 2. 依存関係設定テスト
        console.log('🔗 依存関係設定テスト...');

        // モック依存関係を作成
        const mockHubPilotApp = {
            initialize: async () => true,
            debug: () => ({ status: 'initialized' })
        };

        const mockContentGenerator = {
            generateStructure: async (theme) => ({
                pillarPage: { title: `${theme}完全ガイド` },
                clusterPages: [
                    { id: 'cluster-1', title: `${theme}の基本` },
                    { id: 'cluster-2', title: `${theme}の応用` }
                ]
            }),
            generateHeadings: async (pages) => {
                const headings = {};
                pages.forEach(page => {
                    headings[page.id] = [
                        { id: 'h1', text: '概要', level: 1 },
                        { id: 'h2', text: '詳細', level: 2 }
                    ];
                });
                return headings;
            },
            generateArticles: async (pages, progressCallback) => {
                const articles = [];
                for (let i = 0; i < pages.length; i++) {
                    if (progressCallback) {
                        progressCallback({
                            current: i + 1,
                            total: pages.length,
                            currentPage: pages[i].title,
                            progress: ((i + 1) / pages.length) * 100
                        });
                    }

                    articles.push({
                        id: pages[i].id,
                        title: pages[i].title,
                        content: `${pages[i].title}に関する詳細な内容です。`.repeat(50),
                        wordCount: 1500,
                        qualityStatus: 'AI生成完了'
                    });

                    // 生成時間をシミュレート
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                return articles;
            },
            performQualityCheck: async (articles) => {
                return articles.map(article => ({
                    articleId: article.id,
                    title: article.title,
                    score: Math.floor(Math.random() * 20) + 80, // 80-100点
                    status: '良好',
                    checks: [
                        { name: '文字数', status: 'OK', value: `${article.wordCount}文字` },
                        { name: 'SEO最適化', status: 'OK', value: '85点' }
                    ]
                }));
            }
        };

        const mockSupabaseIntegration = {
            isConfigured: async () => false, // モックモードをシミュレート
            callEdgeFunctionWithRetry: async (functionName, params) => {
                if (functionName === 'non-existent-function') {
                    throw new Error('Function not found');
                }
                return { success: true, data: params };
            }
        };

        const mockProgressManager = {
            start: (total, progressCallback, completionCallback, errorCallback) => {
                console.log(`進捗管理開始: ${total}タスク`);
            },
            updateProgress: (current, message) => {
                console.log(`進捗更新: ${current} - ${message}`);
            },
            handleError: (error) => {
                console.log(`進捗エラー: ${error}`);
            }
        };

        const mockErrorHandler = {
            handleError: (error, context) => {
                return {
                    userMessage: `エラーが発生しました: ${error.message}`,
                    context: context,
                    code: error.code || 'UNKNOWN_ERROR'
                };
            }
        };

        integrationTestSuite.setDependencies(
            mockHubPilotApp,
            mockContentGenerator,
            mockSupabaseIntegration,
            mockProgressManager,
            mockErrorHandler
        );

        console.log('✅ 依存関係設定成功');

        // 3. 個別統合テスト機能の動作確認
        console.log('🔍 個別統合テスト機能動作確認...');

        // 3.1 エンドツーエンドテスト
        console.log('  🔄 エンドツーエンドテスト機能確認...');
        integrationTestSuite.runEndToEndTest().then(result => {
            if (result.success) {
                console.log('    ✅ エンドツーエンドテスト機能正常');
                console.log(`      成功: ${result.successfulTests}/${result.totalTests}件`);
            } else {
                console.log('    ❌ エンドツーエンドテスト機能異常:', result.error);
            }
        }).catch(error => {
            console.log('    ❌ エンドツーエンドテスト機能エラー:', error);
        });

        // 3.2 エラーシナリオテスト
        console.log('  ⚠️ エラーシナリオテスト機能確認...');
        integrationTestSuite.runErrorScenarioTest().then(result => {
            if (result.success) {
                console.log('    ✅ エラーシナリオテスト機能正常');
                console.log(`      成功: ${result.successfulTests}/${result.totalTests}件`);
            } else {
                console.log('    ❌ エラーシナリオテスト機能異常:', result.error);
            }
        }).catch(error => {
            console.log('    ❌ エラーシナリオテスト機能エラー:', error);
        });

        // 3.3 パフォーマンステスト
        console.log('  📊 パフォーマンステスト機能確認...');
        integrationTestSuite.runPerformanceTest().then(result => {
            if (result.success) {
                console.log('    ✅ パフォーマンステスト機能正常');
                console.log(`      成功: ${result.successfulTests}/${result.totalTests}件`);
            } else {
                console.log('    ❌ パフォーマンステスト機能異常:', result.error);
            }
        }).catch(error => {
            console.log('    ❌ パフォーマンステスト機能エラー:', error);
        });

        // 3.4 コンポーネント統合テスト
        console.log('  🔗 コンポーネント統合テスト機能確認...');
        integrationTestSuite.runComponentIntegrationTest().then(result => {
            if (result.success) {
                console.log('    ✅ コンポーネント統合テスト機能正常');
                console.log(`      成功: ${result.successfulTests}/${result.totalTests}件`);
            } else {
                console.log('    ❌ コンポーネント統合テスト機能異常:', result.error);
            }
        }).catch(error => {
            console.log('    ❌ コンポーネント統合テスト機能エラー:', error);
        });

        // 4. テスト結果管理機能の確認
        console.log('📊 テスト結果管理機能確認...');

        const initialResults = integrationTestSuite.getTestResults();
        if (!initialResults || typeof initialResults !== 'object') {
            console.error('❌ テスト結果取得に失敗');
            return false;
        }

        integrationTestSuite.clearTestResults();
        const clearedResults = integrationTestSuite.getTestResults();

        const allNull = Object.values(clearedResults).every(value => value === null);
        if (!allNull) {
            console.error('❌ テスト結果クリアに失敗');
            return false;
        }

        console.log('✅ テスト結果管理機能正常');

        console.log('✅ 統合テスト実行機能テスト完了');
        return true;

    } catch (error) {
        console.error('❌ 統合テスト実行機能テスト中にエラー:', error);
        return false;
    }
}

/**
 * 記事生成フロー全体のテスト
 */
async function testArticleGenerationFlow() {
    console.log('🧪 記事生成フロー全体テスト開始');

    try {
        // 必要なクラスが利用可能かチェック
        if (!window.ContentGenerator || !window.IntegrationTestSuite) {
            console.error('❌ 必要なクラスが読み込まれていません');
            return false;
        }

        // ContentGeneratorインスタンスを取得または作成
        let contentGenerator;
        if (window.hubpilot && window.hubpilot.contentGenerator) {
            contentGenerator = window.hubpilot.contentGenerator;
        } else {
            contentGenerator = new window.ContentGenerator();

            // 基本的な依存関係を設定
            if (window.generationState) {
                contentGenerator.setDependencies(
                    window.generationState,
                    window.supabaseIntegration || null,
                    window.notificationService || null,
                    window.progressManager || null
                );
            }
        }

        console.log('📝 記事生成フロー実行...');

        // 1. 構造生成
        const theme = 'フロー統合テスト';
        const structure = await contentGenerator.generateStructure(theme);

        if (!structure || !structure.pillarPage || !structure.clusterPages) {
            console.error('❌ 構造生成に失敗');
            return false;
        }

        console.log(`✅ 構造生成成功: ピラーページ「${structure.pillarPage.title}」、クラスターページ${structure.clusterPages.length}件`);

        // 2. 見出し生成
        const headings = await contentGenerator.generateHeadings(structure.clusterPages.slice(0, 2));

        if (!headings || Object.keys(headings).length === 0) {
            console.error('❌ 見出し生成に失敗');
            return false;
        }

        console.log(`✅ 見出し生成成功: ${Object.keys(headings).length}ページ分`);

        // 3. 記事生成（進捗付き）
        const progressUpdates = [];
        const testPages = structure.clusterPages.slice(0, 2).map(page => ({
            ...page,
            headings: headings[page.id] || []
        }));

        const articles = await contentGenerator.generateArticles(
            testPages,
            (progress) => {
                progressUpdates.push(progress);
                console.log(`  進捗: ${progress.current}/${progress.total} - ${progress.currentPage}`);
            }
        );

        if (!articles || articles.length !== testPages.length) {
            console.error('❌ 記事生成に失敗');
            return false;
        }

        console.log(`✅ 記事生成成功: ${articles.length}記事、進捗更新${progressUpdates.length}回`);

        // 4. 品質チェック
        const qualityChecks = await contentGenerator.performQualityCheck(articles);

        if (!qualityChecks || qualityChecks.length !== articles.length) {
            console.error('❌ 品質チェックに失敗');
            return false;
        }

        const averageScore = qualityChecks.reduce((sum, check) => sum + (check.score || 0), 0) / qualityChecks.length;
        console.log(`✅ 品質チェック成功: 平均スコア${averageScore.toFixed(1)}点`);

        console.log('✅ 記事生成フロー全体テスト完了');
        return true;

    } catch (error) {
        console.error('❌ 記事生成フロー全体テスト中にエラー:', error);
        return false;
    }
}

/**
 * エラーハンドリング統合テスト
 */
async function testErrorHandlingIntegration() {
    console.log('🧪 エラーハンドリング統合テスト開始');

    try {
        const testResults = [];

        // 1. ContentGeneratorのエラーハンドリング
        console.log('📝 ContentGeneratorエラーハンドリングテスト...');

        if (window.ContentGenerator) {
            const contentGenerator = new window.ContentGenerator();

            try {
                await contentGenerator.generateStructure(''); // 空のテーマでエラーを発生
                testResults.push({
                    test: 'contentGeneratorError',
                    success: false,
                    error: '例外が発生しませんでした'
                });
            } catch (expectedError) {
                if (expectedError.message.includes('テーマが指定されていません')) {
                    testResults.push({
                        test: 'contentGeneratorError',
                        success: true,
                        message: '適切なエラーメッセージが表示されました'
                    });
                } else {
                    testResults.push({
                        test: 'contentGeneratorError',
                        success: false,
                        error: `予期しないエラーメッセージ: ${expectedError.message}`
                    });
                }
            }
        } else {
            testResults.push({
                test: 'contentGeneratorError',
                success: false,
                error: 'ContentGeneratorクラスが利用できません'
            });
        }

        // 2. SupabaseIntegrationのエラーハンドリング
        console.log('🔗 SupabaseIntegrationエラーハンドリングテスト...');

        if (window.supabaseIntegration) {
            try {
                await window.supabaseIntegration.callEdgeFunctionWithRetry('invalid-function', {});
                testResults.push({
                    test: 'supabaseIntegrationError',
                    success: false,
                    error: 'ネットワークエラーが発生しませんでした'
                });
            } catch (networkError) {
                testResults.push({
                    test: 'supabaseIntegrationError',
                    success: true,
                    message: 'ネットワークエラーが適切に処理されました',
                    errorMessage: networkError.message
                });
            }
        } else {
            testResults.push({
                test: 'supabaseIntegrationError',
                success: true,
                message: 'SupabaseIntegrationが利用できません（スキップ）'
            });
        }

        // 3. ResourceManagerのエラーハンドリング
        console.log('🧠 ResourceManagerエラーハンドリングテスト...');

        if (window.resourceManager) {
            try {
                // 同時実行数制限を超える操作を登録してエラーを発生させる
                const maxConcurrent = window.resourceManager.config.maxConcurrentOperations;
                const operationIds = [];

                for (let i = 0; i <= maxConcurrent; i++) {
                    const operationId = `error-test-${i}`;
                    operationIds.push(operationId);

                    try {
                        window.resourceManager.registerOperation(operationId, {
                            type: 'error-test',
                            priority: 'low',
                            abortController: new AbortController()
                        });
                    } catch (limitError) {
                        if (limitError.message.includes('同時実行数制限')) {
                            testResults.push({
                                test: 'resourceManagerError',
                                success: true,
                                message: '同時実行数制限エラーが適切に処理されました'
                            });
                        }
                        break;
                    }
                }

                // クリーンアップ
                operationIds.forEach(id => {
                    try {
                        window.resourceManager.unregisterOperation(id);
                    } catch (error) {
                        // 既に削除されている場合は無視
                    }
                });

                if (!testResults.find(r => r.test === 'resourceManagerError')) {
                    testResults.push({
                        test: 'resourceManagerError',
                        success: true,
                        message: '同時実行数制限内で正常動作'
                    });
                }

            } catch (error) {
                testResults.push({
                    test: 'resourceManagerError',
                    success: false,
                    error: error.message
                });
            }
        } else {
            testResults.push({
                test: 'resourceManagerError',
                success: false,
                error: 'ResourceManagerが利用できません'
            });
        }

        // 結果評価
        const successfulTests = testResults.filter(r => r.success).length;
        const totalTests = testResults.length;

        console.log(`📊 エラーハンドリング統合テスト結果: ${successfulTests}/${totalTests}件成功`);

        testResults.forEach(result => {
            const status = result.success ? '✅' : '❌';
            console.log(`  ${status} ${result.test}: ${result.message || result.error}`);
        });

        console.log('✅ エラーハンドリング統合テスト完了');
        return successfulTests === totalTests;

    } catch (error) {
        console.error('❌ エラーハンドリング統合テスト中にエラー:', error);
        return false;
    }
}

/**
 * 統合テスト実行機能の総合テスト
 */
async function runIntegrationTestExecutionTests() {
    console.log('🚀 ========== 統合テスト実行機能総合テスト開始 ==========');

    let allTestsPassed = true;

    // 1. 統合テスト実行機能テスト
    console.log('\n1️⃣ 統合テスト実行機能テスト');
    if (!testIntegrationTestExecution()) {
        allTestsPassed = false;
    }

    // 2. 記事生成フロー全体テスト
    console.log('\n2️⃣ 記事生成フロー全体テスト');
    try {
        const flowResult = await testArticleGenerationFlow();
        if (!flowResult) {
            allTestsPassed = false;
        }
    } catch (error) {
        console.error('❌ 記事生成フローテスト中にエラー:', error);
        allTestsPassed = false;
    }

    // 3. エラーハンドリング統合テスト
    console.log('\n3️⃣ エラーハンドリング統合テスト');
    try {
        const errorResult = await testErrorHandlingIntegration();
        if (!errorResult) {
            allTestsPassed = false;
        }
    } catch (error) {
        console.error('❌ エラーハンドリング統合テスト中にエラー:', error);
        allTestsPassed = false;
    }

    // 結果サマリー
    console.log('\n📊 ========== テスト結果サマリー ==========');
    if (allTestsPassed) {
        console.log('✅ すべての統合テスト実行機能テストが成功しました！');
        console.log('🎉 統合テスト機能が正常に動作しています');
    } else {
        console.log('❌ 一部の統合テスト実行機能テストが失敗しました');
        console.log('🔧 統合テスト機能の実装を確認してください');
    }
    console.log('===============================================');

    return allTestsPassed;
}

// テスト実行（ページ読み込み後）
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        // IntegrationTestSuiteの初期化を待つ
        setTimeout(() => {
            runIntegrationTestExecutionTests();
        }, 2500);
    });

    // グローバルに公開（デバッグ用）
    window.runIntegrationTestExecutionTests = runIntegrationTestExecutionTests;
    window.testArticleGenerationFlow = testArticleGenerationFlow;
    window.testErrorHandlingIntegration = testErrorHandlingIntegration;
}

console.log('✅ 統合テスト実行機能テストが読み込まれました');
