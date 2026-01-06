/**
 * データ検証クラス
 * 統一されたデータ形式の定義と検証機能を提供
 *
 * 機能:
 * - 記事生成リクエスト/レスポンス形式の統一
 * - 進捗更新データ形式の統一
 * - エラー情報形式の統一
 * - 入力データの検証
 * - 出力データの検証
 * - データ変換機能
 *
 * 要件: 7.1, 7.2, 7.3, 7.4, 7.5
 */
class DataValidator {
    constructor() {
        // データ形式定義
        this.schemas = {
            // 記事生成リクエスト形式
            articleGenerationRequest: {
                title: { type: 'string', required: true, minLength: 1, maxLength: 200 },
                headings: {
                    type: 'array',
                    required: false,
                    items: {
                        text: { type: 'string', required: true, minLength: 1, maxLength: 100 },
                        level: { type: 'number', required: true, min: 1, max: 6 },
                        id: { type: 'string', required: false }
                    }
                },
                targetWordCount: { type: 'number', required: false, min: 500, max: 10000, default: 2000 },
                settings: {
                    type: 'object',
                    required: false,
                    properties: {
                        tone: { type: 'string', required: false, enum: ['です・ます調', 'である調', 'カジュアル'] },
                        targetAudience: { type: 'string', required: false, enum: ['一般ユーザー', '専門家', '初心者'] },
                        keywords: { type: 'array', required: false, items: { type: 'string' } }
                    }
                }
            },

            // 記事生成レスポンス形式
            articleGenerationResponse: {
                success: { type: 'boolean', required: true },
                data: {
                    type: 'object',
                    required: true,
                    when: { success: true },
                    properties: {
                        title: { type: 'string', required: true },
                        content: { type: 'equired: true, minLength: 100 },
                        headings: { type: 'array', required: false },
                        wordCount: { type: 'number', required: false, min: 0 },
                        seoScore: { type: 'number', required: false, min: 0, max: 100 },
                        generatedAt: { type: 'string', required: true, format: 'iso-date' }
                    }
                },
                error: {
                    type: 'string',
                    required: true,
                    when: { success: false }
                },
                errorCode: {
                    type: 'string',
                    required: true,
                    when: { success: false }
                },
                timestamp: { type: 'string', required: true, format: 'iso-date' }
            },

            // 進捗更新データ形式
            progressUpdate: {
                completed: { type: 'number', required: true, min: 0 },
                total: { type: 'number', required: true, min: 0 },
                percentage: { type: 'number', required: true, min: 0, max: 100 },
                currentTitle: { type: 'string', required: false, maxLength: 200 },
                estimatedTimeRemaining: { type: 'number', required: false, min: 0 },
                status: {
                    type: 'string',
                    required: false,
                    enum: ['starting', 'generating', 'completed', 'error']
                }
            },

            // エラー情報形式
            errorInfo: {
                code: { type: 'string', required: true },
                message: { type: 'string', required: true },
                originalMessage: { type: 'string', required: false },
                context: { type: 'string', required: false },
                timestamp: { type: 'string', required: true, format: 'iso-date' },
                stack: { type: 'string', required: false }
            },

            // 構成生成リクエスト形式
            structureGenerationRequest: {
                theme: { type: 'string', required: true, minLength: 1, maxLength: 100 },
                targetPages: { type: 'number', required: false, min: 3, max: 10, default: 5 },
                keywords: { type: 'array', required: false, items: { type: 'string' } }
            },

            // 構成生成レスポンス形式
            structureGenerationResponse: {
                success: { type: 'boolean', required: true },
                data: {
                    type: 'object',
                    required: true,
                    when: { success: true },
                    properties: {
                        pillarPage: {
                            type: 'object',
                            required: true,
                            properties: {
                                title: { type: 'string', required: true },
                                description: { type: 'string', required: false }
                            }
                        },
                        clusterPages: {
                            type: 'array',
                            required: true,
                            minItems: 1,
                            items: {
                                id: { type: 'string', required: true },
                                title: { type: 'string', required: true },
                                description: { type: 'string', required: false },
                                keywords: { type: 'array', required: false, items: { type: 'string' } }
                            }
                        }
                    }
                },
                error: { type: 'string', required: true, when: { success: false } },
                errorCode: { type: 'string', required: true, when: { success: false } },
                timestamp: { type: 'string', required: true, format: 'iso-date' }
            }
        };

        // バリデーションエラーメッセージ
        this.errorMessages = {
            required: 'は必須項目です',
            type: 'の型が正しくありません',
            minLength: 'は{min}文字以上である必要があります',
            maxLength: 'は{max}文字以下である必要があります',
            min: 'は{min}以上である必要があります',
            max: 'は{max}以下である必要があります',
            enum: 'は有効な値ではありません。有効な値: {values}',
            format: 'の形式が正しくありません',
            minItems: 'は最低{min}個の項目が必要です',
            maxItems: 'は最大{max}個までの項目が許可されています'
        };
    }

    /**
     * データを検証
     * @param {*} data - 検証するデータ
     * @param {string} schemaName - スキーマ名
     * @returns {Object} 検証結果
     */
    validate(data, schemaName) {
        try {
            const schema = this.schemas[schemaName];
            if (!schema) {
                return {
                    isValid: false,
                    errors: [`未知のスキーマ: ${schemaName}`],
                    data: null
                };
            }

            const result = this.validateObject(data, schema, schemaName);

            return {
                isValid: result.errors.length === 0,
                errors: result.errors,
                data: result.data
            };

        } catch (error) {
            return {
                isValid: false,
                errors: [`検証中にエラーが発生しました: ${error.message}`],
                data: null
            };
        }
    }

    /**
     * オブジェクトを検証
     * @param {*} data - 検証するデータ
     * @param {Object} schema - スキーマ
     * @param {string} path - フィールドパス
     * @returns {Object} 検証結果
     */
    validateObject(data, schema, path = '') {
        const errors = [];
        const validatedData = {};

        // データがnullまたはundefinedの場合
        if (data === null || data === undefined) {
            errors.push(`${path}: データが存在しません`);
            return { errors, data: null };
        }

        // データがオブジェクトでない場合
        if (typeof data !== 'object' || Array.isArray(data)) {
            errors.push(`${path}: オブジェクトである必要があります`);
            return { errors, data: null };
        }

        // 各フィールドを検証
        for (const [fieldName, fieldSchema] of Object.entries(schema)) {
            const fieldPath = path ? `${path}.${fieldName}` : fieldName;
            const fieldValue = data[fieldName];

            // 条件付き必須チェック
            if (fieldSchema.when) {
                const shouldValidate = this.checkCondition(data, fieldSchema.when);
                if (!shouldValidate) {
                    continue;
                }
            }

            // 必須チェック
            if (fieldSchema.required && (fieldValue === undefined || fieldValue === null)) {
                errors.push(`${fieldPath}${this.errorMessages.required}`);
                continue;
            }

            // 値が存在しない場合はデフォルト値を設定
            if (fieldValue === undefined || fieldValue === null) {
                if (fieldSchema.default !== undefined) {
                    validatedData[fieldName] = fieldSchema.default;
                }
                continue;
            }

            // フィールド検証
            const fieldResult = this.validateField(fieldValue, fieldSchema, fieldPath);
            errors.push(...fieldResult.errors);

            if (fieldResult.isValid) {
                validatedData[fieldName] = fieldResult.data;
            }
        }

        return { errors, data: validatedData };
    }

    /**
     * フィールドを検証
     * @param {*} value - 検証する値
     * @param {Object} schema - フィールドスキーマ
     * @param {string} path - フィールドパス
     * @returns {Object} 検証結果
     */
    validateField(value, schema, path) {
        const errors = [];
        let validatedValue = value;

        // 型チェック
        if (!this.checkType(value, schema.type)) {
            errors.push(`${path}${this.errorMessages.type}（期待: ${schema.type}, 実際: ${typeof value}）`);
            return { isValid: false, errors, data: null };
        }

        // 型別検証
        switch (schema.type) {
            case 'string':
                const stringResult = this.validateString(value, schema, path);
                errors.push(...stringResult.errors);
                validatedValue = stringResult.data;
                break;

            case 'number':
                const numberResult = this.validateNumber(value, schema, path);
                errors.push(...numberResult.errors);
                validatedValue = numberResult.data;
                break;

            case 'array':
                const arrayResult = this.validateArray(value, schema, path);
                errors.push(...arrayResult.errors);
                validatedValue = arrayResult.data;
                break;

            case 'object':
                if (schema.properties) {
                    const objectResult = this.validateObject(value, schema.properties, path);
                    errors.push(...objectResult.errors);
                    validatedValue = objectResult.data;
                }
                break;

            case 'boolean':
                // booleanは型チェックのみ
                break;
        }

        return {
            isValid: errors.length === 0,
            errors,
            data: validatedValue
        };
    }

    /**
     * 文字列を検証
     * @param {string} value - 検証する値
     * @param {Object} schema - スキーマ
     * @param {string} path - フィールドパス
     * @returns {Object} 検証結果
     */
    validateString(value, schema, path) {
        const errors = [];
        let validatedValue = value;

        // 長さチェック
        if (schema.minLength !== undefined && value.length < schema.minLength) {
            errors.push(`${path}${this.errorMessages.minLength.replace('{min}', schema.minLength)}`);
        }

        if (schema.maxLength !== undefined && value.length > schema.maxLength) {
            errors.push(`${path}${this.errorMessages.maxLength.replace('{max}', schema.maxLength)}`);
        }

        // 列挙値チェック
        if (schema.enum && !schema.enum.includes(value)) {
            errors.push(`${path}${this.errorMessages.enum.replace('{values}', schema.enum.join(', '))}`);
        }

        // フォーマットチェック
        if (schema.format) {
            const formatResult = this.validateFormat(value, schema.format, path);
            errors.push(...formatResult.errors);
        }

        // サニタイゼーション
        validatedValue = this.sanitizeString(value);

        return { errors, data: validatedValue };
    }

    /**
     * 数値を検証
     * @param {number} value - 検証する値
     * @param {Object} schema - スキーマ
     * @param {string} path - フィールドパス
     * @returns {Object} 検証結果
     */
    validateNumber(value, schema, path) {
        const errors = [];

        // 範囲チェック
        if (schema.min !== undefined && value < schema.min) {
            errors.push(`${path}${this.errorMessages.min.replace('{min}', schema.min)}`);
        }

        if (schema.max !== undefined && value > schema.max) {
            errors.push(`${path}${this.errorMessages.max.replace('{max}', schema.max)}`);
        }

        // NaNチェック
        if (isNaN(value)) {
            errors.push(`${path}: 有効な数値ではありません`);
        }

        return { errors, data: value };
    }

    /**
     * 配列を検
* @param {Array} value - 検証する値
     * @param {Object} schema - スキーマ
     * @param {string} path - フィールドパス
     * @returns {Object} 検証結果
     */
    validateArray(value, schema, path) {
        const errors = [];
        const validatedArray = [];

        // 長さチェック
        if (schema.minItems !== undefined && value.length < schema.minItems) {
            errors.push(`${path}${this.errorMessages.minItems.replace('{min}', schema.minItems)}`);
        }

        if (schema.maxItems !== undefined && value.length > schema.maxItems) {
            errors.push(`${path}${this.errorMessages.maxItems.replace('{max}', schema.maxItems)}`);
        }

        // 各要素を検証
        if (schema.items) {
            for (let i = 0; i < value.length; i++) {
                const itemPath = `${path}[${i}]`;
                const itemResult = this.validateField(value[i], schema.items, itemPath);
                errors.push(...itemResult.errors);

                if (itemResult.isValid) {
                    validatedArray.push(itemResult.data);
                }
            }
        } else {
            validatedArray.push(...value);
        }

        return { errors, data: validatedArray };
    }

    /**
     * フォーマットを検証
     * @param {string} value - 検証する値
     * @param {string} format - フォーマット名
     * @param {string} path - フィールドパス
     * @returns {Object} 検証結果
     */
    validateFormat(value, format, path) {
        const errors = [];

        switch (format) {
            case 'iso-date':
                if (!this.isValidISODate(value)) {
                    errors.push(`${path}: ISO 8601形式の日付である必要があります`);
                }
                break;

            case 'email':
                if (!this.isValidEmail(value)) {
                    errors.push(`${path}: 有効なメールアドレスである必要があります`);
                }
                break;

            case 'url':
                if (!this.isValidURL(value)) {
                    errors.push(`${path}: 有効なURLである必要があります`);
                }
                break;

            default:
                errors.push(`${path}: 未知のフォーマット: ${format}`);
        }

        return { errors };
    }

    /**
     * 型をチェック
     * @param {*} value - 検証する値
     * @param {string} expectedType - 期待する型
     * @returns {boolean} 型が正しいかどうか
     */
    checkType(value, expectedType) {
        switch (expectedType) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'boolean':
                return typeof value === 'boolean';
            case 'array':
                return Array.isArray(value);
            case 'object':
                return typeof value === 'object' && value !== null && !Array.isArray(value);
            default:
                return false;
        }
    }

