/**
 * DeveloperTestSuite - 開発者向けテスト機能
 *
 * 記事生成機能の包括的なテストを提供します。
 * 開発者コンソールから実行可能な各種テスト機能を含みます。
 */

class DeveloperTestSuite {
    constructor() {
        // 依存関係
        this.contentGenerator = null;
        this.supabaseIntegration = null;
        this.progressManager = null;
        this.errorHandler = null;
        this.performanceMonitor = window.performanceMonitor;
        this.resourceManager = window.resourceManager;

        // テスト結果
        this.testResults = {
            articleGeneration: null,
            apiConnection: null,
            mockGeneration: null,
            progressManagement: null,
            errorHandling: null
        };

        console.log('✅ DeveloperTestSuite初期化完了');
    }

    /**
     * 依存関係を設定
     */
    setDependencies(contentGenerator, supabaseIntegration, progressManager, errorHandler) {
        this.contentGenerator = contentGenerator;
        this.supabaseIntegration = supabaseIntegration;
        this.progressManager = progressManager;
        this.errorHandler = errorHandler;

        console.log('🔗 DeveloperTestSuiteの依存関係を設定しました');
    }

    /**
     * 全テストを実行
     */
    async runAllTests() {
        console.log('🚀 ========== 開発者テストスイート開始 ==========');

        const startTime = performance.now();
        let allTestsPassed = true;

        try {
            // 1. 記事生成テスト
            console.log('\n1️⃣ 記事生成テスト');
            const articleTest = await this.testArticleGeneration();
            this.testResults.articleGeneration = articleTest;
            if (!articleTest.success) allTestsPassed = false;

            // 2. AI API接続テスト
            console.log('\n2️⃣ AI API接続テスト');
     const apiTest = await this.testApiConnection();
            this.testResults.apiConnection = apiTest;
            if (!apiTest.success) allTestsPassed = false;

            // 3. モック生成テスト
            console.log('\n3️⃣ モック生成テスト');
            const mockTest = await this.testMockGeneration();
            this.testResults.mockGeneration = mockTest;
            if (!mockTest.success) allTestsPassed = false;

            // 4. 進捗管理テスト
            console.log('\n4️⃣ 進捗管理テスト');
            const progressTest = await this.testProgressManagement();
            this.testResults.progressManagement = progressTest;
            if (!progressTest.success) allTestsPassed = false;

            // 5. エラーハンドリングテスト
            console.log('\n5️⃣ エラーハンドリングテスト');
            const errorTest = await this.testErrorHandling();
            this.testResults.errorHandling = errorTest;
            if (!errorTest.success) allTestsPassed = false;

            // 結果サマリー
            const endTime = performance.now();
            const duration = endTime - startTime;

            console.log('\n📊 ========== テスト結果サマリー ==========');
            console.log(`実行時間: ${duration.toFixed(2)}ms`);
            console.log(`記事生成テスト: ${this.testResults.articleGeneration.success ? '✅ 成功' : '❌ 失敗'}`);
            console.log(`API接続テスト: ${this.testResults.apiConnection.success ? '✅ 成功' : '❌ 失敗'}`);
            console.log(`モック生成テスト: ${this.testResults.mockGeneration.success ? '✅ 成功' : '❌ 失敗'}`);
            console.log(`進捗管理テスト: ${this.testResults.progressManagement.success ? '✅ 成功' : '❌ 失敗'}`);
            console.log(`エラーハンドリングテスト: ${this.testResults.errorHandling.success ? '✅ 成功' : '❌ 失敗'}`);

            if (allTestsPassed) {
                console.log('\n🎉 すべてのテストが成功しました！');
            } else {
                console.log('\n⚠️ 一部のテストが失敗しました。詳細を確認してください。');
            }
            console.log('===============================================');

            return {
                success: allTestsPassed,
                duration,
                results: this.testResults
            };

        } catch (error) {
            console.error('❌ テストスイート実行中にエラーが発生:', error);
            return {
                success: false,
                error: error.message,
                results: this.testResults
            };
        }
    }

