/**
 * StorageService - localStorage操作を一元管理するサービス
 */
class StorageService {
    constructor() {
        this.storage = window.localStorage;
    }

    /**
     * データを取得
     * @param {string} key - 取得するキー
     * @returns {string|null} - 取得した値
     */
    get(key) {
        try {
            return this.storage.getItem(key);
        } catch (error) {
            console.error(`Storage get error for key ${key}:`, error);
            return null;
        }
    }

    /**
     * データを保存
     * @param {string} key - 保存するキー
     * @param {string} value - 保存する値
     * @returns {boolean} - 成功した場合true
     */
    set(key, value) {
        try {
            this.storage.setItem(key, value);
            return true;
        } catch (error) {
            console.error(`Storage set error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * データを削除
     * @param {string} key - 削除するキー
     * @returns {boolean} - 成功した場合true
     */
    remove(key) {
        try {
            this.storage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Storage remove error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * すべてのデータをクリア
     * @returns {boolean} - 成功した場合true
     */
    clear() {
        try {
            this.storage.clear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }

    /**
     * JSONデータを取得
     * @param {string} key - 取得するキー
     * @param {*} defaultValue - デフォルト値
     * @returns {*} - パースされたオブジェクト
     */
    getJSON(key, defaultValue = null) {
        try {
            const value = this.get(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error(`Storage getJSON error for key ${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * JSONデータを保存
     * @param {string} key - 保存するキー
     * @param {*} value - 保存するオブジェクト
     * @returns {boolean} - 成功した場合true
     */
    setJSON(key, value) {
        try {
            const jsonString = JSON.stringify(value);
            return this.set(key, jsonString);
        } catch (error) {
            console.error(`Storage setJSON error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * ストレージの使用状況を取得
     * @returns {Object} - 使用状況の情報
     */
    getStorageUsage() {
        try {
            let totalSize = 0;
            const items = {};

            for (let i = 0; i < this.storage.length; i++) {
                const key = this.storage.key(i);
                const value = this.storage.getItem(key);
                const size = new Blob([value]).size;

                totalSize += size;
                items[key] = size;
            }

            return {
                totalSize,
                items,
                itemCount: this.storage.length,
                formattedSize: this.formatBytes(totalSize)
            };
        } catch (error) {
            console.error('Storage usage calculation error:', error);
            return {
                totalSize: 0,
                items: {},
                itemCount: 0,
                formattedSize: '0 B'
            };
        }
    }

    /**
     * バイトサイズを読みやすい形式に変換
     * @param {number} bytes - バイト数
     * @returns {string} - フォーマットされた文字列
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * キーが存在するか確認
     * @param {string} key - 確認するキー
     * @returns {boolean} - 存在する場合true
     */
    has(key) {
        return this.get(key) !== null;
    }
}

// グローバルインスタンスをエクスポート
if (typeof window !== 'undefined') {
    window.StorageService = StorageService;
}