    /**
     * 条件をチェック
     * @param {Object} data - データオブジェクト
     * @param {Object} condition - 条件
     * @returns {boolean} 条件を満たすかどうか
     */
    checkCondition(data, condition) {
        for (const [field, expectedValue] of Object.entries(condition)) {
            if (data[field] !== expectedValue) {
                return false;
            }
        }
        return true;
    }

    /**
     * 文字列をサニタイゼーション
     * @param {string} value - サニタイゼーションする文字列
     * @returns {string} サニタイゼーションされた文字列
     */
    sanitizeString(value) {
        if (typeof value !== 'string') return value;

        // HTMLタグを除去
        let sanitized = value.replace(/<[^>]*>/g, '');

        // 特殊文字をエスケープ
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');

        // 前後の空白を除去
        return sanitized.trim();
    }

    /**
     * ISO日付形式かどうかをチェック
     * @param {string} value - チェックする値
     * @returns {boolean} 有効なISO日付かどうか
     */
    isValidISODate(value) {
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
        return isoDateRegex.test(value) && !isNaN(Date.parse(value));
    }

    /**
     * 有効なメールアドレスかどうかをチェック
     * @param {string} value - チェックする値
     * @returns {boolean} 有効なメールアドレスかどうか
     */
    isValidEmail(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    }

