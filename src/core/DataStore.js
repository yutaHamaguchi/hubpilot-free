/**
 * DataStore - データの永続化を管理するクラス
 */
class DataStore {
    constructor() {
        this.storageService = null;
        this.notificationService = null;
        this.storageKey = 'hubpilot_app_data';
    }

    /**
     * 依存関係を設定
     */
    setDependencies(storageService, notificationService) {
        this.storageService = storageService;
        this.notificationService = notificationService;
    }

    /**
     * データを保存
     * @param {Object} data - 保存するデータ
     * @returns {boolean} - 成功した場合true
     */
    save(data) {
        try {
            if (!this.storageService) {
                console.warn('StorageService is not available');
                return false;
            }

            const success = this.storageService.setJSON(this.storageKey, {
                ...data,
                lastSaved: new Date().toISOString()
            });

            if (success) {
            } else {
                console.error('Failed to save data');
            }

            return success;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    /**
     * データを読み込み
     * @returns {Object|null} - 読み込んだデータ
     */
    load() {
        try {
            if (!this.storageService) {
                console.warn('StorageService is not available');
                return null;
            }

            const data = this.storageService.getJSON(this.storageKey);

            if (data) {
                return data;
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error loading data:', error);
            return null;
        }
    }

    /**
     * データをクリア
     * @returns {boolean} - 成功した場合true
     */
    clear() {
        try {
            if (!this.storageService) {
                console.warn('StorageService is not available');
                return false;
            }

            const success = this.storageService.remove(this.storageKey);

            if (success) {
            } else {
                console.error('Failed to clear data');
            }

            return success;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    /**
     * データが存在するかチェック
     * @returns {boolean} - データが存在する場合true
     */
    exists() {
        try {
            if (!this.storageService) {
                return false;
            }

            return this.storageService.has(this.storageKey);
        } catch (error) {
            console.error('Error checking data existence:', error);
            return false;
        }
    }

    /**
     * データのサイズを取得
     * @returns {number} - データサイズ（バイト）
     */
    getSize() {
        try {
            if (!this.storageService) {
                return 0;
            }

            const data = this.storageService.get(this.storageKey);
            return data ? new Blob([data]).size : 0;
        } catch (error) {
            console.error('Error getting data size:', error);
            return 0;
        }
    }

    /**
     * バックアップを作成
     * @returns {string|null} - バックアップデータ（JSON文字列）
     */
    createBackup() {
        try {
            const data = this.load();
            if (data) {
                return JSON.stringify({
                    ...data,
                    backupCreated: new Date().toISOString()
                }, null, 2);
            }
            return null;
        } catch (error) {
            console.error('Error creating backup:', error);
            return null;
        }
    }

    /**
     * バックアップから復元
     * @param {string} backupData - バックアップデータ（JSON文字列）
     * @returns {boolean} - 成功した場合true
     */
    restoreFromBackup(backupData) {
        try {
            const data = JSON.parse(backupData);
            return this.save(data);
        } catch (error) {
            console.error('Error restoring from backup:', error);
            return false;
        }
    }
}

// グローバルに公開
if (typeof window !== 'undefined') {
    window.DataStore = DataStore;
}