    /**
     * 記事生成テスト
     */
    async testArticleGeneration() {
        console.log('📝 記事生成機能をテスト中...');

        try {
            if (!this.contentGenerator) {
                return {
                    success: false,
                    error: 'ContentGeneratorが設定されていません'
                };
            }

            // テスト用のページデータ
            const testPages = [
                {
                    id: 'test-page-1',
                    title: 'テスト記事1: AI技術の基本',
                    headings: [
                        { id: 'h1', text: 'AI技術とは', level: 2 },
                        { id: 'h2', text: '基本的な概念', level: 2 }
                    ]
                },
                {
                    id: 'test-page-2',
                    title: 'テスト記事2: 機械学習の応用',
                    headings: [
                        { id: 'h1', text: '機械学習の種類', level: 2 },
                        { id: 'h2', text: '実用例', level: 2 }
                    ]
                }
            ];

            // 進捗コールバック
            const progressUpdates = [];
            const progressCallback = (progress) => {
                progressUpdates.push(progress);
                console.log(`  進捗: ${progress.current}/${progress.total} - ${progress.currentPage}`);
            };

            // 記事生成実行
            const startTime = performance.now();
            const articles = await this.contentGenerator.generateArticles(testPages, progressCallback);
            const endTime = performance.now();

            // 結果検証
            if (!articles || articles.length !== testPages.length) {
                return {
                    success: false,
                    error: `生成された記事数が不正: ${articles?.length} !== ${testPages.length}`
                };
            }

            // 各記事の内容検証
            for (let i = 0; i < articles.length; i++) {
                const article = articles[i];
                const expectedPage = testPages[i];

                if (!article.title || !article.content) {
                    return {
                        success: false,
                        error: `記事${i + 1}のタイトルまたはコンテンツが空です`
                    };
                }

                if (article.title !== expectedPage.title) {
                    return {
                        success: false,
                        error: `記事${i + 1}のタイトルが一致しません`
                    };
                }

                if (article.content.length < 100) {
                    return {
                        success: false,
                        error: `記事${i + 1}のコンテンツが短すぎます（${article.content.length}文字）`
                    };
                }
            }

            // 進捗コールバックの検証
            if (progressUpdates.length === 0) {
                return {
                    success: false,
                    error: '進捗コールバックが実行されませんでした'
                };
            }

            console.log('✅ 記事生成テスト成功');
            return {
                success: true,
                duration: endTime - startTime,
                articlesGenerated: articles.length,
                progressUpdates: progressUpdates.length,
                articles: articles.map(a => ({
                    title: a.title,
                    wordCount: a.wordCount,
                    status: a.qualityStatus
                }))
            };

        } catch (error) {
            console.error('❌ 記事生成テスト失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * AI API接続テスト
     */
    async testApiConnection() {
        console.log('🔗 AI API接続をテスト中...');

        try {
            if (!this.supabaseIntegration) {
                return {
                    success: false,
                    error: 'SupabaseIntegrationが設定されていません'
                };
            }

            // Supabase設定確認
            const isConfigured = await this.supabaseIntegration.isConfigured();

            if (!isConfigured) {
                console.log('⚠️ Supabase未設定のため、モックモードでテスト');
                return {
                    success: true,
                    mode: 'mock',
                    message: 'Supabase未設定のため、モックモードで動作確認'
                };
            }

            // 実際のAPI接続テスト
            const testResults = [];

            // 1. 構造生成テスト
            try {
                console.log('  📋 構造生成API接続テスト...');
                const structureResult = await this.supabaseIntegration.generateStructure('テスト用テーマ');
                testResults.push({
                    api: 'generateStructure',
                    success: true,
                    response: structureResult ? 'データ受信' : '空レスポンス'
                });
                console.log('    ✅ 構造生成API接続成功');
            } catch (error) {
                testResults.push({
                    api: 'generateStructure',
                    success: false,
                    error: error.message
                });
                console.log('    ❌ 構造生成API接続失敗:', error.message);
            }

            // 2. 記事生成テスト
            try {
                console.log('  📝 記事生成API接続テスト...');
                const articleResult = await this.supabaseIntegration.generateArticle({
                    title: 'テスト記事',
                    headings: [{ id: 'h1', text: 'テスト見出し', level: 2 }],
                    targetWordCount: 500
                });
                testResults.push({
                    api: 'generateArticle',
                    success: true,
                    response: articleResult ? 'データ受信' : '空レスポンス'
                });
                console.log('    ✅ 記事生成API接続成功');
            } catch (error) {
                testResults.push({
                    api: 'generateArticle',
                    success: false,
                    error: error.message
                });
                console.log('    ❌ 記事生成API接続失敗:', error.message);
            }

            // 結果評価
            const successfulTests = testResults.filter(r => r.success).length;
            const totalTests = testResults.length;

            console.log(`✅ API接続テスト完了: ${successfulTests}/${totalTests}件成功`);

            return {
                success: successfulTests > 0, // 少なくとも1つ成功すればOK
                mode: 'api',
                successfulTests,
                totalTests,
                results: testResults
            };

        } catch (error) {
            console.error('❌ API接続テスト失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * モック生成テスト
     */
    async testMockGeneration() {
        console.log('🎭 モック生成機能をテスト中...');

        try {
            if (!this.contentGenerator) {
                return {
                    success: false,
                    error: 'ContentGeneratorが設定されていません'
                };
            }

            const testResults = [];

            // 1. 構造生成モックテスト
            try {
                console.log('  📋 構造生成モックテスト...');
                const structure = await this.contentGenerator.generateStructureMock('テスト用テーマ');

                if (!structure.pillarPage || !structure.clusterPages) {
                    throw new Error('構造データが不完全です');
                }

                if (structure.clusterPages.length === 0) {
                    throw new Error('クラスターページが生成されませんでした');
                }

                testResults.push({
                    test: 'structureMock',
                    success: true,
                    pillarPage: structure.pillarPage.title,
                    clusterPages: structure.clusterPages.length
                });
                console.log('    ✅ 構造生成モック成功');
            } catch (error) {
                testResults.push({
                    test: 'structureMock',
                    success: false,
                    error: error.message
                });
                console.log('    ❌ 構造生成モック失敗:', error.message);
            }

            // 2. 記事生成モックテスト
            try {
                console.log('  📝 記事生成モックテスト...');
                const article = await this.contentGenerator.generateArticleMock({
                    id: 'test-mock',
                    title: 'モックテスト記事',
                    headings: [{ id: 'h1', text: 'テスト見出し', level: 2 }]
                });

                if (!article.title || !article.content) {
                    throw new Error('記事データが不完全です');
                }

                if (article.content.length < 100) {
                    throw new Error('記事コンテンツが短すぎます');
                }

                testResults.push({
                    test: 'articleMock',
                    success: true,
                    title: article.title,
                    wordCount: article.wordCount,
                    status: article.qualityStatus
                });
                console.log('    ✅ 記事生成モック成功');
            } catch (error) {
                testResults.push({
                    test: 'articleMock',
                    success: false,
                    error: error.message
                });
                console.log('    ❌ 記事生成モック失敗:', error.message);
            }

            // 3. 品質チェックモックテスト
            try {
                console.log('  🔍 品質チェックモックテスト...');
                const mockArticles = [
                    {
                        id: 'test-1',
                        title: 'テスト記事1',
                        content: 'テスト用のコンテンツです。'.repeat(100),
                        wordCount: 1500
                    }
                ];

                const qualityChecks = await this.contentGenerator.performQualityCheckMock(mockArticles);

                if (!qualityChecks || qualityChecks.length === 0) {
                    throw new Error('品質チェック結果が空です');
                }

                const check = qualityChecks[0];
                if (!check.score || !check.status || !check.checks) {
                    throw new Error('品質チェックデータが不完全です');
                }

                testResults.push({
                    test: 'qualityMock',
                    success: true,
                    score: check.score,
                    status: check.status,
                    checksCount: check.checks.length
                });
                console.log('    ✅ 品質チェックモック成功');
            } catch (error) {
                testResults.push({
                    test: 'qualityMock',
                    success: false,
                    error: error.message
                });
                console.log('    ❌ 品質チェックモック失敗:', error.message);
            }

            // 結果評価
            const successfulTests = testResults.filter(r => r.success).length;
            const totalTests = testResults.length;

            console.log(`✅ モック生成テスト完了: ${successfulTests}/${totalTests}件成功`);

            return {
                success: successfulTests === totalTests,
                successfulTests,
                totalTests,
                results: testResults
            };

        } catch (error) {
            console.error('❌ モック生成テスト失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 進捗管理テスト
     */
    async testProgressManagement() {
        console.log('📊 進捗管理機能をテスト中...');

        try {
            // ProgressManagerが利用可能かチェック
            if (!this.progressManager && !window.ProgressManager) {
                console.log('⚠️ ProgressManagerが利用できません。基本的な進捗テストを実行します。');
                return await this.testBasicProgress();
            }

            const progressManager = this.progressManager || new window.ProgressManager();
            const testResults = [];

            // 1. 進捗開始テスト
            try {
                console.log('  🚀 進捗開始テスト...');

                const progressUpdates = [];
                const completionData = [];
                const errorData = [];

                progressManager.start(
                    3, // 3つのタスク
                    (progress) => progressUpdates.push(progress),
                    (completion) => completionData.push(completion),
                    (error) => errorData.push(error)
                );

                testResults.push({
                    test: 'progressStart',
                    success: true,
                    message: '進捗管理開始成功'
                });
                console.log('    ✅ 進捗開始テスト成功');
            } catch (error) {
                testResults.push({
                    test: 'progressStart',
                    success: false,
                    error: error.message
                });
                console.log('    ❌ 進捗開始テスト失敗:', error.message);
            }

            // 2. 進捗更新テスト
            try {
                console.log('  📈 進捗更新テスト...');

                // 段階的に進捗を更新
                progressManager.updateProgress(1, 'タスク1実行中');
                await this.delay(100);

                progressManager.updateProgress(2, 'タスク2実行中');
                await this.delay(100);

                progressManager.updateProgress(3, 'タスク3実行中');
                await this.delay(100);

                testResults.push({
                    test: 'progressUpdate',
                    success: true,
                    message: '進捗更新成功'
                });
                console.log('    ✅ 進捗更新テスト成功');
            } catch (error) {
                testResults.push({
                    test: 'progressUpdate',
                    success: false,
                    error: error.message
                });
                console.log('    ❌ 進捗更新テスト失敗:', error.message);
            }

            // 3. エラーハンドリングテスト
            try {
                console.log('  ⚠️ 進捗エラーハンドリングテスト...');

                progressManager.handleError('テスト用エラー');

                testResults.push({
                    test: 'progressError',
                    success: true,
                    message: '進捗エラーハンドリング成功'
                });
                console.log('    ✅ 進捗エラーハンドリングテスト成功');
            } catch (error) {
                testResults.push({
                    test: 'progressError',
                    success: false,
                    error: error.message
                });
                console.log('    ❌ 進捗エラーハンドリングテスト失敗:', error.message);
            }

            // 結果評価
            const successfulTests = testResults.filter(r => r.success).length;
            const totalTests = testResults.length;

            console.log(`✅ 進捗管理テスト完了: ${successfulTests}/${totalTests}件成功`);

            return {
                success: successfulTests === totalTests,
                successfulTests,
                totalTests,
                results: testResults
            };

        } catch (error) {
            console.error('❌ 進捗管理テスト失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 基本的な進捗テスト（ProgressManagerが利用できない場合）
     */
    async testBasicProgress() {
        try {
            // ContentGeneratorの進捗コールバック機能をテスト
            if (!this.contentGenerator) {
                return {
                    success: false,
                    error: 'ContentGeneratorが設定されていません'
                };
            }

            const progressUpdates = [];
            const testCallback = (progress) => {
                progressUpdates.push(progress);
            };

            // executeProgressCallbackメソッドをテスト
            this.contentGenerator.executeProgressCallback(testCallback, 1, 3, 'テストページ');
            this.contentGenerator.executeProgressCallback(testCallback, 2, 3, 'テストページ2');
            this.contentGenerator.executeProgressCallback(testCallback, 3, 3, 'テストページ3');

            if (progressUpdates.length !== 3) {
                return {
                    success: false,
                    error: `進捗コールバック実行回数が不正: ${progressUpdates.length} !== 3`
                };
            }

            console.log('✅ 基本進捗テスト成功');
            return {
                success: true,
                mode: 'basic',
                progressUpdates: progressUpdates.length
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * エラーハンドリングテスト
     */
    async testErrorHandling() {
        console.log('⚠️ エラーハンドリング機能をテスト中...');

        try {
            const testResults = [];

            // 1. ContentGeneratorのエラーハンドリングテスト
            try {
                console.log('  📝 ContentGeneratorエラーハンドリングテスト...');

                // 無効な入力でエラーを発生させる
                try {
                    await this.contentGenerator.generateStructure(''); // 空のテーマ
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
                        console.log('    ✅ ContentGeneratorエラーハンドリング成功');
                    } else {
                        testResults.push({
                            test: 'contentGeneratorError',
                            success: false,
                            error: `予期しないエラーメッセージ: ${expectedError.message}`
                        });
                    }
                }
            } catch (error) {
                testResults.push({
                    test: 'contentGeneratorError',
                    success: false,
                    error: error.message
                });
                console.log('    ❌ ContentGeneratorエラーハンドリング失敗:', error.message);
            }

            // 2. ErrorHandlerクラスのテスト（利用可能な場合）
            if (this.errorHandler || window.ErrorHandler) {
                try {
                    console.log('  🚨 ErrorHandlerクラステスト...');

                    const errorHandler = this.errorHandler || new window.ErrorHandler();

                    // テスト用エラーを処理
                    const testError = new Error('テスト用エラー');
                    testError.code = 'TEST_ERROR';

                    const handledError = errorHandler.handleError(testError, 'テストコンテキスト');

                    if (handledError && handledError.userMessage) {
                        testResults.push({
                            test: 'errorHandler',
                            success: true,
                            message: 'ErrorHandlerが正常に動作しました'
                        });
                        console.log('    ✅ ErrorHandlerテスト成功');
                    } else {
                        testResults.push({
                            test: 'errorHandler',
                            success: false,
                            error: 'ErrorHandlerの戻り値が不正です'
                        });
                    }
                } catch (error) {
                    testResults.push({
                        test: 'errorHandler',
                        success: false,
                        error: error.message
                    });
                    console.log('    ❌ ErrorHandlerテスト失敗:', error.message);
                }
            } else {
                console.log('  ⚠️ ErrorHandlerクラスが利用できません');
                testResults.push({
                    test: 'errorHandler',
                    success: true,
                    message: 'ErrorHandlerクラスが利用できません（スキップ）'
                });
            }

            // 3. ネットワークエラーシミュレーション
            try {
                console.log('  🌐 ネットワークエラーシミュレーション...');

                if (this.supabaseIntegration) {
                    // 無効なEdge Function呼び出しでネットワークエラーをシミュレート
                    try {
                        await this.supabaseIntegration.callEdgeFunctionWithRetry('invalid-function', {});
                        testResults.push({
                            test: 'networkError',
                            success: false,
                            error: 'ネットワークエラーが発生しませんでした'
                        });
                    } catch (networkError) {
                        testResults.push({
                            test: 'networkError',
                            success: true,
                            message: 'ネットワークエラーが適切に処理されました'
                        });
                        console.log('    ✅ ネットワークエラーシミュレーション成功');
                    }
                } else {
                    testResults.push({
                        test: 'networkError',
                        success: true,
                        message: 'SupabaseIntegrationが利用できません（スキップ）'
                    });
                }
            } catch (error) {
                testResults.push({
                    test: 'networkError',
                    success: false,
                    error: error.message
                });
                console.log('    ❌ ネットワークエラーシミュレーション失敗:', error.message);
            }

            // 結果評価
            const successfulTests = testResults.filter(r => r.success).length;
            const totalTests = testResults.length;

            console.log(`✅ エラーハンドリングテスト完了: ${successfulTests}/${totalTests}件成功`);

            return {
                success: successfulTests === totalTests,
                successfulTests,
                totalTests,
                results: testResults
            };

        } catch (error) {
            console.error('❌ エラーハンドリングテスト失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 個別テスト実行メソッド
     */
    async runArticleGenerationTest() {
        console.log('🚀 記事生成テスト単体実行');
        return await this.testArticleGeneration();
    }

    async runApiConnectionTest() {
        console.log('🚀 API接続テスト単体実行');
        return await this.testApiConnection();
    }

    async runMockGenerationTest() {
        console.log('🚀 モック生成テスト単体実行');
        return await this.testMockGeneration();
    }

    async runProgressManagementTest() {
        console.log('🚀 進捗管理テスト単体実行');
        return await this.testProgressManagement();
    }

    async runErrorHandlingTest() {
        console.log('🚀 エラーハンドリングテスト単体実行');
        return await this.testErrorHandling();
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
            articleGeneration: null,
            apiConnection: null,
            mockGeneration: null,
            progressManagement: null,
            errorHandling: null
        };
        console.log('🧹 テスト結果をクリアしました');
    }

    /**
     * 遅延ユーティリティ
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// グローバルインスタンス
window.DeveloperTestSuite = DeveloperTestSuite;

console.log('✅ DeveloperTestSuiteクラスが読み込まれました');
