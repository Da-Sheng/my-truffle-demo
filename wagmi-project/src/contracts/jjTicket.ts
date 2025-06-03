import { parseEther, formatEther, type Address } from 'viem'
import JJTicketABI from '../../assets/abi/JJTicket.json'

// JJTicket合约地址
export const JJTICKET_ADDRESS: Address = '0x58F09a2b634baf7A97eb4f08Ca47EdEaAB8ED908'

// JJTicket合约ABI
export const JJTICKET_ABI = JJTicketABI.abi

// JJTicket合约配置
export const jjTicketConfig = {
  address: JJTICKET_ADDRESS,
  abi: JJTICKET_ABI,
} as const

// 格式化JJC数量（从wei转换为可读格式）
export const formatJJCAmount = (amount: bigint): string => {
  return formatEther(amount)
}

// 解析JJC数量（从可读格式转换为wei）
export const parseJJCAmount = (amount: string): bigint => {
  return parseEther(amount)
} 