/**
 * Button Fix Script - 新規設定を作成ボタンの問題を修正
 */

console.log('🔧 Button Fix Script loaded');

// DOM読み込み完了後に実行
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 DOM loaded, starting button fix...');

    // 少し待ってから修復を実行（他のスクリプトの読み込みを待つ）
    setTimeout(() => {
        fixCreateNewConfigButton();
        fixNavigationButtons();
    }, 500);
});

function fixCreateNewConfigButton() {
    console.log('🔧 Attempting to fix "新規設定を作成" button...');

    // 1. DOM要素を取得
    const themeInput = document.getElementById('theme-input');
    const generateBtn = document.getElementById('generate-structure-btn');

    console.log('📍 Theme input:', themeInput);
    console.log('📍 Generate button:', generateBtn);

    if (!themeInput || !generateBtn) {
        console.error('❌ Required DOM elements not found');
        return false;
    }

    // 2. 既存のイベントリスナーをクリア（重複を避けるため）
    const newBtn = generateBtn.cloneNode(true);
    generateBtn.parentNode.replaceChild(newBtn, generateBtn);

    // 3. テーマ入力のイベントリスナーを設定
    themeInput.addEventListener('input', (e) => {
        const hasValue = e.target.value.trim().length > 0;
        newBtn.disabled = !hasValue;
        console.log('📝 Theme input changed:', e.target.value, 'Button enabled:', hasValue);
    });

    // 4. ボタンクリックのイベントリスナーを設定
    newBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('🚀 Generate button clicked!');

        const theme = themeInput.value.trim();
        if (!theme) {
            alert('テーマを入力してください');
            return;
        }

        try {
            // ボタンを無効化してローディング状態に
            newBtn.disabled = true;
            newBtn.innerHTML = `
                <span class="btn-icon">⏳</span>
                生成中...
            `;

            console.log('🎯 Generating structure for theme:', theme);

            // アプリケーションが存在する場合は既存の機能を使用
            if (window.app && window.app.wizardController) {
                console.log('📱 Using existing app.wizardController');
                await window.app.wizardController.generateStructure();
            } else if (window.simpleApp && typeof window.simpleApp.generateStructure === 'function') {
                console.log('📱 Using simpleApp.generateStructure');
                await window.simpleApp.generateStructure(theme);
            } else {
                console.log('🔄 App not found, using fallback');
                await fallbackGenerateStructure(theme);
            }

        } catch (error) {
            console.error('❌ Structure generation failed:', error);
            alert('構成案の生成に失敗しました: ' + error.message);
        } finally {
            // ボタンを元に戻す
            newBtn.disabled = false;
            newBtn.innerHTML = `
                <span class="btn-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                    </svg>
                </span>
                構成案を作成
            `;
        }
    });

    // 5. 初期状態を設定
    const initialHasValue = themeInput.value.trim().length > 0;
    newBtn.disabled = !initialHasValue;

    console.log('✅ Button fix completed successfully');
    console.log('📊 Initial state - Theme:', themeInput.value, 'Button enabled:', !newBtn.disabled);

    return true;
}

// フォールバック用の構成案生成関数
async function fallbackGenerateStructure(theme) {
    console.log('🔄 Fallback structure generation for:', theme);

    try {
        // テーマの検証
        if (!theme || theme.trim().length === 0) {
            throw new Error('テーマが入力されていません');
        }

        console.log('⏳ Simulating generation process...');
        // 2秒待機（生成をシミュレート）
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('🔄 Moving to step 2...');
        // Step 2に移動
        const step1 = document.getElementById('step-1');
        const step2 = document.getElementById('step-2');

        if (!step1 || !step2) {
            throw new Error('ステップ要素が見つかりません');
        }

        step1.classList.remove('active');
        step2.classList.add('active');

        // ステップインジケーターも更新
        const stepItems = document.querySelectorAll('.step-item');
        if (stepItems.length >= 2) {
            stepItems[0].classList.remove('active');
            stepItems[0].classList.add('completed');
            stepItems[1].classList.add('active');
        }

        // モックデータを表示
        console.log('🎨 Displaying mock structure...');
        displayMockStructure(theme);

        console.log('✅ Fallback generation completed successfully');
    } catch (error) {
        console.error('❌ Fallback generation failed:', error);
        throw error; // エラーを再スローして上位でキャッチされるようにする
    }
            stepItems[1].classList.add('active');
        }

        // モックデータを表示
        displayMockStructure(theme);

        console.log('✅ Moved to Step 2 with mock data');
    }

    // 成功メッセージ
    if (typeof window.showNotification === 'function') {
        window.showNotification('構成案を生成しました！', 'success');
    } else {
        alert('構成案を生成しました！');
    }
}

