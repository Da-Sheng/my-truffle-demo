// HappyBag智能合约配置
import HappyBagABI from '../../assets/abi/HappyBag.json'
import BigNumber from 'bignumber.js'

// 智能合约地址 - 请替换为实际部署的合约地址
export const HAPPY_BAG_ADDRESS = '0xe934E635E57d7AF59319eec007cED77BCf302DAa' as const

// 导出合约ABI
export const HAPPY_BAG_ABI = HappyBagABI.abi

// 合约配置
export const happyBagConfig = {
  address: HAPPY_BAG_ADDRESS,
  abi: HAPPY_BAG_ABI,
} as const

// 红包状态枚举
export enum BagStatus {
  PENDING_DEPOSIT = 'pending_deposit', // 待充值
  AVAILABLE = 'available',             // 可领取
  WAITING = 'waiting',                 // 等待中（队列中但不能开）
  COMPLETED = 'completed'              // 已完成
}

// 红包信息类型定义
export interface BagInfo {
  totalAmount: BigNumber
  totalCount: BigNumber
  remainingCount: BigNumber
  remainingAmount: BigNumber
  startTime: BigNumber
  creator: string
  isActive: boolean
  isEqual: boolean
}

// 用户领取信息类型
export interface ClaimInfo {
  bagId: string
  amount: BigNumber
  timestamp: number
} 