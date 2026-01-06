/**
 * DeveloperTestSuite テスト機能の単体テスト
 * 各テスト機能の動作確認、テスト結果の検証、エラーケースのテスト
 */

/**
 * DeveloperTestSuiteの機能テスト
 */
function testDeveloperTestSuite() {
    console.log('🧪 DeveloperTestSuite機能テスト開始');

    try {
        // DeveloperTestSuiteクラスが利用可能かチェック
        if (!window.DeveloperTestSuite) {
            console.error('❌ DeveloperTestSuiteクラスが読み込まれていません');
            return false;
        }

        // 1. インスタンス作成テスト
        console.log('📝 インスタンス作成テスト...');
        const testSuite = new window.DeveloperTestSuite();

        if (!testSuite) {
            console.error('❌ DeveloperTestSuiteインスタンスの作成に失敗');
            return false;
        }

        console.log('✅ インスタンス作成成功');

        // 2. 依存関係設定テスト
        console.log('🔗 依存関係設定テスト...');

        // モック依存関係を作成
        const mockContentGenerator = {
            generateStructure: async (theme) => ({ pillarPage: { title: theme }, clusterPages: [] }),
            generateStructureMock: async (theme) => ({ pillarPage: { title: theme }, clusterPages: [{ id: '1', title: 'test' }] }),
            generateArticleMock: async (page) => ({
                id: page.id,
                title: page.title,
                content: 'テスト用コンテンツ'.repeat(50),
                wordCount: 500,
                qualityStatus: 'テスト完了'
            }),
            performQualityCheckMock: async (articles) => articles.map(a => ({
                articleId: a.id,
                title: a.title,
                score: 85,
                status: '良好',
                checks: [{ name: '文字数', status: 'OK', value: '500文字' }]
            })),
            executeProgressCallback: (callback, current, total, page) => {
                if (typeof callback === 'function') {
                    callback({ current, total, currentPage: page, progress: (current / total) * 100 });
                }
            }
        };

        const mockSupabaseIntegration = {
            isConfigured: async () => false, // モックモードをシミュレート
            generateStructure: async (theme) => ({ pillarPage: { title: theme }, clusterPages: [] }),
            generateArticle: async (params) => ({ content: 'AI生成コンテンツ', wordCount: params.targetWordCount }),
            callEdgeFunctionWithRetry: async (functionName, params) => {
                if (functionName === 'invalid-function') {
                    throw new Error('Function not found');
                }
                return { success: true };
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
                    context: context
                };
            }
        };

        testSuite.setDependencies(
            mockContentGenerator,
            mockSupabaseIntegration,
            mockProgressManager,
            mockErrorHandler
        );

        console.log('✅ 依存関係設定成功');

        // 3. 個別テスト機能の動作確認
        console.log('🔍 個別テスト機能動作確認...');

        // 3.1 記事生成テスト
        console.log('  📝 記事生成テスト機能確認...');
        testSuite.testArticleGeneration().then(result => {
            if (result.success) {
                console.log('    ✅ 記事生成テスト機能正常');
            } else {
                console.log('    ❌ 記事生成テスト機能異常:', result.error);
            }
        }).catch(error => {
            console.log('    ❌ 記事生成テスト機能エラー:', error);
        });

        // 3.2 API接続テスト
        console.log('  🔗 API接続テスト機能確認...');
        testSuite.testApiConnection().then(result => {
            if (result.success) {
                console.log('    ✅ API接続テスト機能正常');
            } else {
                console.log('    ❌ API接続テスト機能異常:', result.error);
            }
        }).catch(error => {
            console.log('    ❌ API接続テスト機能エラー:', error);
        });

        // 3.3 モック生成テスト
        console.log('  🎭 モック生成テスト機能確認...');
        testSuite.testMockGeneration().then(result => {
            if (result.success) {
                console.log('    ✅ モック生成テスト機能正常');
            } else {
                console.log('    ❌ モック生成テスト機能異常:', result.error);
            }
        }).catch(error => {
            console.log('    ❌ モック生成テスト機能エラー:', error);
        });

        // 4. テスト結果管理機能の確認
        console.log('📊 テスト結果管理機能確認...');

        const initialResults = testSuite.getTestResults();
        if (!initialResults || typeof initialResults !== 'object') {
            console.error('❌ テスト結果取得に失敗');
            return false;
        }

        testSuite.clearTestResults();
        const clearedResults = testSuite.getTestResults();

        const allNull = Object.values(clearedResults).every(value => value === null);
        if (!allNull) {
            console.error('❌ テスト結果クリアに失敗');
            return false;
        }

        console.log('✅ テスト結果管理機能正常');

        // 5. エラーケースのテスト
        console.log('⚠️ エラーケーステスト...');

        // 依存関係なしでテスト実行
        const testSuiteWithoutDeps = new window.DeveloperTestSuite();

        testSuiteWithoutDeps.testArticleGeneration().then(result => {
            if (!result.success && result.error.includes('ContentGeneratorが設定されていません')) {
                console.log('    ✅ 依存関係なしエラーハンドリング正常');
            } else {
                console.log('    ❌ 依存関係なしエラーハンドリング異常');
            }
        }).catch(error => {
            console.log('    ✅ 依存関係なしで適切に例外発生');
        });

        console.log('✅ DeveloperTestSuite機能テスト完了');
        return true;

    } catch (error) {
        console.error('❌ DeveloperTestSuite機能テスト中にエラー:', error);
        return false;
    }
}