    /**
     * 有効なURLかどうかをチェック
     * @param {string} value - チェックする値
     * @returns {boolean} 有効なURLかどうか
     */
    isValidURL(value) {
        try {
            new URL(value);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * データを正規化
     * @param {*} data - 正規化するデータ
     * @param {string} schemaName - スキーマ名
     * @returns {*} 正規化されたデータ
     */
    normalize(data, schemaName) {
        const validationResult = this.validate(data, schemaName);

        if (validationResult.isValid) {
            return validationResult.data;
        } else {
            throw new Error(`データ正規化エラー: ${validationResult.errors.join(', ')}`);
        }
    }

    /**
     * スキーマを取得
     * @param {string} schemaName - スキーマ名
     * @returns {Object} スキーマ
     */
    getSchema(schemaName) {
        return this.schemas[schemaName] || null;
    }

    /**
     * 利用可能なスキーマ名を取得
     * @returns {Array} スキーマ名の配列
     */
    getAvailableSchemas() {
        return Object.keys(this.schemas);
    }

    /**
     * カスタムスキーマを追加
     * @param {string} name - スキーマ名
     * @param {Object} schema - スキーマ定義
     */
    addSchema(name, schema) {
        this.schemas[name] = schema;
    }

    /**
     * デバッグ情報を取得
     * @returns {Object} デバッグ情報
     */
    getDebugInfo() {
        return {
            schemaCount: Object.keys(this.schemas).length,
            availableSchemas: this.getAvailableSchemas(),
            errorMessageCount: Object.keys(this.errorMessages).length
        };
    }
}

// Node.js環境での実行
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataValidator;
}

// ブラウザ環境での実行
if (typeof window !== 'undefined') {
    window.DataValidator = DataValidator;
}
