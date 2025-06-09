/**
 * 数据加密解密工具库
 * 提供多种16进制编码的加密解密方法
 */

// ==================== 基础16进制转换 ====================

/**
 * 字符串转16进制
 * @param {string} str - 要转换的字符串
 * @returns {string} 16进制字符串
 */
export const stringToHex = (str) => {
    // 使用TextEncoder确保正确的UTF-8编码
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    return Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
};

/**
 * 16进制转字符串
 * @param {string} hex - 16进制字符串
 * @returns {string} 解码后的字符串
 */
export const hexToString = (hex) => {

    // 将16进制转换为字节数组
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substring(i, i + 2), 16));
    }

    // 使用TextDecoder确保正确的UTF-8解码
    const decoder = new TextDecoder('utf-8');
    const uint8Array = new Uint8Array(bytes);
    return decoder.decode(uint8Array);
};

// 安全的16进制解码函数
export const safeHexToString = (hexData) => {
    try {
        if (!hexData || typeof hexData !== 'string') {
            return '无效数据';
        }

        const cleanHex = hexData.startsWith('0x') ? hexData.slice(2) : hexData;

        if (!isValidHex(cleanHex)) {
            return hexData;
        }

        const decoded = hexToString(cleanHex);
        return decoded || '解码失败';
    } catch (error) {
        console.error('16进制解码错误:', error);
        return hexData;
    }
};

// ==================== 工具函数 ====================

/**
 * 验证16进制字符串格式
 * @param {string} hex - 要验证的字符串
 * @returns {boolean} 是否为有效的16进制字符串
 */
export const isValidHex = (hex) => {
    return /^[0-9A-Fa-f]*$/.test(hex) && hex.length % 2 === 0;
};

/**
 * 生成随机16进制字符串
 * @param {number} length - 字符串长度（字节数）
 * @returns {string} 随机16进制字符串
 */
export const generateRandomHex = (length = 16) => {
    const array = new Uint8Array(length);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(array);
    } else {
        // 降级方案
        for (let i = 0; i < length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
    }
    return arrayBufferToHex(array.buffer);
};

// ==================== 导出所有方法 ====================

export default {
    // 基础转换
    stringToHex,
    hexToString,
    safeHexToString,

    // 工具函数
    isValidHex,
    generateRandomHex
};