/**
 * テスト実行コマンドの動作確認
 */
function testConsoleCommands() {
    console.log('🧪 コンソールコマンドテスト開始');

    try {
        // グローバルコマンドが利用可能かチェック
        const commands = [
            'runAllDeveloperTests',
            'runArticleGenerationTest',
            'runApiConnectionTest',
            'runMockGenerationTest',
            'runProgressManagementTest',
            'runErrorHandlingTest'
        ];

        let availableCommands = 0;

        commands.forEach(command => {
            if (typeof window[command] === 'function') {
                console.log(`✅ ${command} コマンド利用可能`);
                availableCommands++;
            } else {
                console.log(`❌ ${command} コマンド利用不可`);
            }
        });

        if (availableCommands === commands.length) {
            console.log('✅ すべてのコンソールコマンドが利用可能');
            return true;
        } else {
            console.log(`⚠️ 一部のコンソールコマンドが利用不可: ${availableCommands}/${commands.length}`);
            return false;
        }

    } catch (error) {
        console.error('❌ コンソールコマンドテスト中にエラー:', error);
        return false;
    }
}

/**
 * パフォーマンステスト
 */
function testPerformance() {
    console.log('🧪 パフォーマンステスト開始');

    try {
        if (!window.DeveloperTestSuite) {
            console.error('❌ DeveloperTestSuiteクラスが読み込まれていません');
            return false;
        }

        const testSuite = new window.DeveloperTestSuite();

        // モック依存関係を設定
        const mockContentGenerator = {
            generateStructure: async (theme) => {
                await new Promise(resolve => setTimeout(resolve, 100)); // 100ms遅延
                return { pillarPage: { title: theme }, clusterPages: [] };
            },
            executeProgressCallback: (callback, current, total, page) => {
                if (typeof callback === 'function') {
                    callback({ current, total, currentPage: page, progress: (current / total) * 100 });
                }
            }
        };

        testSuite.setDependencies(mockContentGenerator, null, null, null);

        // パフォーマンス測定
        const startTime = performance.now();

        testSuite.testArticleGeneration().then(result => {
            const endTime = performance.now();
            const duration = endTime - startTime;

            console.log(`📊 記事生成テスト実行時間: ${duration.toFixed(2)}ms`);

            if (duration < 5000) { // 5秒以内
                console.log('✅ パフォーマンステスト成功（5秒以内）');
            } else {
                console.log('⚠️ パフォーマンステスト警告（5秒超過）');
            }
        }).catch(error => {
            console.error('❌ パフォーマンステスト中にエラー:', error);
        });

        return true;

    } catch (error) {
        console.error('❌ パフォーマンステスト中にエラー:', error);
        return false;
    }
}

/**
 * 統合テスト実行
 */
function runDeveloperTestSuiteTests() {
    console.log('🚀 ========== DeveloperTestSuite統合テスト開始 ==========');

    let allTestsPassed = true;

    // 1. 基本機能テスト
    console.log('\n1️⃣ 基本機能テスト');
    if (!testDeveloperTestSuite()) {
        allTestsPassed = false;
    }

    // 2. コンソールコマンドテスト
    console.log('\n2️⃣ コンソールコマンドテスト');
    if (!testConsoleCommands()) {
        allTestsPassed = false;
    }

    // 3. パフォーマンステスト
    console.log('\n3️⃣ パフォーマンステスト');
    if (!testPerformance()) {
        allTestsPassed = false;
    }

    // 結果サマリー
    console.log('\n📊 ========== テスト結果サマリー ==========');
    if (allTestsPassed) {
        console.log('✅ すべてのDeveloperTestSuiteテストが成功しました！');
        console.log('🎉 開発者テスト機能が正常に動作しています');
    } else {
        console.log('❌ 一部のDeveloperTestSuiteテストが失敗しました');
        console.log('🔧 開発者テスト機能の実装を確認してください');
    }
    console.log('===============================================');

    return allTestsPassed;
}

// テスト実行（ページ読み込み後）
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        // DeveloperTestSuiteの初期化を待つ
        setTimeout(() => {
            runDeveloperTestSuiteTests();
        }, 2000);
    });

    // グローバルに公開（デバッグ用）
    window.runDeveloperTestSuiteTests = runDeveloperTestSuiteTests;
    window.testDeveloperTestSuite = testDeveloperTestSuite;
}

console.log('✅ DeveloperTestSuite単体テストが読み込まれました');
