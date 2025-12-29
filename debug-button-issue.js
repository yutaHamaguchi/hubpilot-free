/**
 * ボタンクリック問題のデバッグスクリプト
 */

// デバッグ情報を収集
function debugButtonIssue() {
    console.log('=== ボタンクリック問題のデバッグ ===');

    // 1. DOM要素の存在確認
    const themeInput = document.getElementById('theme-input');
    const generateBtn = document.getElementById('generate-structure-btn');

    console.log('テーマ入力フィールド:', themeInput);
    console.log('生成ボタン:', generateBtn);

    if (themeInput) {
        console.log('テーマ入力値:', themeInput.value);
        console.log('テーマ入力値（トリム後）:', themeInput.value.trim());
    }

    if (generateBtn) {
        console.log('ボタンのdisabled状態:', generateBtn.disabled);
        console.log('ボタンのクラス:', generateBtn.className);
        console.log('ボタンのイベントリスナー数:', getEventListeners(generateBtn));
    }

    // 2. アプリケーションの状態確認
    console.log('window.app:', window.app);
    console.log('window.HubPilotApp:', window.HubPilotApp);

    if (window.app) {
        console.log('アプリのwizardController:', window.app.wizardController);
        console.log('アプリのデータ:', window.app.wizardController?.data);
    }

    // 3. エラーの確認
    const errors = [];
    if (!themeInput) errors.push('テーマ入力フィールドが見つかりません');
    if (!generateBtn) errors.push('生成ボタンが見つかりません');
    if (!window.app) errors.push('アプリケーションが初期化されていません');

    if (errors.length > 0) {
        console.error('発見された問題:', errors);
    } else {
        console.log('✅ 基本的な要素は正常に存在しています');
    }

    return {
        themeInput,
        generateBtn,
        app: window.app,
        errors
    };
}

// ボタンを手動で有効化する関数
function enableButton() {
    const generateBtn = document.getElementById('generate-structure-btn');
    const themeInput = document.getElementById('theme-input');

    if (generateBtn && themeInput && themeInput.value.trim()) {
        generateBtn.disabled = false;
        console.log('✅ ボタンを手動で有効化しました');
        return true;
    } else {
        console.log('❌ ボタンの有効化に失敗しました');
        return false;
    }
}

// イベントリスナーを手動で追加する関数
function addButtonEventListener() {
    const generateBtn = document.getElementById('generate-structure-btn');
    const themeInput = document.getElementById('theme-input');

    if (!generateBtn || !themeInput) {
        console.log('❌ 必要な要素が見つかりません');
        return false;
    }

    // 既存のイベントリスナーを削除（重複を避けるため）
    const newBtn = generateBtn.cloneNode(true);
    generateBtn.parentNode.replaceChild(newBtn, generateBtn);

    // 新しいイベントリスナーを追加
    newBtn.addEventListener('click', async () => {
        console.log('🚀 構成案生成ボタンがクリックされました');

        const theme = themeInput.value.trim();
        if (!theme) {
            alert('テーマを入力してください');
            return;
        }

        try {
            // ローディング状態に設定
            newBtn.disabled = true;
            newBtn.textContent = '生成中...';

            // アプリケーションが存在する場合は既存の機能を使用
            if (window.app && window.app.wizardController) {
                await window.app.wizardController.generateStructure();
            } else {
                // フォールバック: 簡単なモック生成
                console.log('アプリケーションが見つからないため、フォールバック処理を実行');
                await mockGenerateStructure(theme);
            }

        } catch (error) {
            console.error('構成案生成エラー:', error);
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

    // テーマ入力のイベントリスナーも追加
    themeInput.addEventListener('input', (e) => {
        newBtn.disabled = !e.target.value.trim();
    });

    // 初期状態を設定
    newBtn.disabled = !themeInput.value.trim();

    console.log('✅ イベントリスナーを手動で追加しました');
    return true;
}

// フォールバック用のモック生成関数
async function mockGenerateStructure(theme) {
    console.log('モック構成案を生成中...', theme);

    // 2秒待機（生成をシミュレート）
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 次のステップに移動（Step 2を表示）
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');

    if (step1 && step2) {
        step1.classList.remove('active');
        step2.classList.add('active');

        // ステップインジケーターも更新
        const steps = document.querySelectorAll('.step-item');
        if (steps.length >= 2) {
            steps[0].classList.remove('active');
            steps[0].classList.add('completed');
            steps[1].classList.add('active');
        }

        console.log('✅ Step 2に移動しました');
    }

    alert('構成案を生成しました！（モック）');
}

// 修復を試行する関数
function fixButtonIssue() {
    console.log('🔧 ボタン問題の修復を試行中...');

    const debug = debugButtonIssue();

    if (debug.errors.length === 0) {
        // 基本要素は存在するので、イベントリスナーを追加
        if (addButtonEventListener()) {
            console.log('✅ 修復完了: イベントリスナーを追加しました');
            return true;
        }
    } else {
        console.log('❌ 修復失敗: 基本要素が不足しています');
        console.log('不足している要素:', debug.errors);
    }

    return false;
}

// グローバルに公開
window.debugButtonIssue = debugButtonIssue;
window.enableButton = enableButton;
window.addButtonEventListener = addButtonEventListener;
window.fixButtonIssue = fixButtonIssue;

console.log('🛠️ デバッグスクリプトが読み込まれました');
console.log('使用可能な関数:');
console.log('- debugButtonIssue(): 現在の状態を確認');
console.log('- enableButton(): ボタンを手動で有効化');
console.log('- addButtonEventListener(): イベントリスナーを手動で追加');
console.log('- fixButtonIssue(): 自動修復を試行');
