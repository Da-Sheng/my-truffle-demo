/**
 * localStorage 工具函数库类型声明
 */

export function setData(key: string, value: any, expireTime?: number | null): boolean;
export function getData(key: string, defaultValue?: any): any;
export function removeData(key: string): boolean;
export function clearData(): boolean;
export function hasData(key: string): boolean;
export function getStorageSize(): number;
export function getAllKeys(): string[];
export function setBatchData(dataObject: Record<string, any>, expireTime?: number | null): Record<string, boolean>;
export function getBatchData(keys: string[], defaultValue?: any): Record<string, any>;
export function cleanExpiredData(): number;

declare const storage: {
  set: typeof setData;
  get: typeof getData;
  remove: typeof removeData;
  clear: typeof clearData;
  has: typeof hasData;
  size: typeof getStorageSize;
  keys: typeof getAllKeys;
  setBatch: typeof setBatchData;
  getBatch: typeof getBatchData;
  cleanExpired: typeof cleanExpiredData;
};

export default storage; 