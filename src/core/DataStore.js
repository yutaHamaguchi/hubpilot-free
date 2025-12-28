/**
 * DataStore - アプリケーションデータの管理を担当するクラス
 */
class DataStore {
    constructor(storageService) {
        this.storageService = storageService;
        this.storageKey = 'hubpilot-data';
        this.backupKey = 'hubpilot-backups';
        this.maxBackups = 5;

        // デフォルトのデータ構造
        this.defaultData = {
            currentStep: 1,
            theme: '',
            clusterPages: [],
            headings: [],
            articles: [],
            seoAnalysis: [],
            qualityChecks: [],
            images: []
        };

        this.data = { ...this.defaultData };
        this.unsavedChanges = false;
    }

    /**
     * データを初期化
     */
    initialize() {
        this.data = { ...this.defaultData };
        this.unsavedChanges = false;
    }

    /**
     * データをロード
     * @returns {Object} - ロードされたデータ
     */
    load() {
        try {
            const saved = this.storageService.getJSON(this.storageKey);

            if (saved) {
                this.data = { ...this.defaultData, ...saved };
                this.unsavedChanges = false;
                return this.data;
            }

            return this.data;
        } catch (error) {
            console.error('データのロードに失敗しました:', error);
            return this.data;
        }
    }

    /**
     * データを保存
     * @returns {boolean} - 成功した場合true
     */
    save() {
        try {
            const success = this.storageService.setJSON(this.storageKey, this.data);

            if (success) {
                this.unsavedChanges = false;
                this.createBackup();
            }

            return success;
        } catch (error) {
            console.error('データの保存に失敗しました:', error);
            return false;
        }
    }

    /**
     * データを取得
     * @returns {Object} - 現在のデータ
     */
    getData() {
        return { ...this.data };
    }

    /**
     * データを更新
     * @param {Object} updates - 更新するデータ
     */
    updateData(updates) {
        this.data = { ...this.data, ...updates };
        this.unsavedChanges = true;
    }

    /**
     * 特定のフィールドを更新
     * @param {string} field - フィールド名
     * @param {*} value - 新しい値
     */
    setField(field, value) {
        this.data[field] = value;
        this.unsavedChanges = true;
    }

    /**
     * 特定のフィールドを取得
     * @param {string} field - フィールド名
     * @returns {*} - フィールドの値
     */
    getField(field) {
        return this.data[field];
    }

    /**
     * バックアップを作成
     */
    createBackup() {
        try {
            const backups = this.storageService.getJSON(this.backupKey, []);

            const newBackup = {
                timestamp: new Date().toISOString(),
                data: { ...this.data }
            };

            backups.unshift(newBackup);

            // 最大数を超えたら古いバックアップを削除
            if (backups.length > this.maxBackups) {
                backups.splice(this.maxBackups);
            }

            this.storageService.setJSON(this.backupKey, backups);
        } catch (error) {
            console.error('バックアップの作成に失敗しました:', error);
        }
    }

    /**
     * バックアップ一覧を取得
     * @returns {Array} - バックアップの配列
     */
    getBackups() {
        return this.storageService.getJSON(this.backupKey, []);
    }

    /**
     * バックアップから復元
     * @param {number} index - バックアップのインデックス
     * @returns {boolean} - 成功した場合true
     */
    restoreFromBackup(index) {
        try {
            const backups = this.getBackups();

            if (index >= 0 && index < backups.length) {
                this.data = { ...this.defaultData, ...backups[index].data };
                this.save();
                return true;
            }

            return false;
        } catch (error) {
            console.error('バックアップからの復元に失敗しました:', error);
            return false;
        }
    }

    /**
     * バックアップを削除
     * @param {number} index - 削除するバックアップのインデックス
     * @returns {boolean} - 成功した場合true
     */
    deleteBackup(index) {
        try {
            const backups = this.getBackups();

            if (index >= 0 && index < backups.length) {
                backups.splice(index, 1);
                this.storageService.setJSON(this.backupKey, backups);
                return true;
            }

            return false;
        } catch (error) {
            console.error('バックアップの削除に失敗しました:', error);
            return false;
        }
    }

    /**
     * すべてのバックアップを削除
     * @returns {boolean} - 成功した場合true
     */
    clearAllBackups() {
        return this.storageService.setJSON(this.backupKey, []);
    }

    /**
     * データをエクスポート（JSON文字列として）
     * @returns {string} - JSON文字列
     */
    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    /**
     * データをインポート
     * @param {string} jsonString - インポートするJSON文字列
     * @returns {boolean} - 成功した場合true
     */
    importData(jsonString) {
        try {
            const importedData = JSON.parse(jsonString);
            this.data = { ...this.defaultData, ...importedData };
            this.save();
            return true;
        } catch (error) {
            console.error('データのインポートに失敗しました:', error);
            return false;
        }
    }

    /**
     * すべてのデータをクリア
     */
    clearAll() {
        this.data = { ...this.defaultData };
        this.save();
        this.clearAllBackups();
    }

    /**
     * 未保存の変更があるかチェック
     * @returns {boolean} - 未保存の変更がある場合true
     */
    hasUnsavedChanges() {
        return this.unsavedChanges;
    }

    /**
     * ストレージ使用状況を取得
     * @returns {Object} - 使用状況の情報
     */
    getStorageInfo() {
        return this.storageService.getStorageUsage();
    }
}

// グローバルインスタンスをエクスポート
if (typeof window !== 'undefined') {
    window.DataStore = DataStore;
}