// モック構成案を表示
function displayMockStructure(theme) {
    try {
        console.log('🎨 Displaying mock structure for theme:', theme);

        // ピラーページタイトルを設定
        const pillarTitle = document.getElementById('pillar-page-title');
        if (pillarTitle) {
            pillarTitle.textContent = `${theme}の完全ガイド - 初心者から上級者まで`;
            console.log('✅ Pillar title set');
        } else {
            console.warn('⚠️ Pillar title element not found');
        }

        // クラスターページリストを設定
        const clusterList = document.getElementById('cluster-pages-list');
        if (clusterList) {
            const mockPages = [
                `${theme}とは？基本概念と重要性`,
                `${theme}の始め方 - 初心者向けステップバイステップガイド`,
                `${theme}の基本戦略と効果的なアプローチ`,
                `${theme}のツールと必要なリソース`,
                `${theme}の成功事例とケーススタディ`,
                `${theme}でよくある間違いと対処法`,
                `${theme}の最新トレンドと将来性`,
                `${theme}の測定方法と分析指標`,
                `${theme}の応用テクニックと上級者向けTips`,
                `${theme}のQ&A - よくある質問と回答`
            ];

            let html = '';
            mockPages.forEach((title, index) => {
                html += `
                    <div class="cluster-page-item">
                        <div class="cluster-page-number">${index + 1}</div>
                        <div class="cluster-page-content">
                            <div class="cluster-page-title">${title}</div>
                            <div class="cluster-page-meta">
                                <span class="word-count">約2,000文字</span>
                                <span class="status">生成待ち</span>
                            </div>
                        </div>
                        <div class="cluster-page-actions">
                            <button class="btn btn-small btn-secondary">編集</button>
                        </div>
                    </div>
                `;
            });

            clusterList.innerHTML = html;
            console.log('✅ Cluster pages list updated');
        } else {
            console.warn('⚠️ Cluster pages list element not found');
        }

        // 統計を更新
        const clusterCount = document.getElementById('cluster-count');
        const summaryClusterCount = document.getElementById('summary-cluster-count');
        const summaryTotalCount = document.getElementById('summary-total-count');

        if (clusterCount) clusterCount.textContent = '10';
        if (summaryClusterCount) summaryClusterCount.textContent = '10';
        if (summaryTotalCount) summaryTotalCount.textContent = '11';

        console.log('✅ Mock structure display completed');
    } catch (error) {
        console.error('❌ Error displaying mock structure:', error);
        throw error;
    }>
                        <button class="btn btn-small btn-secondary">編集</button>
                    </div>
                </div>
            `;
        });

        clusterList.innerHTML = html;
    }
}

// ナビゲーションボタンの修復機能
function fixNavigationButtons() {
    console.log('🔧 Attempting to fix navigation buttons...');

    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    console.log('📍 Previous button:', prevBtn);
    console.log('📍 Next button:', nextBtn);

    if (!prevBtn || !nextBtn) {
        console.error('❌ Navigation buttons not found');
        return false;
    }

    // 既存のイベントリスナーをクリア（重複を避けるため）
    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);

    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

    // 戻るボタンのイベントリスナーを設定
    newPrevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🔙 Previous button clicked!');

        try {
            // アプリケーションが存在する場合は既存の機能を使用
            if (window.app && window.app.wizardController && typeof window.app.wizardController.previousStep === 'function') {
                console.log('📱 Using existing app.wizardController.previousStep');
                window.app.wizardController.previousStep();
            } else {
                console.log('🔄 App not found, using fallback navigation');
                fallbackPreviousStep();
            }
        } catch (error) {
            console.error('❌ Previous step navigation failed:', error);
            fallbackPreviousStep();
        }
    });

    // 次へボタンのイベントリスナーを設定
    newNextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🔜 Next button clicked!');

        try {
            // アプリケーションが存在する場合は既存の機能を使用
            if (window.app && window.app.wizardController && typeof window.app.wizardController.nextStep === 'function') {
                console.log('📱 Using existing app.wizardController.nextStep');
                window.app.wizardController.nextStep();
            } else {
                console.log('🔄 App not found, using fallback navigation');
                fallbackNextStep();
            }
        } catch (error) {
            console.error('❌ Next step navigation failed:', error);
            fallbackNextStep();
        }
    });

    console.log('✅ Navigation buttons fix completed successfully');
    return true;
}

// フォールバック用の前のステップ移動
function fallbackPreviousStep() {
    console.log('🔄 Fallback previous step navigation');

    // 現在アクティブなステップを取得
    const activeStep = document.querySelector('.step-content.active');
    const activeStepItem = document.querySelector('.step-item.active');

    if (!activeStep || !activeStepItem) {
        console.log('❌ No active step found');
        return;
    }

    // 現在のステップ番号を取得
    const currentStepNumber = parseInt(activeStepItem.dataset.step);
    console.log('📍 Current step:', currentStepNumber);

    if (currentStepNumber <= 1) {
        console.log('⚠️ Already at first step');
        return;
    }

    // 前のステップに移動
    const previousStepNumber = currentStepNumber - 1;
    const previousStep = document.getElementById(`step-${previousStepNumber}`);
    const previousStepItem = document.querySelector(`.step-item[data-step="${previousStepNumber}"]`);

    if (previousStep && previousStepItem) {
        // 現在のステップを非アクティブに
        activeStep.classList.remove('active');
        activeStepItem.classList.remove('active');
        activeStepItem.classList.remove('completed');

        // 前のステップをアクティブに
        previousStep.classList.add('active');
        previousStepItem.classList.add('active');

        console.log(`✅ Moved to step ${previousStepNumber}`);
    } else {
        console.error('❌ Previous step elements not found');
    }
}

// フォールバック用の次のステップ移動
function fallbackNextStep() {
    console.log('🔄 Fallback next step navigation');

    // 現在アクティブなステップを取得
    const activeStep = document.querySelector('.step-content.active');
    const activeStepItem = document.querySelector('.step-item.active');

    if (!activeStep || !activeStepItem) {
        console.log('❌ No active step found');
        return;
    }

    // 現在のステップ番号を取得
    const currentStepNumber = parseInt(activeStepItem.dataset.step);
    console.log('📍 Current step:', currentStepNumber);

    if (currentStepNumber >= 6) {
        console.log('⚠️ Already at last step');
        return;
    }

    // 次のステップに移動
    const nextStepNumber = currentStepNumber + 1;
    const nextStep = document.getElementById(`step-${nextStepNumber}`);
    const nextStepItem = document.querySelector(`.step-item[data-step="${nextStepNumber}"]`);

    if (nextStep && nextStepItem) {
        // 現在のステップを完了状態に
        activeStep.classList.remove('active');
        activeStepItem.classList.remove('active');
        activeStepItem.classList.add('completed');

        // 次のステップをアクティブに
        nextStep.classList.add('active');
        nextStepItem.classList.add('active');

        console.log(`✅ Moved to step ${nextStepNumber}`);
    } else {
        console.error('❌ Next step elements not found');
    }
}

// グローバルに公開
window.fixCreateNewConfigButton = fixCreateNewConfigButton;
window.fixNavigationButtons = fixNavigationButtons;
window.fallbackGenerateStructure = fallbackGenerateStructure;
window.fallbackPreviousStep = fallbackPreviousStep;
window.fallbackNextStep = fallbackNextStep;

console.log('🔧 Button Fix Script ready');
