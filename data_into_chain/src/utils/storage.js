/**
 * localStorage 工具函数库
 * 支持数据过期、批量操作、类型安全
 */

// SSR兼容性检查
const isClient = typeof window !== 'undefined';
const getStorage = () => {
  if (!isClient) {
    // 服务端返回模拟对象
    return {
      getItem: () => null,
      setItem: () => { },
      removeItem: () => { },
      clear: () => { },
      hasOwnProperty: () => false,
      length: 0
    };
  }
  return localStorage;
};

// 设置数据（支持过期时间）
const setData = (key, value, expireTime = null) => {
  try {
    if (!isClient) return false; // SSR环境直接返回

    const storage = getStorage();
    const storageData = {
      value: value,
      timestamp: Date.now(),
      expire: expireTime ? Date.now() + expireTime : null
    };

    storage.setItem(key, JSON.stringify(storageData));
    return true;
  } catch (error) {
    console.error('存储数据失败:', error);
    return false;
  }
};

// 获取数据
const getData = (key, defaultValue = null) => {
  try {
    if (!isClient) return defaultValue; // SSR环境返回默认值

    const storage = getStorage();
    const stored = storage.getItem(key);

    if (!stored) {
      return defaultValue;
    }

    const storageData = JSON.parse(stored);

    // 检查是否过期
    if (storageData.expire && Date.now() > storageData.expire) {
      storage.removeItem(key);
      return defaultValue;
    }

    return storageData.value;
  } catch (error) {
    console.error('获取数据失败:', error);
    return defaultValue;
  }
};

// 删除数据
const removeData = (key) => {
  try {
    if (!isClient) return false;

    const storage = getStorage();
    storage.removeItem(key);
    return true;
  } catch (error) {
    console.error('删除数据失败:', error);
    return false;
  }
};

// 清空所有数据
const clearData = () => {
  try {
    if (!isClient) return false;

    const storage = getStorage();
    storage.clear();
    return true;
  } catch (error) {
    console.error('清空数据失败:', error);
    return false;
  }
};

// 检查数据是否存在
const hasData = (key) => {
  try {
    if (!isClient) return false;

    const storage = getStorage();
    const stored = storage.getItem(key);
    if (!stored) return false;

    const storageData = JSON.parse(stored);

    // 检查是否过期
    if (storageData.expire && Date.now() > storageData.expire) {
      storage.removeItem(key);
      return false;
    }

    return true;
  } catch (error) {
    console.error('检查数据失败:', error);
    return false;
  }
};

// 获取存储大小（估算）
const getStorageSize = () => {
  try {
    if (!isClient) return 0;

    const storage = getStorage();
    let total = 0;
    for (let key in storage) {
      if (storage.hasOwnProperty(key)) {
        total += storage[key].length + key.length;
      }
    }
    return total;
  } catch (error) {
    console.error('获取存储大小失败:', error);
    return 0;
  }
};

// 获取所有keys
const getAllKeys = () => {
  try {
    if (!isClient) return [];

    const storage = getStorage();
    return Object.keys(storage);
  } catch (error) {
    console.error('获取所有keys失败:', error);
    return [];
  }
};

// 批量设置数据
const setBatchData = (dataObject, expireTime = null) => {
  try {
    const results = {};
    for (const [key, value] of Object.entries(dataObject)) {
      results[key] = setData(key, value, expireTime);
    }
    return results;
  } catch (error) {
    console.error('批量设置数据失败:', error);
    return {};
  }
};

// 批量获取数据
const getBatchData = (keys, defaultValue = null) => {
  try {
    const results = {};
    keys.forEach(key => {
      results[key] = getData(key, defaultValue);
    });
    return results;
  } catch (error) {
    console.error('批量获取数据失败:', error);
    return {};
  }
};

// 清理过期数据
const cleanExpiredData = () => {
  try {
    if (!isClient) return 0;

    const storage = getStorage();
    const keys = getAllKeys();
    let cleanedCount = 0;

    keys.forEach(key => {
      const stored = storage.getItem(key);
      if (stored) {
        try {
          const storageData = JSON.parse(stored);
          if (storageData.expire && Date.now() > storageData.expire) {
            storage.removeItem(key);
            cleanedCount++;
          }
        } catch (e) {
          // 如果解析失败，可能是旧格式数据，跳过
        }
      }
    });

    console.log(`清理了 ${cleanedCount} 个过期数据`);
    return cleanedCount;
  } catch (error) {
    console.error('清理过期数据失败:', error);
    return 0;
  }
};

// 导出所有方法
export {
  setData,
  getData,
  removeData,
  clearData,
  hasData,
  getStorageSize,
  getAllKeys,
  setBatchData,
  getBatchData,
  cleanExpiredData
};

// 默认导出
export default {
  set: setData,
  get: getData,
  remove: removeData,
  clear: clearData,
  has: hasData,
  size: getStorageSize,
  keys: getAllKeys,
  setBatch: setBatchData,
  getBatch: getBatchData,
  cleanExpired: cleanExpiredData
}; 