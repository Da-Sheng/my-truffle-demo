// JJCoin智能合约交互hooks
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { parseEther, type Address } from 'viem'
import { jjCoinConfig, formatJJCAmount, parseJJCAmount } from '../contracts/jjCoin'

// 获取用户JJC余额
export function useJJCBalance(address?: Address) {
  return useReadContract({
    ...jjCoinConfig,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000, // 每10秒刷新一次
      staleTime: 5000,
    }
  })
}

// 获取代币价格（每ETH兑换的JJC数量）
export function useTokenPrice() {
  return useReadContract({
    ...jjCoinConfig,
    functionName: 'tokenPrice',
    query: {
      refetchInterval: 30000, // 每30秒刷新一次
      staleTime: 15000,
    }
  })
}

// 获取合约JJC余额
export function useContractJJCBalance() {
  return useReadContract({
    ...jjCoinConfig,
    functionName: 'getContractTokenBalance',
    query: {
      refetchInterval: 15000,
      staleTime: 10000,
    }
  })
}

// 检查用户是否为owner
export function useIsOwner() {
  const { address } = useAccount()
  return useReadContract({
    ...jjCoinConfig,
    functionName: 'owner',
    query: {
      enabled: !!address,
      select: (data: unknown) => {
        if (typeof data === 'string' && address) {
          return data.toLowerCase() === address.toLowerCase()
        }
        return false
      },
    }
  })
}

// 购买JJC代币（ETH兑换JJC）
export function useBuyJJC() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash })

  const buyJJC = (ethAmount: string) => {
    writeContract({
      ...jjCoinConfig,
      functionName: 'buyTokens',
      value: parseEther(ethAmount),
    })
  }

  return {
    buyJJC,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

// 转账JJC代币
export function useTransferJJC() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash })

  const transferJJC = (to: Address, amount: string) => {
    writeContract({
      ...jjCoinConfig,
      functionName: 'transfer',
      args: [to, parseJJCAmount(amount)],
    })
  }

  return {
    transferJJC,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

// OWNER权限：添加供应量
export function useAddSupply() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash })

  const addSupply = (amount: string) => {
    writeContract({
      ...jjCoinConfig,
      functionName: 'addTokensToContract',
      args: [parseJJCAmount(amount)],
    })
  }

  return {
    addSupply,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

// OWNER权限：调整价格
export function useUpdatePrice() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash })

  const updatePrice = (newPrice: string) => {
    writeContract({
      ...jjCoinConfig,
      functionName: 'setTokenPrice',
      args: [parseJJCAmount(newPrice)],
    })
  }

  return {
    updatePrice,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

// 格式化JJC金额显示
export { formatJJCAmount } 