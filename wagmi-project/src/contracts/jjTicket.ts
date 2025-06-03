import { parseEther, formatEther, type Address } from 'viem'
import JJTicketABI from '../../assets/abi/JJTicket.json'

// Sepolia测试网部署的JJTicket合约地址
export const JJTICKET_ADDRESS: Address = '0x04B55b50BFCFd8CC46322629DA5016fa2f9f8d0c'

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