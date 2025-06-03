// JJCoin智能合约配置
import JJCoinABI from '../../assets/abi/JJCoin.json'
import { parseEther, formatEther, type Address } from 'viem'

// Sepolia测试网部署的JJCoin合约地址
export const JJCOIN_ADDRESS = '0x043BfaBE7236a3aF5EE499D1874b013f42174014' as const

// 导出合约ABI
export const JJCOIN_ABI = JJCoinABI.abi

// 合约配置
export const jjCoinConfig = {
  address: JJCOIN_ADDRESS,
  abi: JJCOIN_ABI,
} as const

// JJCoin代币信息类型
export interface TokenInfo {
  totalSupply: bigint
  currentSupply: bigint
  remainingSupply: bigint
  currentPrice: bigint
  totalSold: bigint
  totalEthReceived: bigint
}

// 格式化JJC金额（假设JJC有18位小数）
export function formatJJCAmount(amount: bigint | undefined): string {
  if (!amount) return '0'
  return formatEther(amount)
}

// 解析JJC金额
export function parseJJCAmount(amount: string): bigint {
  return parseEther(amount)
} 