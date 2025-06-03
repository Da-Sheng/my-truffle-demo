import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { JJTICKET_ABI, JJTICKET_ADDRESS, formatJJCAmount, parseJJCAmount, jjTicketConfig } from '../contracts/jjTicket'
import { jjCoinConfig } from '../contracts/jjCoin'
import { keccak256, toBytes } from 'viem'

// 获取票务基本信息
export const useTicketInfo = () => {
  const { data: ticketPrice } = useReadContract({
    ...jjTicketConfig,
    functionName: 'ticketPrice',
  })

  const { data: totalTickets } = useReadContract({
    ...jjTicketConfig,
    functionName: 'totalTickets',
  })

  const { data: soldTickets } = useReadContract({
    ...jjTicketConfig,
    functionName: 'soldTickets',
  })

  const { data: owner } = useReadContract({
    ...jjTicketConfig,
    functionName: 'owner',
  })

  return {
    ticketPrice,
    totalTickets,
    soldTickets,
    owner,
    availableTickets: totalTickets && soldTickets ? Number(totalTickets) - Number(soldTickets) : 0
  }
}

// 获取可用票务数量
export const useAvailableTicketsCount = () => {
  return useReadContract({
    ...jjTicketConfig,
    functionName: 'getAvailableTicketsCount',
  })
}

// 获取所有hash
export const useAllHashes = () => {
  return useReadContract({
    ...jjTicketConfig,
    functionName: 'getAllHashes',
  })
}

// 获取用户购买的hash
export const useBuyerHashes = (address?: string) => {
  return useReadContract({
    ...jjTicketConfig,
    functionName: 'getBuyerHashes',
    args: address ? [address] : undefined,
  })
}

// 获取特定hash的信息
export const useTicketHashInfo = (hash?: string) => {
  return useReadContract({
    ...jjTicketConfig,
    functionName: 'getTicketInfo',
    args: hash ? [hash] : undefined,
  })
}

// 验证票务hash
export const useVerifyTicketHash = (hash?: string, buyer?: string) => {
  return useReadContract({
    ...jjTicketConfig,
    functionName: 'verifyTicketHash',
    args: hash && buyer ? [hash, buyer] : undefined,
  })
}

// JJC授权相关hooks
export const useJJCAllowance = (owner?: string, spender?: string) => {
  return useReadContract({
    ...jjCoinConfig,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
  })
}

export const useApproveJJC = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const approveJJC = (spender: string, amount: bigint) => {
    writeContract({
      ...jjCoinConfig,
      functionName: 'approve',
      args: [spender, amount],
    })
  }

  return {
    approveJJC,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error
  }
}

// 购买随机门票
export const usePurchaseRandomTicket = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const purchaseRandomTicket = () => {
    console.log('执行随机购票合约调用')
    writeContract({
      ...jjTicketConfig,
      functionName: 'purchaseRandomTicket',
    })
  }

  return {
    purchaseRandomTicket,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error
  }
}

// 购买指定hash门票
export const usePurchaseSpecificTicket = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const purchaseTicket = (ticketHash: string) => {
    // 确保传入的是正确格式的bytes32
    let formattedHash = ticketHash
    if (!ticketHash.startsWith('0x') || ticketHash.length !== 66) {
      formattedHash = keccak256(toBytes(ticketHash))
    }
    
    console.log('执行购票合约调用，Hash:', formattedHash)
    writeContract({
      ...jjTicketConfig,
      functionName: 'purchaseTicket',
      args: [formattedHash as `0x${string}`],
    })
  }

  return {
    purchaseTicket,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error
  }
}

// 管理员功能：添加票务hash
export const useAddTicketHashes = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const addTicketHashes = (hashes: string[]) => {
    // 将字符串转换为bytes32格式
    const bytes32Hashes = hashes.map(hashString => {
      // 如果已经是0x开头的64位hex格式，直接使用
      if (hashString.startsWith('0x') && hashString.length === 66) {
        return hashString as `0x${string}`
      }
      // 否则对字符串进行keccak256哈希，这样总是得到32字节的结果
      return keccak256(toBytes(hashString)) as `0x${string}`
    })
    
    console.log('原始字符串:', hashes)
    console.log('转换后的bytes32:', bytes32Hashes)
    
    writeContract({
      ...jjTicketConfig,
      functionName: 'addTicketHashes',
      args: [bytes32Hashes],
    })
  }

  return {
    addTicketHashes,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error
  }
}

// 管理员功能：标记hash已使用
export const useMarkHashAsUsed = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const markHashAsUsed = (ticketHash: string) => {
    writeContract({
      ...jjTicketConfig,
      functionName: 'markHashAsUsed',
      args: [ticketHash],
    })
  }

  return {
    markHashAsUsed,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error
  }
}

// 管理员功能：更新票价
export const useUpdateTicketPrice = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const updateTicketPrice = (newPrice: string) => {
    writeContract({
      ...jjTicketConfig,
      functionName: 'updateTicketPrice',
      args: [parseJJCAmount(newPrice)],
    })
  }

  return {
    updateTicketPrice,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error
  }
}

// 管理员功能：提取ETH
export const useWithdrawETH = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const withdrawETH = () => {
    writeContract({
      ...jjTicketConfig,
      functionName: 'withdrawETH',
    })
  }

  return {
    withdrawETH,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error
  }
}

// Re-export formatting function
export { formatJJCAmount } 